from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, permission_classes, api_view
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q

from ..models import (
    Notification,
    Announcement,
)
from ..serializers import (
    NotificationSerializer,
    AnnouncementSerializer,
)


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'message']

    def get_queryset(self):
        from django.utils import timezone
        import datetime
        cutoff = timezone.now() - datetime.timedelta(days=30)
        queryset = Notification.objects.filter(
            recipient=self.request.user,
            created_at__gte=cutoff
        ).select_related('recipient')

        notification_type = self.request.query_params.get('notification_type')
        if notification_type:
            queryset = queryset.filter(notification_type=notification_type)

        is_read = self.request.query_params.get('is_read')
        if is_read is not None:
            queryset = queryset.filter(is_read=is_read.lower() == 'true')

        return queryset.order_by('-created_at')

    def perform_create(self, serializer):
        if self.request.user.role != 'admin':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admins can create notifications via API.")
        serializer.save(recipient=self.request.user)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        unread_count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response({'status': 'deleted', 'unread_count': unread_count})

    @action(detail=True, methods=['post'], url_path='mark-read')
    def mark_read(self, request, pk=None):
        updated = Notification.objects.filter(
            pk=pk, recipient=request.user
        ).update(is_read=True)
        if not updated:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        unread_count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response({'status': 'marked as read', 'unread_count': unread_count})

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({'status': 'All notifications marked as read', 'unread_count': 0})

    @action(detail=False, methods=['post'], url_path='mark-selected-read')
    def mark_selected_read(self, request):
        ids = request.data.get('ids', [])
        if not ids:
            return Response({'error': 'ids required'}, status=status.HTTP_400_BAD_REQUEST)
        Notification.objects.filter(
            pk__in=ids, recipient=request.user
        ).update(is_read=True)
        unread_count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response({'status': f'{len(ids)} marked as read', 'unread_count': unread_count})

    @action(detail=False, methods=['post', 'delete'], url_path='bulk-delete')
    def bulk_delete(self, request):
        ids = request.data.get('ids', [])
        if not ids:
            return Response({'error': 'ids required'}, status=status.HTTP_400_BAD_REQUEST)
        deleted_count, _ = Notification.objects.filter(
            pk__in=ids, recipient=request.user
        ).delete()
        unread_count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response({'status': f'{deleted_count} deleted', 'unread_count': unread_count})

    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response({'unread_count': count})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notifications_polling_view(request):
    """
    Consolidated endpoint for polling notifications and latest announcements.
    Used as a fallback when WebSockets are unavailable.
    """
    user = request.user
    from django.utils import timezone
    import datetime

    cutoff = timezone.now() - datetime.timedelta(days=30)

    # Return recent 20 notifications (read + unread) so the bell stays populated
    # after marking all as read — unread_count is calculated separately
    recent_qs = list(
        Notification.objects.filter(recipient=user, created_at__gte=cutoff)
        .select_related('recipient')
        .order_by('-created_at')[:20]
    )
    notifications_data = NotificationSerializer(recent_qs, many=True).data
    # Accurate unread count — always from DB, not from the slice above
    unread_count = Notification.objects.filter(recipient=user, is_read=False).count()

    announcements_qs = Announcement.objects.filter(status='live').exclude(
        event_date__lt=timezone.now()
    )
    if user.role == 'student':
        announcements_qs = announcements_qs.filter(target_audience__in=['all', 'students'])
    elif user.role == 'staff':
        announcements_qs = announcements_qs.filter(
            Q(target_audience__in=['all', 'teachers']) | Q(author=user)
        )
    elif user.role == 'parent':
        announcements_qs = announcements_qs.filter(target_audience__in=['all', 'parents'])

    announcements_data = AnnouncementSerializer(
        announcements_qs.order_by('-is_pinned', '-created_at')[:5], many=True
    ).data

    return Response({
        'notifications': notifications_data,
        'unread_count': unread_count,
        'announcements': announcements_data,
        'timestamp': timezone.now().isoformat(),
        'realtime_status': 'polling_active',
    })
