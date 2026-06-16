# ═══════════════════════════════════════════════════════════════════════════════
# COMMUNICATION CENTER — Ticket Views
# ═══════════════════════════════════════════════════════════════════════════════

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q

from ..models import Ticket, TicketParticipant, TicketMessage, DepartmentContact
from ..serializers import (
    TicketListSerializer, TicketDetailSerializer, TicketCreateSerializer,
    TicketMessageSerializer, DepartmentContactSerializer,
)
from ..serializers import full_name
from ..utils import log_audit_action
from ..models import User, Profile, Notification


class TicketViewSet(viewsets.ModelViewSet):
    serializer_class = TicketDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        qs = Ticket.objects.filter(is_archived=False).select_related(
            'created_by', 'assigned_to'
        ).prefetch_related('messages', 'participants')

        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            if status_filter == 'resolved':
                qs = qs.filter(status__in=['resolved', 'closed'])
            else:
                qs = qs.filter(status=status_filter)

        # Filter by category
        category = self.request.query_params.get('category')
        if category and category != 'All':
            qs = qs.filter(category=category.lower())

        # Search
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(subject__icontains=search) |
                Q(ticket_id__icontains=search) |
                Q(created_by__first_name__icontains=search) |
                Q(created_by__last_name__icontains=search) |
                Q(messages__content__icontains=search)
            ).distinct()

        # Role-based filtering
        if user.role in ('student', 'parent'):
            qs = qs.filter(created_by=user)
        elif user.role == 'staff':
            qs = qs.filter(
                Q(created_by=user) |
                Q(assigned_to=user) |
                Q(participants__user=user)
            ).distinct()

        return qs.order_by('-updated_at')

    def get_serializer_class(self):
        if self.action == 'list':
            return TicketListSerializer
        if self.action == 'create':
            return TicketCreateSerializer
        return TicketDetailSerializer

    def _can_send_message(self, user, ticket):
        """Check if user is allowed to send messages on this ticket."""
        if user.role == 'admin':
            return True
        if ticket.created_by_id == user.id:
            return True
        if ticket.assigned_to_id and ticket.assigned_to_id == user.id:
            return True
        return TicketParticipant.objects.filter(ticket=ticket, user=user).exists()

    def create(self, request, *args, **kwargs):
        assigned_to = request.data.get('assigned_to')
        if assigned_to:
            existing = Ticket.objects.filter(
                created_by=request.user,
                assigned_to_id=assigned_to,
                is_archived=False,
            ).exclude(status__in=['resolved', 'closed']).order_by('-updated_at').first()
            if existing:
                return Response(
                    TicketDetailSerializer(existing, context={'request': request}).data,
                    status=200,
                )
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        ticket = serializer.save(created_by=self.request.user)
        
        # Auto-assign to staff based on category
        # (creator is already added as participant by TicketCreateSerializer)
        category_to_staff_title = {
            'enrollment': 'registrar',
            'attendance': 'advisory',
            'academic': 'teacher',
            'guidance': 'guidance_counselor',
            'it_support': 'it_staff',
            'facilities': 'other',
            'collaboration': 'teacher',
            'finance': 'cashier',
        }
        
        staff_title = category_to_staff_title.get(ticket.category)
        if staff_title:
            if ticket.category == 'advisory':
                profile = Profile.objects.filter(user=ticket.created_by).first()
                if profile and profile.current_classroom:
                    advisory_teacher = profile.current_classroom.teacher
                    if advisory_teacher:
                        ticket.assigned_to = advisory_teacher
                        ticket.save(update_fields=['assigned_to'])
                        TicketParticipant.objects.create(
                            ticket=ticket,
                            user=advisory_teacher,
                            role='collaborator'
                        )
            
            # If no assignment yet, find any staff with the matching title
            if not ticket.assigned_to:
                staff_users = User.objects.filter(
                    role='staff', is_active=True
                ).filter(
                    Q(staff_title=staff_title) | Q(additional_roles__contains=staff_title)
                )
                if staff_users.exists():
                    assignee = staff_users.first()
                    ticket.assigned_to = assignee
                    ticket.save(update_fields=['assigned_to'])
                    TicketParticipant.objects.create(
                        ticket=ticket,
                        user=assignee,
                        role='collaborator'
                    )
        
        # If still no assignment, assign to any admin
        if not ticket.assigned_to:
            admin_users = User.objects.filter(role='admin', is_active=True)
            if admin_users.exists():
                assignee = admin_users.first()
                ticket.assigned_to = assignee
                ticket.save(update_fields=['assigned_to'])
                TicketParticipant.objects.create(
                    ticket=ticket,
                    user=assignee,
                    role='collaborator'
                )
        
        # Create initial notification to assigned staff
        if ticket.assigned_to and ticket.assigned_to != self.request.user:
            Notification.objects.create(
                recipient=ticket.assigned_to,
                notification_type='message',
                title=f'New ticket: {ticket.ticket_id}',
                message=f'{full_name(self.request.user)}: {ticket.subject}',
                link='/communication-center'
            )
        
        log_audit_action(
            user=self.request.user,
            action='create',
            model_name='Ticket',
            object_id=ticket.id,
            object_repr=ticket.ticket_id,
            description=f'Created ticket: {ticket.subject}',
            request=self.request
        )

    @action(detail=True, methods=['post'], url_path='send-message')
    def send_message(self, request, pk=None):
        """Add a message to a ticket."""
        ticket = self.get_object()

        # C2: Authorization — only participants, assigned staff, or admins can send
        if not self._can_send_message(request.user, ticket):
            return Response(
                {'error': 'You do not have permission to send messages on this ticket.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # C2: Block messaging on resolved/closed tickets (admins exempt)
        if ticket.status in ('resolved', 'closed') and request.user.role != 'admin':
            return Response(
                {'error': f'This ticket is {ticket.status}. Only admins can reply to closed tickets.'},
                status=status.HTTP_403_FORBIDDEN
            )

        content = request.data.get('content', '').strip()

        if not content:
            return Response({'error': 'Message content is required'}, status=400)

        message = TicketMessage.objects.create(
            ticket=ticket,
            sender=request.user,
            content=content
        )

        # Update ticket status based on who responded
        is_staff_response = ticket.assigned_to and request.user == ticket.assigned_to
        if is_staff_response:
            if ticket.status in ['open', 'pending']:
                ticket.status = 'replied'
                ticket.save(update_fields=['status', 'updated_at'])
        else:
            if ticket.status in ['open', 'replied']:
                ticket.status = 'pending'
                ticket.save(update_fields=['status', 'updated_at'])

        # Mark other participants' messages as read
        ticket.messages.filter(is_read=False).exclude(sender=request.user).update(is_read=True)

        # Notify all participants AND assigned_to user
        notified_users = set()
        
        # Notify assigned_to if not the sender
        if ticket.assigned_to and ticket.assigned_to != request.user:
            Notification.objects.create(
                recipient=ticket.assigned_to,
                notification_type='message',
                title=f'New message on {ticket.ticket_id}',
                message=f'{full_name(request.user)}: {content[:100]}...' if len(content) > 100 else f'{full_name(request.user)}: {content}',
                link='/communication-center'
            )
            notified_users.add(ticket.assigned_to.id)
        
        # Notify participants
        participants = ticket.participants.exclude(user=request.user)
        for p in participants:
            if p.user.id not in notified_users:
                Notification.objects.create(
                    recipient=p.user,
                    notification_type='message',
                    title=f'New message on {ticket.ticket_id}',
                    message=f'{full_name(request.user)}: {content[:100]}...' if len(content) > 100 else f'{full_name(request.user)}: {content}',
                    link='/communication-center'
                )
                notified_users.add(p.user.id)
        
        # Also notify the creator if they're not the sender and not already notified
        if ticket.created_by != request.user and ticket.created_by.id not in notified_users:
            Notification.objects.create(
                recipient=ticket.created_by,
                notification_type='message',
                title=f'New message on {ticket.ticket_id}',
                message=f'{full_name(request.user)}: {content[:100]}...' if len(content) > 100 else f'{full_name(request.user)}: {content}',
                link='/communication-center'
            )

        return Response(TicketMessageSerializer(message).data, status=201)

    @action(detail=True, methods=['post'], url_path='update-status')
    def update_status(self, request, pk=None):
        """Update ticket status."""
        ticket = self.get_object()
        new_status = request.data.get('status')

        if new_status not in ['open', 'pending', 'replied', 'resolved', 'closed']:
            return Response({'error': 'Invalid status'}, status=400)

        ticket.status = new_status
        ticket.save(update_fields=['status', 'updated_at'])

        return Response({'status': new_status})

    @action(detail=True, methods=['post'], url_path='update-priority')
    def update_priority(self, request, pk=None):
        """Update ticket priority."""
        ticket = self.get_object()
        new_priority = request.data.get('priority')

        if new_priority not in ['normal', 'high', 'urgent']:
            return Response({'error': 'Invalid priority'}, status=400)

        ticket.priority = new_priority
        ticket.save(update_fields=['priority', 'updated_at'])

        return Response({'priority': new_priority})

    @action(detail=True, methods=['post'], url_path='assign')
    def assign_ticket(self, request, pk=None):
        """Assign a ticket to a user."""
        ticket = self.get_object()
        user_id = request.data.get('user_id')

        if not user_id:
            return Response({'error': 'user_id is required'}, status=400)

        try:
            assignee = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)

        ticket.assigned_to = assignee
        ticket.save(update_fields=['assigned_to', 'updated_at'])

        # Add as collaborator participant
        TicketParticipant.objects.get_or_create(
            ticket=ticket,
            user=assignee,
            defaults={'role': 'collaborator'}
        )

        return Response({'assigned_to': full_name(assignee)})

    @action(detail=True, methods=['post'], url_path='add-participant')
    def add_participant(self, request, pk=None):
        """Add a participant to a ticket."""
        ticket = self.get_object()
        user_id = request.data.get('user_id')
        role = request.data.get('role', 'viewer')

        if not user_id:
            return Response({'error': 'user_id is required'}, status=400)

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)

        participant, created = TicketParticipant.objects.get_or_create(
            ticket=ticket,
            user=user,
            defaults={'role': role}
        )

        if not created:
            participant.role = role
            participant.save(update_fields=['role'])

        return Response({'status': 'added', 'created': created})

    @action(detail=True, methods=['post'], url_path='archive')
    def archive_ticket(self, request, pk=None):
        """Archive a ticket."""
        ticket = self.get_object()
        ticket.is_archived = True
        ticket.save(update_fields=['is_archived', 'updated_at'])
        return Response({'status': 'archived'})

    @action(detail=True, methods=['delete'], url_path='delete')
    def delete_ticket(self, request, pk=None):
        """Soft delete a ticket (only by creator or admin). Logs to AuditLog."""
        ticket = self.get_object()
        if ticket.created_by != request.user and request.user.role != 'admin':
            return Response({'error': 'Only the creator or admin can delete this ticket'}, status=403)

        from django.utils import timezone as _tz

        # Soft delete: set archived + log the action
        # deleted_at column will be used once migration 0087 is applied
        ticket.is_archived = True
        ticket.save(update_fields=['is_archived', 'updated_at'])

        log_audit_action(
            user=request.user,
            action='delete',
            model_name='Ticket',
            object_id=ticket.id,
            object_repr=ticket.ticket_id,
            description=f'Deleted ticket: {ticket.subject} ({ticket.ticket_id})',
            request=request,
        )

        return Response({'status': 'deleted'})

    @action(detail=True, methods=['get'], url_path='messages')
    def get_messages(self, request, pk=None):
        """Get all messages for a ticket."""
        ticket = self.get_object()
        messages = ticket.messages.select_related('sender').order_by('created_at')

        # Mark messages as read
        messages.filter(is_read=False).exclude(sender=request.user).update(is_read=True)

        return Response(TicketMessageSerializer(messages, many=True).data)

    @action(detail=False, methods=['get'], url_path='staff-by-department')
    def staff_by_department(self, request):
        """Get staff grouped by department for the directory panel."""
        DEPT_MAP = {
            'registrar': {'name': 'Registrar', 'icon': 'FileText', 'color': 'bg-blue-500', 'titles': ['registrar']},
            'advisory': {'name': 'Advisory', 'icon': 'GraduationCap', 'color': 'bg-emerald-500', 'titles': ['advisory']},
            'faculty': {'name': 'Faculty', 'icon': 'BookOpen', 'color': 'bg-violet-500', 'titles': ['teacher']},
            'admin': {'name': "Principal's Office", 'icon': 'Shield', 'color': 'bg-amber-500', 'titles': ['principal']},
            'guidance': {'name': 'Guidance', 'icon': 'UserCheck', 'color': 'bg-rose-500', 'titles': ['guidance_counselor']},
            'it': {'name': 'IT Support', 'icon': 'Settings', 'color': 'bg-indigo-500', 'titles': ['it_staff']},
            'library': {'name': 'Library', 'icon': 'BookOpen', 'color': 'bg-teal-500', 'titles': ['librarian']},
            'finance': {'name': 'Finance', 'icon': 'FileText', 'color': 'bg-orange-500', 'titles': ['cashier']},
        }

        def get_all_titles(u):
            """Return set of all titles for a user (primary + additional)."""
            titles = set()
            if u.staff_title:
                titles.add(u.staff_title)
            if u.additional_roles:
                titles.update(r.strip() for r in u.additional_roles.split(',') if r.strip())
            return titles

        staff_users = User.objects.filter(
            role='staff', is_active=True
        ).select_related('profile').order_by('first_name', 'last_name')

        departments = {}
        assigned_user_ids = set()

        for dept_id, dept_info in DEPT_MAP.items():
            dept_staff = []
            for u in staff_users:
                if u.id in assigned_user_ids:
                    continue
                user_titles = get_all_titles(u)
                if user_titles & set(dept_info['titles']):
                    dept_staff.append(u)
                    assigned_user_ids.add(u.id)

            if dept_staff:
                members = []
                for u in dept_staff:
                    full = full_name(u) or u.username
                    profile = getattr(u, 'profile', None)
                    members.append({
                        'id': u.id,
                        'name': full,
                        'username': u.username,
                        'staff_title': u.staff_title,
                        'all_titles': sorted(get_all_titles(u)),
                        'title': getattr(profile, 'title', '') or '',
                        'is_online': u.is_online,
                    })
                departments[dept_id] = {
                    'id': dept_id,
                    'name': dept_info['name'],
                    'icon': dept_info['icon'],
                    'color': dept_info['color'],
                    'members': members,
                }

        # Include any unmapped staff under "Other"
        other_staff = [u for u in staff_users if u.id not in assigned_user_ids]
        if other_staff:
            members = []
            for u in other_staff:
                full = full_name(u) or u.username
                profile = getattr(u, 'profile', None)
                members.append({
                    'id': u.id,
                    'name': full,
                    'username': u.username,
                    'staff_title': u.staff_title,
                    'all_titles': sorted(get_all_titles(u)),
                    'title': getattr(profile, 'title', '') or '',
                    'is_online': u.is_online,
                })
            departments['other'] = {
                'id': 'other',
                'name': 'Other Staff',
                'icon': 'Users',
                'color': 'bg-slate-500',
                'members': members,
            }

        return Response(list(departments.values()))

    @action(detail=False, methods=['post'], url_path='open-conversation')
    def open_conversation(self, request):
        """Find or create a ticket conversation with a specific staff member."""
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'error': 'user_id is required'}, status=400)

        try:
            target_user = User.objects.get(id=user_id, is_active=True)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)

        user = request.user

        # Look for existing non-archived ticket between these two users
        existing = Ticket.objects.filter(
            is_archived=False
        ).filter(
            Q(created_by=user, assigned_to=target_user) |
            Q(created_by=target_user, assigned_to=user)
        ).order_by('-updated_at').first()

        if existing:
            return Response(TicketDetailSerializer(existing, context={'request': request}).data)

        # Create a new ticket
        ticket = Ticket.objects.create(
            subject=f'Conversation with {full_name(target_user)}',
            category='other',
            priority='normal',
            created_by=user,
            assigned_to=target_user,
        )

        # Add participants
        TicketParticipant.objects.create(ticket=ticket, user=user, role='collaborator')
        TicketParticipant.objects.create(ticket=ticket, user=target_user, role='collaborator')

        # Notify the target user
        Notification.objects.create(
            recipient=target_user,
            notification_type='message',
            title=f'New conversation',
            message=f'{full_name(user)} started a conversation with you',
            link='/communication-center'
        )

        return Response(TicketDetailSerializer(ticket, context={'request': request}).data, status=201)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get ticket statistics."""
        user = request.user
        base_qs = Ticket.objects.all()

        # Role-based filtering
        if user.role in ('student', 'parent'):
            base_qs = base_qs.filter(created_by=user)

        stats = {
            'total': base_qs.count(),
            'open': base_qs.filter(status='open').count(),
            'pending': base_qs.filter(status='pending').count(),
            'replied': base_qs.filter(status='replied').count(),
            'resolved': base_qs.filter(status='resolved').count(),
            'closed': base_qs.filter(status='closed').count(),
        }
        return Response(stats)


class DepartmentContactViewSet(viewsets.ModelViewSet):
    serializer_class = DepartmentContactSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return DepartmentContact.objects.filter(is_active=True).select_related('contact_person')

    def perform_create(self, serializer):
        if self.request.user.role != 'admin':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admins can manage department contacts.")
        serializer.save()

    def perform_update(self, serializer):
        if self.request.user.role != 'admin':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admins can manage department contacts.")
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user.role != 'admin':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admins can manage department contacts.")
        instance.is_active = False
        instance.save(update_fields=['is_active'])
