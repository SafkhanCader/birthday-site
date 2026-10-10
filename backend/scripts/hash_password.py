"""
Sets her website password and the voice note code.

Turns both into secure hashes and saves them straight into backend/.env
(together with a SECRET_KEY). What you type is never shown or stored.

Run from the backend folder:

    python -m scripts.hash_password
"""
import re
import secrets
from getpass import getpass

from app.config import BASE_DIR
from app.security import hash_secret, normalise

ENV_FILE = BASE_DIR / ".env"
KEYS = ("PASSWORD_HASH", "VOICE_CODE_HASH", "SECRET_KEY")


def ask(label: str) -> str:
    while True:
        first = getpass(f"{label} (typing is hidden): ")
        if len(first.strip()) < 4:
            print("  Please use at least 4 characters.\n")
            continue
        if getpass("Type it again: ") != first:
            print("  They didn't match — try again.\n")
            continue
        return first


def save(values: dict[str, str]) -> None:
    """Replaces these keys in backend/.env (or adds them at the top), keeping everything else."""
    old = ENV_FILE.read_text(encoding="utf-8") if ENV_FILE.exists() else ""
    kept = [line for line in old.splitlines() if not re.match(rf"^\s*({'|'.join(KEYS)})\s*=", line)]
    new = [f"{k}='{v}'" for k, v in values.items()]
    ENV_FILE.write_text("\n".join(["# Login (made by scripts/hash_password.py)", *new, "", *kept]).rstrip() + "\n", encoding="utf-8")


def main() -> None:
    print("\nPasswords aren't case-sensitive, and spaces at the start/end are ignored.\n")
    password = ask("Her website password")
    print()
    code = ask("Voice note code, e.g. 1310")

    save(
        {
            "PASSWORD_HASH": hash_secret(normalise(password)),
            "VOICE_CODE_HASH": hash_secret(normalise(code)),
            "SECRET_KEY": secrets.token_urlsafe(48),
        }
    )
    print(f"\n✓ Saved to {ENV_FILE}")
    print("  Now restart uvicorn (Ctrl + C, then run it again) and log in with the new password.\n")


if __name__ == "__main__":
    main()