"""
All settings come from backend/.env — nothing secret lives in code.
"""
import json
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent  # backend/
CONTENT_DIR = BASE_DIR / "content"
MEDIA_DIR = BASE_DIR / "media"
DATA_DIR = BASE_DIR / "data"  # guest wishes are saved here (gitignored)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env", extra="ignore")

    # --- Login ---
    PASSWORD_HASH: str = ""  # made by: python -m scripts.hash_password
    VOICE_CODE_HASH: str = ""  # the voice note's code, hashed the same way
    SECRET_KEY: str = ""  # long random string that signs the login cookie
    SESSION_DAYS: int = 30  # how long she stays logged in
    COOKIE_SECURE: bool = False  # true once the site runs on https

    # --- Guest wish form ---
    GUEST_CODE: str = "family2026"
    """The code in the link she shares: /wish?code=..."""

    # --- Public address of the site (used for links inside emails) ---
    SITE_URL: str = "http://localhost:5173"

    # --- Email via Resend (https://resend.com) ---
    RESEND_API_KEY: str = ""  # starts with re_ — create one with "Sending access" only
    RESEND_API_URL: str = "https://api.resend.com/emails"
    MAIL_FROM: str = "onboarding@resend.dev"  # later: an address on your verified domain
    MAIL_FROM_NAME: str = ""  # defaults to "<fromName> 💗"
    NOTIFY_EMAIL: str = ""  # optional: you get a copy of every new wish
    REPLY_TO: str = ""  # optional: where guests' replies go (e.g. your Gmail)

    # --- Limits (keep in sync with WISH_RULES in frontend/src/api/types.ts) ---
    VIDEO_MAX_MB: int = 150
    VIDEO_MAX_SECONDS: int = 60

    @property
    def email_enabled(self) -> bool:
        return bool(self.RESEND_API_KEY and self.MAIL_FROM)

    @property
    def resend_test_sender(self) -> bool:
        """onboarding@resend.dev can only deliver to your own Resend account address."""
        return self.MAIL_FROM.lower().endswith("@resend.dev")


@lru_cache
def get_settings() -> Settings:
    s = Settings()
    if not s.SECRET_KEY:
        # Still works, but everyone is logged out whenever the server restarts.
        import logging
        import secrets

        logging.getLogger("birthday").warning("SECRET_KEY is empty in .env — using a temporary one.")
        s.SECRET_KEY = secrets.token_urlsafe(48)
    return s


def load_site() -> dict:
    """Her name, your name and the birthday — from content/site.json."""
    return json.loads((CONTENT_DIR / "site.json").read_text(encoding="utf-8"))