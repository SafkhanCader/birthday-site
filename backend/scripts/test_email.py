"""
Sends ONE test confirmation email through Resend using backend/.env,
and prints exactly what happened. Run from the backend folder:

    python -m scripts.test_email you@gmail.com

With Resend's test sender (onboarding@resend.dev), use the email
address you signed up to Resend with — nothing else will be delivered.
"""
import sys

from app.config import BASE_DIR, get_settings
from app.mailer import EmailError, _send, build_guest_email


def main() -> None:
    s = get_settings()
    env_file = BASE_DIR / ".env"
    to = sys.argv[1] if len(sys.argv) > 1 else s.NOTIFY_EMAIL

    print(f"\n--- Settings ({'found' if env_file.exists() else 'NOT FOUND'}: {env_file}) ---")
    print(f"RESEND_API_KEY = {'set (' + s.RESEND_API_KEY[:5] + '…)' if s.RESEND_API_KEY else '(empty!)'}")
    print(f"MAIL_FROM      = {s.MAIL_FROM}")
    print(f"REPLY_TO       = {s.REPLY_TO or '(not set)'}")
    print(f"Sending to     = {to or '(no address — pass one as an argument)'}\n")

    if not env_file.exists():
        print("✗ There is no backend/.env file. Create it (see instructions) and run this again.")
        return
    if not s.RESEND_API_KEY:
        print("✗ RESEND_API_KEY is empty in backend/.env.")
        return
    if not s.RESEND_API_KEY.startswith("re_"):
        print("⚠ The key doesn't start with re_ — make sure you copied the whole Resend API key.\n")
    if not to:
        print("✗ No recipient. Run:  python -m scripts.test_email you@gmail.com")
        return
    if s.resend_test_sender:
        print("ℹ Using onboarding@resend.dev — this only delivers to your Resend sign-up email.\n")

    subject, text, html = build_guest_email(
        name="Test Guest", message="This is a test birthday wish 💗", has_video=False, video_seconds=None
    )
    try:
        email_id = _send(to, subject, text, html, reply_to=s.REPLY_TO or None)
    except EmailError as e:
        print(f"✗ {e}\n")
        msg = str(e).lower()
        if "testing emails" in msg or "own email" in msg or "verify a domain" in msg:
            print("→ onboarding@resend.dev can only send to your Resend sign-up email. Use that address.")
        elif "api key" in msg or " 401" in msg:
            print("→ The API key was rejected. Create a new one in Resend → API Keys and paste the whole key.")
        return
    except Exception as e:  # noqa: BLE001 — network problems etc.
        print(f"✗ Couldn't reach Resend: {type(e).__name__}: {e}")
        return

    print(f"✓ Sent! (Resend id: {email_id})")
    print(f"  Check the inbox — and spam folder — of {to}.")
    print("  You can also see it in the Resend dashboard → Emails.")


if __name__ == "__main__":
    main()