"""
Password + session security.

- The password is never stored — only a bcrypt hash of it (PASSWORD_HASH in .env).
- After login she gets a signed, httpOnly cookie. JavaScript can't read it,
  and it can't be forged without SECRET_KEY.
- Wrong guesses are rate-limited so nobody can try thousands of passwords.
"""
import time
from collections import defaultdict, deque

import bcrypt
from fastapi import HTTPException, Request, Response, status
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

from .config import get_settings

SESSION_COOKIE = "bd_session"
VOICE_COOKIE = "bd_voice"  # second lock: set only after the voice code is right


# --------------------------- passwords / codes --------------------------- #

def hash_secret(secret: str) -> str:
    return bcrypt.hashpw(secret.encode(), bcrypt.gensalt(rounds=12)).decode()


def check_secret(secret: str, hashed: str) -> bool:
    if not hashed:
        return False
    try:
        return bcrypt.checkpw(secret.encode(), hashed.encode())
    except ValueError:  # malformed hash in .env
        return False


def normalise(secret: str) -> str:
    """Forgiving input: ignores surrounding spaces and upper/lower case."""
    return secret.strip().lower()


# ------------------------------ cookies ------------------------------ #

def _serializer(salt: str) -> URLSafeTimedSerializer:
    return URLSafeTimedSerializer(get_settings().SECRET_KEY, salt=salt)


def _set_cookie(response: Response, name: str, salt: str) -> None:
    s = get_settings()
    response.set_cookie(
        name,
        _serializer(salt).dumps({"ok": True}),
        max_age=s.SESSION_DAYS * 86400,
        httponly=True,  # invisible to JavaScript
        secure=s.COOKIE_SECURE,  # HTTPS-only in production
        samesite="lax",
        path="/",
    )


def _valid(request: Request, name: str, salt: str) -> bool:
    token = request.cookies.get(name)
    if not token:
        return False
    try:
        _serializer(salt).loads(token, max_age=get_settings().SESSION_DAYS * 86400)
        return True
    except (BadSignature, SignatureExpired):
        return False


def start_session(response: Response) -> None:
    _set_cookie(response, SESSION_COOKIE, "session")


def has_session(request: Request) -> bool:
    return _valid(request, SESSION_COOKIE, "session")


def unlock_voice(response: Response) -> None:
    _set_cookie(response, VOICE_COOKIE, "voice")


def has_voice(request: Request) -> bool:
    return _valid(request, VOICE_COOKIE, "voice")


def end_session(response: Response) -> None:
    for name in (SESSION_COOKIE, VOICE_COOKIE):
        response.delete_cookie(name, path="/")


# --------------------------- rate limiting --------------------------- #

class Attempts:
    """Allows `limit` wrong tries per `window` seconds per visitor."""

    def __init__(self, limit: int, window: int):
        self.limit, self.window = limit, window
        self._hits: dict[str, deque] = defaultdict(deque)

    @staticmethod
    def _key(request: Request) -> str:
        fwd = request.headers.get("x-forwarded-for", "")
        return fwd.split(",")[0].strip() or (request.client.host if request.client else "?")

    def check(self, request: Request) -> None:
        q = self._hits[self._key(request)]
        now = time.monotonic()
        while q and now - q[0] > self.window:
            q.popleft()
        if len(q) >= self.limit:
            raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "Too many tries — please wait a minute.")

    def fail(self, request: Request) -> None:
        self._hits[self._key(request)].append(time.monotonic())

    def reset(self, request: Request) -> None:
        self._hits.pop(self._key(request), None)