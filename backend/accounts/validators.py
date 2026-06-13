import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _


class StrongPasswordValidator:
    """
    Custom password validator requiring:
    - At least 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character (!@#$%^&*(),.?":{}|<>)
    """

    def __init__(self, min_length=8):
        self.min_length = min_length

    def validate(self, password, user=None):
        if len(password) < self.min_length:
            raise ValidationError(
                _(f'Password must be at least {self.min_length} characters long.'),
                code='password_too_short',
            )
        if not re.search(r'[A-Z]', password):
            raise ValidationError(
                _('Password must contain at least one uppercase letter.'),
                code='password_no_uppercase',
            )
        if not re.search(r'[a-z]', password):
            raise ValidationError(
                _('Password must contain at least one lowercase letter.'),
                code='password_no_lowercase',
            )
        if not re.search(r'\d', password):
            raise ValidationError(
                _('Password must contain at least one digit.'),
                code='password_no_digit',
            )
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            raise ValidationError(
                _('Password must contain at least one special character (!@#$%^&*(),.?":{}|<>).'),
                code='password_no_special',
            )

    def get_help_text(self):
        return _(
            'Your password must contain at least 8 characters including '
            'one uppercase letter, one lowercase letter, one digit, and one special character.'
        )
