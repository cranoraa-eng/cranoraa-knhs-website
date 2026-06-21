import json
import asyncio
import time
from collections import defaultdict
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.utils import timezone
from ..models import ChatRoom, ChatMessage, MessageReaction, Notification, Ticket, TicketMessage, TicketParticipant
from ..serializers import ChatMessageSerializer
from ..utils import check_user_moderation

User = get_user_model()

# ── Redis-saving constants ────────────────────────────────────────────────────
PRESENCE_DEBOUNCE_SECONDS = 60
TYPING_THROTTLE_SECONDS = 3
MESSAGE_RATE_LIMIT = 30
MESSAGE_RATE_WINDOW = 60


class RateLimiter:
    """Rate limiter for WebSocket messages. Uses Redis when available, falls back to in-memory."""

    def __init__(self):
        self._requests = defaultdict(list)
        self._last_cleanup = time.monotonic()
        self._CLEANUP_INTERVAL = 300
        self._redis = None
        try:
            from django.core.cache import cache
            if hasattr(cache, '_cache') and hasattr(cache._cache, 'get_client'):
                self._redis = cache._cache.get_client()
            elif hasattr(cache, 'get'):
                self._cache = cache
        except Exception:
            pass

    def _cleanup_stale_keys(self):
        now = time.monotonic()
        if now - self._last_cleanup < self._CLEANUP_INTERVAL:
            return
        self._last_cleanup = now
        stale_threshold = now - 600
        cleaned = {
            k: [t for t in v if t > stale_threshold]
            for k, v in self._requests.items()
            if any(t > stale_threshold for t in v)
        }
        self._requests = defaultdict(list, cleaned)

    def is_rate_limited(self, key, max_requests, window_seconds):
        self._cleanup_stale_keys()
        now = time.monotonic()
        cutoff = now - window_seconds
        self._requests[key] = [t for t in self._requests.get(key, []) if t > cutoff]
        if len(self._requests[key]) >= max_requests:
            return True
        self._requests[key].append(now)
        return False


# Module-level singleton
_rate_limiter = RateLimiter()
