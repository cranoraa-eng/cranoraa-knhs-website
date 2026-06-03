from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from django.db.models import Q

User = get_user_model()

class SchoolAuthBackend(ModelBackend):
    """
    Custom authentication backend to allow login via:
    1. Username (which can be the Student ID)
    2. Email (if provided)
    """
    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None:
            username = kwargs.get(User.USERNAME_FIELD)
        if username is None:
            return None
        username = str(username).strip()
        if not username:
            return None

        try:
            # Use filter().first() to avoid MultipleObjectsReturned on case-insensitive collision
            user = User.objects.filter(
                Q(username__iexact=username)
                | Q(email__iexact=username)
                | Q(profile__lrn=username)
                | Q(profile__registration_number=username)
            ).first()

            if user is None:
                return None

            if user.check_password(password):
                return user
            return None
        except Exception:
            return None

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
