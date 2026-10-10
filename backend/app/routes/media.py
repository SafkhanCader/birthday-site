"""
GET /api/media/{path} — photos, music and videos from backend/media/.

- Login required: without her session cookie, nothing is served,
  even to someone who knows the exact file name.
- media/voice/… additionally needs the voice code to have been entered.
- Sealed sections' files (gift/, london/) stay private until the unlock time.
- Supports "Range" requests, so videos and audio can be scrubbed and
  start playing before they've fully downloaded.
- Paths are resolved and checked so "../" tricks can't reach other files.
"""
import json
import mimetypes

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import FileResponse

from ..config import CONTENT_DIR, MEDIA_DIR
from ..deps import require_login
from ..security import has_voice
from .content import is_unlocked

router = APIRouter(prefix="/api/media", tags=["media"], dependencies=[Depends(require_login)])

mimetypes.add_type("image/webp", ".webp")
mimetypes.add_type("audio/mp4", ".m4a")
mimetypes.add_type("video/quicktime", ".mov")


def _sealed_folders() -> set[str]:
    settings = json.loads((CONTENT_DIR / "settings.json").read_text(encoding="utf-8"))
    if is_unlocked(settings.get("unlockAt", "2000-01-01T00:00:00+00:00")):
        return set()
    return set(settings.get("sealedSections", []))


@router.get("/{path:path}")
def media(path: str, request: Request):
    root = MEDIA_DIR.resolve()
    file = (root / path).resolve()

    # Block "../" escapes, hidden files and folders
    if root not in file.parents or not file.is_file() or file.name.startswith("."):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")

    top = file.relative_to(root).parts[0]
    if top == "voice" and not has_voice(request):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This one needs its own code.")
    if top in _sealed_folders():
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not yet — this opens on her birthday.")

    return FileResponse(
        file,
        media_type=mimetypes.guess_type(file.name)[0] or "application/octet-stream",
        # Private: browsers may cache it, shared caches (proxies/CDNs) must not
        headers={"Cache-Control": "private, max-age=86400"},
    )