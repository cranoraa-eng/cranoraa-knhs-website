from rest_framework import viewsets, status, filters, parsers
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q, Count, F
from django.db import transaction
import logging

from ..models import (
    User, Profile, Classroom, StudentClassEnrollment,
    Notification, EnrollmentApplication, EnrollmentDocument,
    EnrollmentStatusHistory, SystemSetting, EnrollmentWaitlist,
    ParentLink,
)
from ..serializers import (
    EnrollmentApplicationSerializer,
    EnrollmentDocumentSerializer,
    EnrollmentStatusHistorySerializer,
    EnrollmentWaitlistSerializer,
    full_name,
)
from ..permissions import IsAdmin
from ..throttles import EnrollmentRateThrottle
from ..storage import upload_file
from ..pdf_export import enrollment_form_response, enrollment_summary_response

logger = logging.getLogger(__name__)


class EnrollmentWaitlistViewSet(viewsets.ModelViewSet):
    serializer_class = EnrollmentWaitlistSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'staff']:
            return EnrollmentWaitlist.objects.select_related('student', 'classroom', 'application')
        return EnrollmentWaitlist.objects.select_related('student', 'classroom', 'application').filter(student=user)

    def perform_create(self, serializer):
        if self.request.user.role not in ['admin', 'staff']:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admins can manage waitlist")
        classroom = serializer.validated_data['classroom']
        last_pos = EnrollmentWaitlist.objects.filter(classroom=classroom, status='waiting').order_by('-position').first()
        position = (last_pos.position + 1) if last_pos else 1
        serializer.save(position=position)

    @action(detail=True, methods=['post'], url_path='process')
    def process(self, request, pk=None):
        """Admin: move from waiting → offered, or handle accept/decline."""
        if request.user.role not in ['admin', 'staff']:
            return Response({'error': 'Unauthorized'}, status=403)
        entry = self.get_object()
        action_val = request.data.get('action')
        if action_val == 'offer':
            entry.status = 'offered'
            entry.offered_at = timezone.now()
            entry.response_deadline = timezone.now() + timezone.timedelta(days=3)
            entry.save()
        elif action_val == 'accept':
            entry.status = 'accepted'
            entry.save()
        elif action_val == 'decline':
            entry.status = 'declined'
            entry.save()
            EnrollmentWaitlist.objects.filter(
                classroom=entry.classroom, position__gt=entry.position, status='waiting'
            ).update(position=F('position') - 1)
        else:
            return Response({'error': 'action must be offer, accept, or decline'}, status=400)
        return Response(EnrollmentWaitlistSerializer(entry).data)


class EnrollmentApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = EnrollmentApplicationSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['first_name', 'last_name', 'email', 'enrollment_number', 'lrn']
    ordering_fields = ['submitted_at', 'last_name', 'grade_level', 'status', 'school_year']
    ordering = ['-submitted_at']

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        if self.action in ('start_review', 'reject', 'enroll_student', 'assign_section',
                           'verify_document', 'reject_document', 'request_requirements',
                           'destroy', 'update', 'partial_update', 'bulk_action',
                           'approve_application', 'update_classroom_capacity', 'delete_application'):
            return [IsAdmin()]
        if self.action == 'track':
            return [AllowAny()]
        if self.action in ('list', 'retrieve', 'analytics', 'export_csv',
                           'export_form_pdf', 'export_summary_pdf'):
            return [IsAuthenticated()]
        return [IsAuthenticated()]

    def get_throttles(self):
        if self.action == 'create':
            return [EnrollmentRateThrottle()]
        if self.action == 'track':
            return []
        return super().get_throttles()

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return EnrollmentApplication.objects.none()
        if user.role == 'admin' or user.is_staff:
            qs = EnrollmentApplication.objects.all()
            status_filter = self.request.query_params.get('status')
            if status_filter:
                qs = qs.filter(status=status_filter)
            grade_filter = self.request.query_params.get('grade_level')
            if grade_filter:
                qs = qs.filter(grade_level=grade_filter)
            enrollment_type = self.request.query_params.get('enrollment_type')
            if enrollment_type:
                qs = qs.filter(enrollment_type=enrollment_type)
            school_year = self.request.query_params.get('school_year')
            if school_year:
                qs = qs.filter(school_year=school_year)
            date_from = self.request.query_params.get('date_from')
            if date_from:
                qs = qs.filter(submitted_at__gte=date_from)
            date_to = self.request.query_params.get('date_to')
            if date_to:
                qs = qs.filter(submitted_at__lte=date_to)
            from django.db.models import Prefetch
            return qs.select_related('enrolled_student', 'assigned_classroom', 'linked_parent', 'reviewed_by').prefetch_related(
                'documents',
                Prefetch('status_history', queryset=EnrollmentStatusHistory.objects.select_related('changed_by')),
            )
        return EnrollmentApplication.objects.filter(email=user.email)

    def create(self, request, *args, **kwargs):
        try:
            # Enforce enrollment_open setting
            system_settings = SystemSetting.get_settings()
            if not system_settings.enrollment_open:
                return Response(
                    {'error': 'Enrollment is currently closed. Please try again later.'},
                    status=status.HTTP_403_FORBIDDEN
                )

            doc_fields = [
                'birth_certificate', 'report_card', 'form_138',
                'certificate_of_completion', 'good_moral_certificate',
                'id_picture', 'last_school_attended_cert',
            ]
            uploaded_urls = {}
            upload_errors = []
            for field_name in doc_fields:
                if field_name in request.FILES:
                    f = request.FILES[field_name]
                    url, err = upload_file(f, bucket_key='enrollment-docs',
                                           folder=f"applications/{field_name}")
                    if err:
                        upload_errors.append(f"{field_name}: {err}")
                    else:
                        uploaded_urls[field_name] = url

            if upload_errors:
                return Response(
                    {'error': 'Document upload failed. Please check your files and try again.', 'details': upload_errors},
                    status=status.HTTP_400_BAD_REQUEST
                )

            data = request.data.copy()
            for field_name, url in uploaded_urls.items():
                data[field_name] = url

            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            application = serializer.save()

            for field_name, url in uploaded_urls.items():
                doc_type_map = {
                    'birth_certificate': 'birth_certificate',
                    'report_card': 'report_card',
                    'form_138': 'form_138',
                    'certificate_of_completion': 'certificate_of_completion',
                    'good_moral_certificate': 'good_moral',
                    'id_picture': 'id_picture',
                    'last_school_attended_cert': 'last_school_attended',
                }
                doc_type = doc_type_map.get(field_name, 'other')
                EnrollmentDocument.objects.create(
                    application=application,
                    document_type=doc_type,
                    file_url=url,
                    file_name=getattr(request.FILES[field_name], 'name', ''),
                )

            EnrollmentStatusHistory.objects.create(
                application=application,
                to_status='pending',
                notes='Application submitted',
            )

            admin_users = User.objects.filter(role='admin', is_active=True)
            for admin in admin_users:
                Notification.objects.create(
                    recipient=admin,
                    notification_type='system',
                    title='New Enrollment Application',
                    message=f'{application.full_name} submitted a Grade {application.grade_level} application ({application.enrollment_number}).',
                    link='/enrollment-management',
                )

            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            import traceback
            logger.error(f"Enrollment application error: {str(e)}\n{traceback.format_exc()}")
            if hasattr(e, 'detail'):
                return Response({'error': e.detail}, status=status.HTTP_400_BAD_REQUEST)
            return Response({'error': f'Failed to submit: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def track(self, request):
        number = request.query_params.get('number', '')
        email = request.query_params.get('email', '')
        if not number and not email:
            return Response({'error': 'Provide enrollment number or email'}, status=400)
        qs = EnrollmentApplication.objects.all()
        if number:
            qs = qs.filter(enrollment_number__iexact=number)
        elif email:
            qs = qs.filter(email__iexact=email)
        app = qs.select_related('assigned_classroom').prefetch_related('documents', 'status_history').first()
        if not app:
            return Response({'error': 'No application found'}, status=404)
        return Response({
            'enrollment_number': app.enrollment_number,
            'status': app.status,
            'full_name': app.full_name,
            'grade_level': app.grade_level,
            'strand': app.strand,
            'submitted_at': app.submitted_at,
            'assigned_classroom_name': app.assigned_classroom.name if app.assigned_classroom else None,
            'remarks': app.remarks,
            'lrn': app.lrn or '',
            'enrolled_student_email': app.enrolled_student.email if app.enrolled_student else None,
            'temp_password_display': app.temp_password_display if app.status == 'enrolled' and app.enrolled_student and app.enrolled_student.must_change_password else None,
            'documents': [{'id': d.id, 'document_type_display': d.get_document_type_display(),
                           'verification_status': d.verification_status,
                           'verification_status_display': d.get_verification_status_display()} for d in app.documents.all()],
            'status_history': [{'id': h.id, 'from_status_display': h.get_from_status_display() if h.from_status else None,
                                'to_status_display': h.get_to_status_display(), 'notes': h.notes,
                                'created_at': h.created_at} for h in app.status_history.all()],
        })

    @action(detail=True, methods=['post'], url_path='start-review')
    def start_review(self, request, pk=None):
        """Move application to under_review status (triggered when admin opens a pending application)."""
        application = self.get_object()
        user = request.user
        remarks = request.data.get('remarks', '')
        # Only move to under_review if currently pending
        if application.status == 'pending':
            from_status = application.status
            application.status = 'under_review'
            application.reviewed_by = user
            application.reviewed_at = timezone.now()
            if remarks:
                application.remarks = remarks
            application.save()
            EnrollmentStatusHistory.objects.create(
                application=application, from_status=from_status,
                to_status='under_review', changed_by=user,
                notes=remarks or 'Application opened for review'
            )
            return Response({'status': 'Application is now under review'})
        # Already past pending — just return current status, no change
        return Response({'status': application.status})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        application = self.get_object()
        user = request.user
        remarks = request.data.get('remarks', 'Provide reason for rejection.')
        from_status = application.status
        application.status = 'rejected'
        application.remarks = remarks
        application.reviewed_by = user
        application.reviewed_at = timezone.now()
        application.save()
        EnrollmentStatusHistory.objects.create(application=application, from_status=from_status,
            to_status='rejected', changed_by=user, notes=remarks)
        self._safe_notify_user(application, 'Application Rejected',
            f'Your application has been rejected. Reason: {remarks}', '/track-enrollment')
        return Response({'status': 'Application rejected'})

    @action(detail=True, methods=['post'])
    def approve_application(self, request, pk=None):
        application = self.get_object()
        user = request.user
        remarks = request.data.get('remarks', '')
        if application.status not in ('under_review', 'pending_requirements', 'pending'):
            return Response({'error': f'Cannot approve: status is {application.status}'}, status=400)
        from_status = application.status
        application.status = 'approved'
        application.remarks = remarks or application.remarks
        application.reviewed_by = user
        application.reviewed_at = timezone.now()
        application.save()
        EnrollmentStatusHistory.objects.create(application=application, from_status=from_status,
            to_status='approved', changed_by=user, notes=remarks or 'Application approved')
        self._safe_notify_user(application, 'Application Approved',
            'Your application has been approved.', '/track-enrollment')
        return Response({'status': 'Application approved'})

    @action(detail=True, methods=['post'])
    def enroll_student(self, request, pk=None):
        try:
            application = self.get_object()
            user = request.user
            if application.status != 'approved':
                return Response({'error': 'Application must be approved before enrollment'}, status=400)
            if application.enrolled_student:
                return Response({'error': 'Student account already exists'}, status=400)

            import re, secrets
            lrn = (application.lrn or '').strip()
            if lrn and len(lrn) == 12 and lrn.isdigit():
                username = lrn
                if User.objects.filter(username=username).exists():
                    return Response({'error': 'A student account with this LRN already exists'}, status=400)
            else:
                # Keep a non-name fallback only for applications without a usable LRN.
                username = f"student.{secrets.token_hex(4)}"
                while User.objects.filter(username=username).exists():
                    username = f"student.{secrets.token_hex(4)}"

            temp_password = secrets.token_urlsafe(12)
            student_user = User(username=username, email=application.email or None,
                first_name=application.first_name, last_name=application.last_name,
                role='student', is_verified=True, is_approved=True, must_change_password=True, account_status='active')
            student_user.set_password(temp_password)
            student_user.save()

            profile, _ = Profile.objects.get_or_create(user=student_user)
            profile.lrn = lrn; profile.grade_level = application.grade_level
            profile.phone_number = application.phone_number or ''
            profile.address = f"{application.street_address}, {application.barangay}, {application.city_municipality}, {application.province}"
            profile.date_of_birth = application.date_of_birth; profile.sex = application.sex
            profile.middle_name = application.middle_name or ''
            profile.father_name = application.father_name or ''; profile.mother_name = application.mother_name or ''
            profile.nationality = application.nationality or 'Filipino'
            if lrn: profile.registration_number = lrn
            profile.save()

            parent_email = request.data.get('parent_email', '') or application.mother_email or application.father_email or application.guardian_email
            if parent_email:
                try:
                    parent_user = User.objects.filter(email=parent_email).first()
                    if not parent_user:
                        parent_clean = re.sub(r'[^a-z]', '', (application.last_name or 'parent').lower().split()[0])
                        parent_username = f"parent.{parent_clean}.{secrets.token_hex(2)}"
                        while User.objects.filter(username=parent_username).exists():
                            parent_username = f"parent.{parent_clean}.{secrets.token_hex(2)}"
                        parent_first = 'Parent'
                        if application.father_name and application.father_name.strip():
                            parent_first = application.father_name.strip().split()[0]
                        elif application.mother_name and application.mother_name.strip():
                            parent_first = application.mother_name.strip().split()[0]
                        parent_user = User(username=parent_username, email=parent_email,
                            first_name=parent_first, last_name=application.last_name, role='parent',
                            is_verified=True, is_approved=True, must_change_password=True, account_status='active')
                        parent_user.set_password(secrets.token_urlsafe(12)); parent_user.save()
                        pp, _ = Profile.objects.get_or_create(user=parent_user)
                        pp.phone_number = application.father_contact or application.mother_contact or application.guardian_contact or ''
                        pp.save()
                        self._safe_notify_user(parent_user, 'Parent Account Created',
                            f'Parent account created. Username: {parent_username}', '/login')
                    parent_profile_obj = getattr(parent_user, 'profile', None)
                    if parent_profile_obj:
                        parent_profile_obj.linked_students.add(student_user); parent_profile_obj.save()
                    ParentLink.objects.get_or_create(parent=parent_user, student=student_user,
                        defaults={'application': application, 'relationship': application.guardian_relationship or 'parent', 'is_primary': True})
                    application.linked_parent = parent_user
                    application.save(update_fields=['linked_parent'])
                    self._safe_notify_user(parent_user, 'Child Enrolled',
                        f'Your child {application.full_name} has been enrolled.', '/parent-dashboard')
                except Exception as pe:
                    logger.error(f"Parent linking error: {pe}")

            classroom_id = request.data.get('classroom_id')
            if not classroom_id:
                try: classroom_id = self._auto_assign_section(application)
                except Exception as ae: logger.error(f"Auto-assign error: {ae}")

            classroom_name = ''
            if classroom_id:
                try:
                    classroom = Classroom.objects.get(id=classroom_id)
                    StudentClassEnrollment.objects.get_or_create(student=student_user, classroom=classroom)
                    application.assigned_classroom = classroom; classroom_name = classroom.name
                    self._safe_notify_user(student_user, 'Section Assigned',
                        f'You have been assigned to {classroom.name}.', '/my-classes')
                except Exception as ce: logger.error(f"Classroom error: {ce}")

            from_status = application.status
            application.enrolled_student = student_user
            application.status = 'enrolled'
            application.remarks = f'Enrolled on {timezone.now().strftime("%Y-%m-%d %H:%M")}'
            application.reviewed_by = user; application.reviewed_at = timezone.now()
            application.temp_password_display = temp_password
            application.save()
            EnrollmentStatusHistory.objects.create(application=application, from_status=from_status,
                to_status='enrolled', changed_by=user, notes=f'Student account created. Username: {username}')
            self._safe_notify_user(student_user, 'Enrollment Complete',
                f'Welcome! Enrollment complete. Username: {username}', '/dashboard')
            return Response({'status': 'Enrollment completed', 'student_id': student_user.id,
                'username': username, 'temp_password': temp_password,
                'assigned_classroom': classroom_id, 'classroom_name': classroom_name})
        except Exception as e:
            import traceback
            logger.error(f"enroll_student error: {str(e)}\n{traceback.format_exc()}")
            return Response({'error': f'Enrollment failed: {str(e)}'}, status=500)

    def _auto_assign_section(self, application):
        from django.db.models import Count, F
        available = Classroom.objects.filter(grade_level=application.grade_level
        ).annotate(current_count=Count('enrollments')
        ).filter(current_count__lt=F('capacity')).order_by('current_count').first()
        return available.id if available else None

    @action(detail=True, methods=['post'])
    def assign_section(self, request, pk=None):
        application = self.get_object()
        classroom_id = request.data.get('classroom_id')
        if not classroom_id:
            return Response({'error': 'classroom_id is required'}, status=400)
        try:
            classroom = Classroom.objects.get(id=classroom_id)
            current_count = StudentClassEnrollment.objects.filter(classroom=classroom).count()
            capacity = classroom.capacity or 40
            if current_count >= capacity:
                return Response({'error': f'{classroom.name} is at full capacity ({current_count}/{capacity})'}, status=400)
            application.assigned_classroom = classroom
            application.grade_level = classroom.grade_level
            application.save()
            return Response({'status': f'Section set to {classroom.name}'})
        except Classroom.DoesNotExist:
            return Response({'error': 'Classroom not found'}, status=404)

    @action(detail=True, methods=['post'])
    def verify_document(self, request, pk=None):
        doc_id = request.data.get('document_id')
        if not doc_id:
            return Response({'error': 'document_id is required'}, status=400)
        try:
            doc = EnrollmentDocument.objects.get(id=doc_id, application_id=pk)
            doc.verification_status = 'verified'
            doc.admin_notes = request.data.get('notes', doc.admin_notes or '')
            doc.save()
            return Response({'status': 'Document verified'})
        except EnrollmentDocument.DoesNotExist:
            return Response({'error': 'Document not found'}, status=404)

    @action(detail=True, methods=['post'])
    def reject_document(self, request, pk=None):
        doc_id = request.data.get('document_id')
        notes = request.data.get('notes', 'Document rejected')
        if not doc_id:
            return Response({'error': 'document_id is required'}, status=400)
        try:
            doc = EnrollmentDocument.objects.get(id=doc_id, application_id=pk)
            doc.verification_status = 'rejected'; doc.admin_notes = notes; doc.save()
            return Response({'status': 'Document rejected', 'notes': notes})
        except EnrollmentDocument.DoesNotExist:
            return Response({'error': 'Document not found'}, status=404)

    @action(detail=True, methods=['post'])
    def request_requirements(self, request, pk=None):
        application = self.get_object()
        user = request.user
        message = request.data.get('message', 'Please submit the missing requirements.')
        doc_types = request.data.get('document_types', [])
        from_status = application.status
        application.status = 'pending_requirements'; application.remarks = message; application.save()
        EnrollmentStatusHistory.objects.create(application=application, from_status=from_status,
            to_status='pending_requirements', changed_by=user, notes=message)
        if doc_types:
            EnrollmentDocument.objects.filter(application=application, document_type__in=doc_types).update(verification_status='missing')
        self._safe_notify_user(application, 'Additional Requirements Needed', message, '/track-enrollment')
        return Response({'status': 'Requirements requested', 'message': message})

    @action(detail=True, methods=['post'])
    def bulk_action(self, request, pk=None):
        action_type = request.data.get('action')
        if action_type == 'start_review': return self.start_review(request, pk)
        elif action_type == 'reject': return self.reject(request, pk)
        elif action_type == 'enroll': return self.enroll_student(request, pk)
        return Response({'error': 'Unknown action'}, status=400)

    @action(detail=True, methods=['delete'])
    def delete_application(self, request, pk=None):
        application = self.get_object()
        if application.enrolled_student:
            return Response({'error': 'Cannot delete: student account exists'}, status=400)
        enrollment_number = application.enrollment_number
        application.delete()
        return Response({'status': f'{enrollment_number} deleted'})

    @action(detail=False, methods=['get'])
    def analytics(self, request):
        from django.db.models.functions import TruncDate
        qs = EnrollmentApplication.objects.all() if (request.user.role == 'admin' or request.user.is_staff) else self.get_queryset()
        try:
            status_counts = qs.values('status').annotate(count=Count('id')).order_by('status')
            grade_level_dist = qs.values('grade_level').annotate(count=Count('id')).order_by('grade_level')
            daily_counts = qs.annotate(creation_date=TruncDate('submitted_at')).values('creation_date').annotate(count=Count('id')).order_by('-creation_date')[:30]
            enrollment_type_dist = qs.values('enrollment_type').annotate(count=Count('id'))
            total = qs.count(); approved = qs.filter(status='approved').count()
            rejected = qs.filter(status='rejected').count(); enrolled = qs.filter(status='enrolled').count()
            pending = qs.filter(status='pending').count()
            return Response({
                'total': total, 'pending': pending, 'approved': approved, 'rejected': rejected, 'enrolled': enrolled,
                'approval_rate': round((approved + enrolled) / total * 100, 1) if total else 0,
                'rejection_rate': round(rejected / total * 100, 1) if total else 0,
                'status_breakdown': {s['status']: s['count'] for s in status_counts},
                'grade_level_breakdown': {g['grade_level']: g['count'] for g in grade_level_dist},
                'daily_applications': [{'date': d['creation_date'].isoformat() if d['creation_date'] else None, 'count': d['count']} for d in daily_counts],
                'enrollment_type_breakdown': {e['enrollment_type']: e['count'] for e in enrollment_type_dist},
            })
        except Exception as e:
            logger.error(f"Analytics error: {e}", exc_info=True)
            return Response({'total': qs.count(), 'pending': 0, 'approved': 0, 'rejected': 0, 'enrolled': 0,
                'approval_rate': 0, 'rejection_rate': 0, 'status_breakdown': {}, 'grade_level_breakdown': {},
                'daily_applications': [], 'enrollment_type_breakdown': {}})

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        import csv as csv_mod
        from django.http import HttpResponse
        qs = self.get_queryset()
        status_filter = request.query_params.get('status', '')
        if status_filter: qs = qs.filter(status=status_filter)
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="enrollment_applications_{timezone.now().strftime("%Y%m%d")}.csv"'
        writer = csv_mod.writer(response)
        writer.writerow(['Enrollment #', 'Last Name', 'First Name', 'Middle Name', 'Sex', 'Grade Level', 'Strand', 'Status', 'Email', 'Phone', 'Submitted'])
        for app in qs:
            writer.writerow([app.enrollment_number, app.last_name, app.first_name, app.middle_name,
                app.get_sex_display(), app.grade_level, app.strand or '', app.get_status_display(),
                app.email, app.phone_number, app.submitted_at.strftime('%Y-%m-%d')])
        return response

    @action(detail=False, methods=['get'], url_path='export-form-pdf')
    def export_form_pdf(self, request):
        app_id = request.query_params.get('id')
        if not app_id: return Response({'error': 'id required'}, status=400)
        try: application = self.get_queryset().get(id=app_id)
        except EnrollmentApplication.DoesNotExist: return Response({'error': 'Not found'}, status=404)
        return enrollment_form_response(application)

    @action(detail=False, methods=['get'], url_path='export-summary-pdf')
    def export_summary_pdf(self, request):
        qs = self.get_queryset(); filters = {}
        for param, field in [('status', 'status'), ('grade_level', 'grade_level'), ('school_year', 'school_year')]:
            val = request.query_params.get(param)
            if val: qs = qs.filter(**{field: val}); filters[param] = val
        return enrollment_summary_response(qs[:500], filters)

    @action(detail=False, methods=['post'], url_path='update-classroom-capacity')
    def update_classroom_capacity(self, request):
        if request.user.role != 'admin': return Response({'error': 'Unauthorized'}, status=403)
        classroom_id = request.data.get('classroom_id'); capacity = request.data.get('capacity')
        if not classroom_id or capacity is None: return Response({'error': 'classroom_id and capacity required'}, status=400)
        try: capacity = int(capacity)
        except (ValueError, TypeError): return Response({'error': 'Invalid capacity'}, status=400)
        if capacity < 1: return Response({'error': 'Capacity must be >= 1'}, status=400)
        try:
            classroom = Classroom.objects.get(id=classroom_id)
            classroom.capacity = capacity; classroom.save(update_fields=['capacity'])
            current_count = StudentClassEnrollment.objects.filter(classroom=classroom).count()
            return Response({'status': 'Updated', 'classroom': classroom.name, 'capacity': capacity, 'current_count': current_count})
        except Classroom.DoesNotExist: return Response({'error': 'Not found'}, status=404)

    def _send_notification(self, application, title, message, link=''):
        self._safe_notify_user(application, title, message, link)

    def _safe_notify_user(self, recipient, title, message, link=''):
        try:
            if not recipient or not hasattr(recipient, 'id'): return
            if hasattr(recipient, 'email') and recipient.email:
                user = User.objects.filter(email=recipient.email).first()
                if user: Notification.objects.create(recipient=user, notification_type='system', title=title, message=message, link=link)
            elif hasattr(recipient, 'username'):
                Notification.objects.create(recipient=recipient, notification_type='system', title=title, message=message, link=link)
        except Exception as e: logger.error(f"Notification error: {e}")
