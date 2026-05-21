from django.contrib.auth import get_user_model
from django.db.models import Count

User = get_user_model()

duplicates = User.objects.values('email').annotate(email_count=Count('email')).filter(email_count__gt=1)
if duplicates:
    print(f"Found duplicates: {list(duplicates)}")
else:
    print("No duplicate emails found.")
