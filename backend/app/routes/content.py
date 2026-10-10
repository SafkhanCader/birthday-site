"""
GET /api/content — everything on her page, in one response (login required).

Reads backend/content/*.json and returns exactly the shape of `Content`
in frontend/src/api/types.ts.

- Sections listed in settings.json → "sealedSections" come back as null
  until "unlockAt", so the surprise can't be peeked at early (not even in
  the browser's developer tools — the data simply isn't sent).
- Guest wishes from the /wish form are added to the Wishes section,
  without their email addresses.
- The voice note is NOT included — it needs its own code (routes/voice.py).
"""
import json
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends

from .. import wish_store
from ..config import CONTENT_DIR
from ..deps import require_login

router = APIRouter(prefix="/api", tags=["content"], dependencies=[Depends(require_login)])


def _read(name: str, default=None):
    path: Path = CONTENT_DIR / f"{name}.json"
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def is_unlocked(unlock_at: str) -> bool:
    return datetime.now(timezone.utc) >= datetime.fromisoformat(unlock_at)


@router.get("/content")
def content():
    settings = _read("settings", {})
    unlock_at = settings.get("unlockAt", "2000-01-01T00:00:00+00:00")
    # A section can open later than her birthday, e.g. "sectionUnlocks": {"london": "2026-11-13T00:00:00+00:00"}
    unlocks = {name: settings.get("sectionUnlocks", {}).get(name, unlock_at) for name in settings.get("sealedSections", [])}
    sealed = {name for name, when in unlocks.items() if not is_unlocked(when)}

    # Your hand-written wishes first, then the ones guests sent through the form
    wishes = list(_read("wishes", [])) + [wish_store.public_view(w) for w in wish_store.read_all()]

    return {
        "site": _read("site"),
        "journey": _read("journey", []),
        "album": _read("album", []),
        "reasons": _read("reasons", []),
        "letter": _read("letter"),
        "gift": None if "gift" in sealed else _read("gift"),
        "london": None if "london" in sealed else _read("london"),
        "wishes": wishes,
        "future": _read("future"),
        "book": _read("book"),
        "unlockAt": unlock_at,
        "unlocks": unlocks,
        "voiceHint": settings.get("voiceHint"),
    }