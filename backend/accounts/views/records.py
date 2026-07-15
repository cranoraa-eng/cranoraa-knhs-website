from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q

from ..models import (
    Transcript, TranscriptLineItem, TransferCertificate,
    CharacterCertificate, AchievementRecord, RecordRequest,
    Notification, Grade,
)
from ..serializers import (
    TranscriptSerializer, TranscriptLineItemSerializer,
    TransferCertificateSerializer, CharacterCertificateSerializer,
    AchievementRecordSerializer, RecordRequestSerializer,
    full_name,
)
from ..permissions import IsAdmin, IsAdminOrStaff, IsAdminOrReadOnly


class TranscriptViewSet(viewsets.ModelViewSet):
    serializer_class = TranscriptSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Transcript.objects.select_related('student', 'generated_by').prefetch_related('items__subject')
        if user.role == 'student':
            qs = qs.filter(student=user)
        elif user.role == 'parent':
            profile = getattr(user, 'profile', None)
            linked_ids = profile.linked_students.values_list('id', flat=True) if profile else []
            qs = qs.filter(student_id__in=linked_ids)
        elif user.role == 'staff':
            qs = qs.filter(student__enrollments__classroom__teacher=user).distinct()
        return qs

    @action(detail=True, methods=['post'])
    def generate(self, request, pk=None):
        """Generate transcript from the student's grades."""
        if request.user.role not in ['admin', 'staff']:
            return Response({'error': 'Unauthorized'}, status=403)

        transcript = self.get_object()
        transcript.generate_from_grades()

        # Populate line items from Grade model
        grades_by_subject = {}
        grades = Grade.objects.filter(
            student=transcript.student,
            academic_year=transcript.school_year,
            grade_type='final_grade',
            raw_score__isnull=False,
        ).select_related('subject')

        for grade in grades:
            subject_id = grade.subject_id
            if subject_id not in grades_by_subject:
                grades_by_subject[subject_id] = {'subject': grade.subject, 'quarters': {}}
            grades_by_subject[subject_id]['quarters'][grade.quarter] = float(grade.raw_score)

        for subject_id, data in grades_by_subject.items():
            quarters = data['quarters']
            TranscriptLineItem.objects.update_or_create(
                transcript=transcript,
                subject=data['subject'],
                defaults={
                    'q1': quarters.get(1),
                    'q2': quarters.get(2),
                    'q3': quarters.get(3),
                    'q4': quarters.get(4),
                }
            )
            # Compute final average on the line item
            item = TranscriptLineItem.objects.get(transcript=transcript, subject=data['subject'])
            item.compute_final()

        transcript.refresh_from_db()
        serializer = self.get_serializer(transcript)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def finalize(self, request, pk=None):
        """Mark transcript as final (locked)."""
        if request.user.role not in ['admin', 'staff']:
            return Response({'error': 'Unauthorized'}, status=403)
        transcript = self.get_object()
        transcript.status = 'final'
        transcript.generated_by = request.user
        transcript.save(update_fields=['status', 'generated_by', 'updated_at'])
        return Response({'status': 'final'})

    @action(detail=True, methods=['get'])
    def pdf(self, request, pk=None):
        """Generate PDF for transcript."""
        transcript = self.get_object()
        from ..pdf_export import generate_transcript_pdf
        return generate_transcript_pdf(transcript)


class TransferCertificateViewSet(viewsets.ModelViewSet):
    serializer_class = TransferCertificateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = TransferCertificate.objects.select_related('student', 'issued_by')
        if user.role == 'student':
            qs = qs.filter(student=user)
        elif user.role == 'parent':
            profile = getattr(user, 'profile', None)
            linked_ids = profile.linked_students.values_list('id', flat=True) if profile else []
            qs = qs.filter(student_id__in=linked_ids)
        return qs

    @action(detail=True, methods=['post'])
    def process_request(self, request, pk=None):
        """Staff/admin processes a TC request (approve, mark ready, release)."""
        if request.user.role not in ['admin', 'staff']:
            return Response({'error': 'Unauthorized'}, status=403)

        tc = self.get_object()
        new_status = request.data.get('status')
        if new_status not in ['processing', 'ready', 'released', 'cancelled']:
            return Response({'error': 'Invalid status'}, status=400)

        tc.status = new_status
        if new_status in ['released']:
            tc.issued_by = request.user
            tc.issued_at = timezone.now()
        tc.save()

        # Create record request update if linked
        RecordRequest.objects.filter(
            record_type='transfer_certificate',
            reference_record_id=tc.id,
            status__in=['pending', 'processing'],
        ).update(status=new_status, handled_by=request.user)

        return Response(TransferCertificateSerializer(tc).data)

    @action(detail=True, methods=['get'])
    def pdf(self, request, pk=None):
        tc = self.get_object()
        from ..pdf_export import generate_transfer_certificate_pdf
        return generate_transfer_certificate_pdf(tc)


