"""Authentication views: login, logout, password management, token refresh."""
from rest_framework import status, parsers
from rest_framework.decorators import api_view, permission_classes, throttle_classes, parser_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.utils import timezone
import logging

from ..serializers import UserSerializer, OnboardingStateSerializer
from ..models import OnboardingState
from ..permissions import IsAdmin
from ..throttles import AuthRateThrottle, LogoutRateThrottle
from ..utils import log_audit_action
from ._helpers import _set_refresh_cookie, _clear_refresh_cookie

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AuthRateThrottle])
def login_view(request):
    try:
        login_id = request.data.get('email') or request.data.get('username')
        password = request.data.get('password')
        required_role = request.data.get('role')

        GENERIC_ERROR = 'Invalid credentials'

        if login_id is None or password is None:
            return Response(
                {'error': 'Please provide both ID (Email/Student ID) and password'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(request=request, username=login_id, password=password)

        if user is None:
            return Response(
                {'error': GENERIC_ERROR},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if required_role and user.role != 'admin':
            if user.role != required_role:
                return Response(
                    {'error': GENERIC_ERROR},
                    status=status.HTTP_401_UNAUTHORIZED
                )

        if user.account_status == 'inactive' or user.account_status == 'suspended' or not user.is_active:
            return Response(
                {'error': GENERIC_ERROR},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_approved:
            return Response(
                {'error': GENERIC_ERROR},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if user.must_change_password:
            refresh = RefreshToken.for_user(user)
            response = Response({
                'must_change_password': True,
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data
            }, status=status.HTTP_200_OK)
            _set_refresh_cookie(response, str(refresh))
            return response

        refresh = RefreshToken.for_user(user)

        log_audit_action(
            user=user,
            action='login',
            model_name='User',
            object_id=user.id,
            object_repr=str(user),
            description=f'User {user.username} logged in successfully',
            request=request
        )

        response = Response({
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        })
        _set_refresh_cookie(response, str(refresh))
        return response
    except Exception as e:
        logger.error(f"Login error: {str(e)}", exc_info=True)
        return Response(
            {'error': 'An unexpected error occurred. Please try again.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def force_password_change_view(request):
    user = request.user
    new_password = request.data.get('password')

    if not new_password:
        return Response({'error': 'Password is required'}, status=status.HTTP_400_BAD_REQUEST)

    from django.contrib.auth.password_validation import validate_password
    from django.core.exceptions import ValidationError as DjangoValidationError
    try:
        validate_password(new_password, user=user)
    except DjangoValidationError as e:
        return Response({'error': ' '.join(e.messages)}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.must_change_password = False
    user.save()

    refresh = RefreshToken.for_user(user)

    response = Response({
        'message': 'Password changed successfully!',
        'access': str(refresh.access_token),
    })
    _set_refresh_cookie(response, str(refresh))
    return response


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    user = request.user
    current_password = request.data.get('current_password')
    new_password = request.data.get('new_password')

    if not current_password:
        return Response({'error': 'Current password is required'}, status=status.HTTP_400_BAD_REQUEST)

    if not new_password:
        return Response({'error': 'New password is required'}, status=status.HTTP_400_BAD_REQUEST)

    if not user.check_password(current_password):
        return Response({'error': 'Current password is incorrect'}, status=status.HTTP_400_BAD_REQUEST)

    from django.contrib.auth.password_validation import validate_password
    from django.core.exceptions import ValidationError as DjangoValidationError
    try:
        validate_password(new_password, user=user)
    except DjangoValidationError as e:
        return Response({'error': ' '.join(e.messages)}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.save()

    refresh = RefreshToken.for_user(user)

    response = Response({
        'message': 'Password changed successfully!',
        'access': str(refresh.access_token),
    })
    _set_refresh_cookie(response, str(refresh))
    return response


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([LogoutRateThrottle])
def logout_view(request):
    refresh_token = request.COOKIES.get('refresh_token') or request.data.get('refresh')
    if refresh_token:
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            pass

    response = Response({'message': 'Logged out successfully.'})
    _clear_refresh_cookie(response)
    return response


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def notification_preferences_view(request):
    from ..serializers import NotificationPreferenceSerializer
    from ..models import NotificationPreference

    prefs, _ = NotificationPreference.objects.get_or_create(user=request.user)

    if request.method == 'GET':
        serializer = NotificationPreferenceSerializer(prefs)
        return Response(serializer.data)

    serializer = NotificationPreferenceSerializer(prefs, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AuthRateThrottle])
def cookie_token_refresh_view(request):
    from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
    from ..models import User

    refresh_token = request.COOKIES.get('refresh_token') or request.data.get('refresh')

    if not refresh_token:
        return Response(
            {'error': 'Refresh token not found. Please log in again.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    try:
        token = RefreshToken(refresh_token)
        access = str(token.access_token)

        if hasattr(token, 'blacklist'):
            token.blacklist()
        new_refresh = RefreshToken.for_user(
            User.objects.get(id=token['user_id'])
        )

        response = Response({'access': access})
        _set_refresh_cookie(response, str(new_refresh))
        return response

    except TokenError as e:
        return Response({'error': 'Invalid or expired refresh token.'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception:
        logger.error("Token refresh error", exc_info=True)
        return Response({'error': 'Token refresh failed.'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def onboarding_state_view(request):
    state, created = OnboardingState.objects.get_or_create(
        user=request.user,
        defaults={'role': request.user.role},
    )

    if state.role != request.user.role:
        state.role = request.user.role
        state.save(update_fields=['role', 'updated_at'])

    if request.method == 'PATCH':
        serializer = OnboardingStateSerializer(state, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(role=request.user.role)
        return Response(serializer.data)

    serializer = OnboardingStateSerializer(state)
    return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
