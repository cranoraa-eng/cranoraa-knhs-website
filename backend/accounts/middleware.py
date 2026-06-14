from django.contrib.auth.models import AnonymousUser
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model
from urllib.parse import parse_qs
import json

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
    """
    WebSocket JWT authentication middleware.
    
    Supports two methods for passing the access token:
    1. Query string: ws://host/ws/notifications/?token=<access_token>
       (kept for backward compatibility, but less secure — token appears in server logs)
    2. First message: Send {"type": "auth", "token": "<access_token"} as the first message.
       (preferred — token never appears in URLs)
    
    The middleware first checks the query string. If no token is found there,
    it sets the user to AnonymousUser and waits for the first message to contain
    the auth token.
    """
    async def __call__(self, scope, receive, send):
        query_string = scope.get('query_string', b'').decode()
        token = None

        if query_string:
            params = parse_qs(query_string)
            token_list = params.get('token')
            if token_list:
                token = token_list[0]

        if token:
            scope['user'] = await get_user(token)
            return await super().__call__(scope, receive, send)

        # No token in query string — check first message for auth token
        # We wrap receive to intercept the first message
        async def wrapped_receive():
            nonlocal token
            message = await receive()
            
            if not token and message.get('type') == 'websocket.receive':
                try:
                    data = json.loads(message.get('text', '{}'))
                    if data.get('type') == 'auth' and data.get('token'):
                        token = data['token']
                        scope['user'] = await get_user(token)
                        # Send confirmation back to client
                        await send({
                            'type': 'websocket.send',
                            'text': json.dumps({'type': 'auth_success', 'user_id': scope['user'].id if scope['user'].is_authenticated else None})
                        })
                except (json.JSONDecodeError, KeyError):
                    pass
            
            return message

        # If no token from first message either, set anonymous
        if not token:
            scope['user'] = AnonymousUser()

        return await super().__call__(scope, wrapped_receive, send)