class CharacterCertificateViewSet(viewsets.ModelViewSet):
    serializer_class = CharacterCertificateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = CharacterCertificate.objects.select_related('student', 'issued_by')
        if user.role == 'student':
            qs = qs.filter(student=user)
        elif user.role == 'parent':
            profile = getattr(user, 'profile', None)
            linked_ids = profile.linked_students.values_list('id', flat=True) if profile else []
            qs = qs.filter(student_id__in=linked_ids)
        return qs

    @action(detail=True, methods=['post'])
    def process_request(self, request, pk=None):
        if request.user.role not in ['admin', 'staff']:
            return Response({'error': 'Unauthorized'}, status=403)

        cc = self.get_object()
        new_status = request.data.get('status')
        if new_status not in ['approved', 'ready', 'released', 'cancelled']:
            return Response({'error': 'Invalid status'}, status=400)

        cc.status = new_status
        if 'character_rating' in request.data:
            cc.character_rating = request.data['character_rating']
        if new_status in ['released']:
            cc.issued_by = request.user
            cc.issued_at = timezone.now()
        cc.save()

        RecordRequest.objects.filter(
            record_type='character_certificate',
            reference_record_id=cc.id,
            status__in=['pending', 'processing'],
        ).update(status=new_status, handled_by=request.user)

        return Response(CharacterCertificateSerializer(cc).data)

    @action(detail=True, methods=['get'])
    def pdf(self, request, pk=None):
        cc = self.get_object()
        from ..pdf_export import generate_character_certificate_pdf
        return generate_character_certificate_pdf(cc)


class AchievementRecordViewSet(viewsets.ModelViewSet):
    serializer_class = AchievementRecordSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = AchievementRecord.objects.select_related('student', 'verified_by')
        if user.role == 'student':
            qs = qs.filter(student=user)
        elif user.role == 'parent':
            profile = getattr(user, 'profile', None)
            linked_ids = profile.linked_students.values_list('id', flat=True) if profile else []
            qs = qs.filter(student_id__in=linked_ids)
        elif user.role == 'staff':
            qs = qs.filter(student__enrollments__classroom__teacher=user).distinct()
        return qs

    def perform_create(self, serializer):
        if self.request.user.role == 'student':
            serializer.save()
        else:
            serializer.save(is_verified=True, verified_by=self.request.user)

    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        if request.user.role not in ['admin', 'staff']:
            return Response({'error': 'Unauthorized'}, status=403)
        achievement = self.get_object()
        achievement.is_verified = True
        achievement.verified_by = request.user
        achievement.save(update_fields=['is_verified', 'verified_by', 'updated_at'])
        return Response(AchievementRecordSerializer(achievement).data)


class RecordRequestViewSet(viewsets.ModelViewSet):
    serializer_class = RecordRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = RecordRequest.objects.select_related('requestor', 'student', 'handled_by')
        if user.role == 'student':
            qs = qs.filter(requestor=user)
        elif user.role == 'parent':
            profile = getattr(user, 'profile', None)
            linked_ids = profile.linked_students.values_list('id', flat=True) if profile else []
            qs = qs.filter(Q(requestor=user) | Q(student_id__in=linked_ids))
        elif user.role in ['admin', 'staff']:
            pass  # see all
        return qs

    def perform_create(self, serializer):
        serializer.save(requestor=self.request.user)

    @action(detail=True, methods=['post'])
    def process_request(self, request, pk=None):
        """Staff/admin updates request status."""
        if request.user.role not in ['admin', 'staff']:
            return Response({'error': 'Unauthorized'}, status=403)

        record_req = self.get_object()
        new_status = request.data.get('status')
        if new_status not in ['pending', 'processing', 'ready', 'released', 'rejected', 'cancelled']:
            return Response({'error': 'Invalid status'}, status=400)

        record_req.status = new_status
        record_req.handled_by = request.user
        if 'admin_notes' in request.data:
            record_req.admin_notes = request.data['admin_notes']
        record_req.save()

        # Notify requestor
        Notification.objects.create(
            recipient=record_req.requestor,
            notification_type='system',
            title=f'Record Request {new_status.title()}',
            message=f'Your {record_req.get_record_type_display()} request has been {new_status}.',
            link='/records',
        )

        return Response(RecordRequestSerializer(record_req).data)
