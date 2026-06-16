from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.throttling import throttle_classes

from ..models import WebsiteContent
from ..serializers import WebsiteContentSerializer
from ..permissions import IsAuthenticated
from ..storage import upload_file


class WebsiteContentViewSet(viewsets.ModelViewSet):
    serializer_class = WebsiteContentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role == 'admin':
            return WebsiteContent.objects.all()
        return WebsiteContent.objects.none()
    
    def perform_update(self, serializer):
        # Handle image upload to Supabase branding bucket
        if 'image' in self.request.FILES:
            img_file = self.request.FILES['image']
            url, err = upload_file(img_file, bucket_key='branding', folder='website-content')
            if err:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({'image': f'Image upload failed: {err}'})
            serializer.save(updated_by=self.request.user, image=url)
        else:
            serializer.save(updated_by=self.request.user)
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def public(self, request):
        """Public endpoint to fetch all website content"""
        queryset = WebsiteContent.objects.all()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
