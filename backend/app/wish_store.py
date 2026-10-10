"""
Saves guest wishes to backend/data/wishes.json.

A JSON file is plenty for a few dozen wishes and is easy for you to open,
read and edit by hand. Writes go through a temp file + rename, so a crash
mid-write can never leave a half-written (broken) file.
"""
import json
import os
import threading
from pathlib import Path

from .config import DATA_DIR

WISHES_FILE: Path = DATA_DIR / "wishes.json"
_lock = threading.Lock()


def read_all() -> list[dict]:
    if not WISHES_FILE.exists():
        return []
    try:
        return json.loads(WISHES_FILE.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return []


def append(wish: dict) -> None:
    with _lock:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        wishes = read_all()
        wishes.append(wish)
        tmp = WISHES_FILE.with_suffix(".tmp")
        tmp.write_text(json.dumps(wishes, ensure_ascii=False, indent=2), encoding="utf-8")
        os.replace(tmp, WISHES_FILE)


def public_view(wish: dict) -> dict:
    """What her page gets — the guest's email address is never included."""
    return {k: wish[k] for k in ("id", "name", "relation", "message", "createdAt", "video") if wish.get(k)}