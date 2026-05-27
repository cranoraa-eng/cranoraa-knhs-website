from django.contrib.auth.models import AnonymousUser
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model
from urllib.parse import parse_qs

User = get_user_model()

@database_sync_to_async
def get_user(token_key):
    if not token_key or token_key == 'null' or token_key == 'undefined':
        return AnonymousUser()
    try:
        access_token = AccessToken(token_key)
        user_id = access_token['user_id']
        return User.objects.get(id=user_id)
    except Exception:
        return AnonymousUser()

class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        # Use urllib.parse.parse_qs so tokens containing '=' (base64 padding) are handled correctly
        query_string = scope.get('query_string', b'').decode()
        token = None

        if query_string:
            params = parse_qs(query_string)
            token_list = params.get('token')
            if token_list:
                token = token_list[0]

        if token:
            scope['user'] = await get_user(token)
        else:
            scope['user'] = AnonymousUser()

        return await super().__call__(scope, receive, send)
