"""
Guest wish form (public — no password):

  GET  /api/wishes/invite?code=…   → checks the invitation code a guest typed in,
                                     returns her first name, your first name, the date
  POST /api/wishes                 → save a wish (+ optional video), then email a confirmation

Codes come from GUEST_CODE in .env. You can have several, separated by commas,
e.g. GUEST_CODE=family2026,friends2026,work2026 — capitals and spaces don't matter.

Everything the browser already checked is checked again here, because a
browser check can be skipped by anyone who sends the request directly.
"""
import hmac
import json
import re
import secrets
import shutil
import subprocess
import time
from collections import defaultdict, deque
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, File, Form, HTTPException, Request, UploadFile, status

from ..config import MEDIA_DIR, get_settings, load_site
from ..mailer import send_wish_emails
from .. import wish_store

router = APIRouter(prefix="/api/wishes", tags=["wishes"])
WISH_VIDEO_DIR = MEDIA_DIR / "wishes"  # guests' videos are saved here

# Keep in sync with WISH_RULES in frontend/src/api/types.ts
NAME_MAX = 60
EMAIL_MAX = 254
MESSAGE_MIN = 10
MESSAGE_MAX = 600
RELATIONS = {"Family", "Friend", "Colleague", "Other"}
VIDEO_TYPES = {".mp4": "video/mp4", ".mov": "video/quicktime", ".m4v": "video/x-m4v", ".webm": "video/webm"}
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


# --------------------------------------------------------------------------- #
#  Helpers
# --------------------------------------------------------------------------- #

def _client_ip(request: Request) -> str:
    return request.headers.get("x-forwarded-for", "").split(",")[0].strip() or (request.client.host if request.client else "?")


def _codes() -> list[str]:
    return [c.strip().lower() for c in get_settings().GUEST_CODE.split(",") if c.strip()]


def _code_ok(code: str) -> bool:
    typed = code.strip().lower().encode()
    ok = False
    for c in _codes():
        # Constant-time compare (and check every code), so nothing leaks through response timing
        ok |= hmac.compare_digest(typed, c.encode())
    return ok


def _limited(store: dict[str, deque], key: str, max_hits: int, window: int) -> bool:
    """True if `key` already used up `max_hits` within the last `window` seconds."""
    now = time.monotonic()
    q = store[key]
    while q and now - q[0] > window:
        q.popleft()
    return len(q) >= max_hits


# Wrong invitation codes: 10 per 10 minutes per person, so codes can't be guessed
_code_misses: dict[str, deque] = defaultdict(deque)
MISS_MAX, MISS_WINDOW = 10, 600

# Wishes: 5 per 10 minutes per person (stops spam / accidental double-sends)
_hits: dict[str, deque] = defaultdict(deque)
RATE_MAX, RATE_WINDOW = 5, 600


def _check_code(request: Request, code: str, fail_status: int) -> None:
    ip = _client_ip(request)
    if _limited(_code_misses, ip, MISS_MAX, MISS_WINDOW):
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "Too many tries — please wait a few minutes.")
    if not _code_ok(code):
        _code_misses[ip].append(time.monotonic())
        raise HTTPException(fail_status, "That invitation code isn't right.")


def _rate_limit(request: Request) -> None:
    ip = _client_ip(request)
    if _limited(_hits, ip, RATE_MAX, RATE_WINDOW):
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "Too many wishes at once — please wait a few minutes.")
    _hits[ip].append(time.monotonic())


def _video_seconds(path: Path) -> float | None:
    """Reads the real length with ffprobe (if installed). None = couldn't tell."""
    if not shutil.which("ffprobe"):
        return None
    try:
        out = subprocess.run(
            ["ffprobe", "-v", "error", "-print_format", "json", "-show_entries", "format=duration", str(path)],
            capture_output=True, text=True, timeout=20, check=True,
        ).stdout
        return float(json.loads(out)["format"]["duration"])
    except Exception:  # noqa: BLE001
        return None


async def _save_video(upload: UploadFile, wish_id: str) -> tuple[str, float | None]:
    """Streams the upload to disk (never all in memory), enforcing the size limit as it goes."""
    s = get_settings()
    ext = Path(upload.filename or "").suffix.lower()
    if ext not in VIDEO_TYPES:
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, "Please upload an MP4, MOV or WebM video.")

    WISH_VIDEO_DIR.mkdir(parents=True, exist_ok=True)
    dest = WISH_VIDEO_DIR / f"{wish_id}{ext}"
    limit = s.VIDEO_MAX_MB * 1024 * 1024
    written = 0
    try:
        with dest.open("wb") as f:
            while chunk := await upload.read(1024 * 1024):
                written += len(chunk)
                if written > limit:
                    raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, f"Please keep the video under {s.VIDEO_MAX_MB} MB.")
                f.write(chunk)

        seconds = _video_seconds(dest)
        if seconds is not None and seconds > s.VIDEO_MAX_SECONDS + 1:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Please keep the video to 1 minute or less.")
    except BaseException:
        dest.unlink(missing_ok=True)  # never keep a rejected or half-uploaded file
        raise

    return f"wishes/{dest.name}", seconds


# --------------------------------------------------------------------------- #
#  Routes
# --------------------------------------------------------------------------- #

@router.get("/invite")
def invite(request: Request, code: str = ""):
    _check_code(request, code, status.HTTP_404_NOT_FOUND)
    site = load_site()
    return {"herName": site["herName"], "fromName": site["fromName"], "birthday": site["birthday"]}


@router.post("", status_code=status.HTTP_201_CREATED)
async def submit_wish(
    request: Request,
    background: BackgroundTasks,
    code: str = Form(""),
    name: str = Form(""),
    relation: str = Form("Family"),
    message: str = Form(""),
    email: str = Form(""),
    website: str = Form(""),  # honeypot
    video: UploadFile | None = File(None),
):
    _check_code(request, code, status.HTTP_403_FORBIDDEN)
    _rate_limit(request)

    # Bots fill the hidden field — pretend it worked, keep nothing, send nothing
    if website:
        return {"ok": True}

    name, message, email = name.strip(), message.strip(), email.strip().lower()
    if not name or len(name) > NAME_MAX:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Please add your name.")
    if not MESSAGE_MIN <= len(message) <= MESSAGE_MAX:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, f"Your wish should be {MESSAGE_MIN}–{MESSAGE_MAX} characters.")
    if relation not in RELATIONS:
        relation = "Other"
    if email and (len(email) > EMAIL_MAX or not EMAIL_RE.match(email)):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "That email address doesn't look right.")

    wish_id = secrets.token_urlsafe(9)
    video_path, video_seconds = (None, None)
    if video and video.filename:
        video_path, video_seconds = await _save_video(video, wish_id)

    wish_store.append(
        {
            "id": wish_id,
            "name": name,
            "relation": relation,
            "message": message,
            "email": email or None,  # private: used only for the confirmation, never shown on her page
            "video": video_path,
            "videoSeconds": video_seconds,
            "createdAt": datetime.now(timezone.utc).isoformat(),
        }
    )

    # Sent after the response, so the guest isn't kept waiting on the mail server
    background.add_task(
        send_wish_emails,
        name=name,
        relation=relation,
        message=message,
        guest_email=email or None,
        has_video=bool(video_path),
        video_seconds=video_seconds,
    )
    return {"ok": True, "emailed": bool(email) and get_settings().email_enabled}