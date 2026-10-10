"""
Sends the confirmation email to a guest after they leave a wish, via Resend.

- Uses Resend's HTTP API (https://resend.com/docs/api-reference/emails/send-email).
- Runs in the background: the guest sees "Thank you" immediately and never
  waits for the mail server. If sending fails, the wish is still saved.
- Every piece of guest text is HTML-escaped before it goes into the email.
"""
import logging
from datetime import datetime
from html import escape

import httpx

from .config import get_settings, load_site

log = logging.getLogger("birthday.mail")

# Same palette as the website (light "Blush & Wine")
ROSE, ROSE_DEEP, GOLD, INK, MUTED, CANVAS, SURFACE = "#d6336c", "#9d1c43", "#b8893f", "#3b1220", "#9a6b78", "#fff6f4", "#ffffff"


def _greeting_name(name: str) -> str:
    # Use the name exactly as they wrote it — "Aunty Fatima" should stay "Aunty Fatima"
    return name.strip() or "friend"


def _birthday_label(iso: str) -> str:
    try:
        d = datetime.fromisoformat(iso)
        return f"{d.day} {d.strftime('%B')}"
    except ValueError:
        return "her birthday"


def _fmt_seconds(s: float | None) -> str:
    if not s:
        return ""
    s = round(s)
    return f"{s // 60}:{s % 60:02d}"


# --------------------------------------------------------------------------- #
#  Guest confirmation
# --------------------------------------------------------------------------- #

def build_guest_email(*, name: str, message: str, has_video: bool, video_seconds: float | None) -> tuple[str, str, str]:
    """Returns (subject, plain_text, html)."""
    site = load_site()
    her = site["herName"]
    him = site["fromName"]
    day = _birthday_label(site["birthday"])
    first = _greeting_name(name)

    subject = f"Your birthday wish for {her} is safely tucked away"

    video_line = ""
    if has_video:
        length = _fmt_seconds(video_seconds)
        video_line = f"Your video message{f' ({length})' if length else ''} arrived safely too."

    # ---------- plain text (for mail apps that don't show HTML) ----------
    text = "\n".join(
        line
        for line in [
            f"Dear {first},",
            "",
            f"Thank you so much for your birthday wish for {her}.",
            f"It's safely tucked away, and she'll read it on {day}.",
            video_line,
            "",
            "Here's what you wrote:",
            f"“{message}”",
            "",
            "One small favour: please keep it a secret until then.",
            "",
            "With love and gratitude,",
            him,
        ]
        if line is not None
    )

    # ---------- HTML (inline styles only — that's what email clients support) ----------
    safe_first = escape(first)
    safe_msg = escape(message).replace("\n", "<br>")
    safe_her = escape(her)
    safe_him = escape(him)

    video_block = ""
    if has_video:
        length = _fmt_seconds(video_seconds)
        video_block = f"""
        <tr><td style="padding:0 40px 8px">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:{CANVAS};border-radius:14px">
            <tr><td style="padding:14px 18px;font:15px/1.5 Georgia,serif;color:{INK}">
              🎬&nbsp; Your video message{f' <span style="color:{MUTED}">({length})</span>' if length else ''} arrived safely too.
            </td></tr>
          </table>
        </td></tr>"""

    html = f"""<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{escape(subject)}</title></head>
<body style="margin:0;padding:0;background:{CANVAS}">
  <!-- preview text shown in the inbox list -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">Thank you, {safe_first} — {safe_her} will read your wish on {day}.</div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:{CANVAS}">
    <tr><td align="center" style="padding:32px 16px">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:{SURFACE};border-radius:24px;overflow:hidden;box-shadow:0 20px 50px -30px rgba(214,51,108,.45)">

        <!-- header band -->
        <tr><td style="background:linear-gradient(135deg,{ROSE},{ROSE_DEEP});background-color:{ROSE};padding:36px 40px;text-align:center">
          <div style="font-size:40px;line-height:1">💗</div>
          <div style="margin-top:12px;font:600 11px/1 Arial,sans-serif;letter-spacing:4px;text-transform:uppercase;color:#ffe3ec">A birthday wish for</div>
          <div style="margin-top:10px;font:italic 34px/1.1 Georgia,'Times New Roman',serif;color:#ffffff">{safe_her}</div>
        </td></tr>

        <!-- body -->
        <tr><td style="padding:36px 40px 8px;font:17px/1.65 Georgia,serif;color:{INK}">
          <p style="margin:0 0 16px">Dear {safe_first},</p>
          <p style="margin:0 0 16px">Thank you so much for your birthday wish. It's safely tucked away, and <strong>{safe_her}</strong> will read it on <strong>{day}</strong>.</p>
        </td></tr>

        {video_block}

        <!-- their message -->
        <tr><td style="padding:16px 40px 8px">
          <div style="font:600 11px/1 Arial,sans-serif;letter-spacing:3px;text-transform:uppercase;color:{GOLD};margin-bottom:10px">What you wrote</div>
          <div style="border-left:3px solid {ROSE};padding:4px 0 4px 18px;font:italic 18px/1.6 Georgia,serif;color:{INK}">“{safe_msg}”</div>
        </td></tr>

        <!-- secret reminder — attention box -->
        <tr><td style="padding:24px 40px 8px">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fff6e8;border:1px solid #f1d49a;border-left:5px solid {GOLD};border-radius:12px">
            <tr>
              <td width="52" valign="top" style="padding:16px 0 16px 16px">
                <table role="presentation" cellspacing="0" cellpadding="0"><tr>
                  <td width="36" height="36" align="center" valign="middle" style="background:{GOLD};border-radius:18px;font:bold 18px/36px Arial,sans-serif;color:#ffffff">!</td>
                </tr></table>
              </td>
              <td valign="top" style="padding:16px 18px 16px 12px">
                <div style="font:bold 12px/1.4 Arial,sans-serif;letter-spacing:2px;text-transform:uppercase;color:#8a5a12">Important — it's a surprise 🤫</div>
                <div style="margin-top:6px;font:14px/1.6 Arial,sans-serif;color:{INK}">
                  Please <strong>don't mention this to {safe_her}</strong> or share this email until her birthday on <strong>{day}</strong>.
                </div>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- sign-off -->
        <tr><td style="padding:28px 40px 40px;font:17px/1.6 Georgia,serif;color:{INK}">
          Regards,<br>
          <span style="font:italic 26px/1.4 Georgia,serif;color:{ROSE}">{safe_him}</span>
        </td></tr>
      </table>

      <div style="max-width:560px;margin-top:18px;font:12px/1.5 Arial,sans-serif;color:{MUTED};text-align:center">
        You're receiving this because you left a birthday wish and asked for a confirmation.
      </div>
    </td></tr>
  </table>
</body>
</html>"""
    return subject, text, html


# --------------------------------------------------------------------------- #
#  Copy for you (optional, NOTIFY_EMAIL)
# --------------------------------------------------------------------------- #

def build_owner_email(*, name: str, relation: str, message: str, has_video: bool, guest_email: str | None) -> tuple[str, str]:
    subject = f"New birthday wish from {name}{' 🎬' if has_video else ''}"
    text = (
        f"{name} ({relation}) just left a wish"
        f"{' with a video' if has_video else ''}.\n\n"
        f"“{message}”\n\n"
        f"Email: {guest_email or '— (no confirmation requested)'}"
    )
    return subject, text


# --------------------------------------------------------------------------- #
#  Sending
# --------------------------------------------------------------------------- #

class EmailError(Exception):
    """Resend refused the email — the message says why."""


def _send(to: str, subject: str, text: str, html: str | None = None, reply_to: str | None = None) -> str:
    """Sends one email through Resend. Returns Resend's email id."""
    s = get_settings()
    site = load_site()

    sender_name = (s.MAIL_FROM_NAME or f"{site['fromName']} 💗").replace('"', "")
    payload: dict = {
        # Resend's JSON API takes the display name as plain UTF-8 (emoji included)
        "from": f'"{sender_name}" <{s.MAIL_FROM}>',
        "to": [to],
        "subject": subject,
        "text": text,
    }
    if html:
        payload["html"] = html
    if reply_to:
        payload["reply_to"] = reply_to

    res = httpx.post(
        s.RESEND_API_URL,
        json=payload,
        headers={"Authorization": f"Bearer {s.RESEND_API_KEY}"},
        timeout=20,
    )
    if res.status_code >= 400:
        try:
            detail = res.json().get("message") or res.text
        except ValueError:
            detail = res.text
        raise EmailError(f"Resend said {res.status_code}: {detail}")
    return res.json().get("id", "")


def send_wish_emails(
    *, name: str, relation: str, message: str, guest_email: str | None, has_video: bool, video_seconds: float | None
) -> None:
    """Called as a background task after a wish is saved. Never raises."""
    s = get_settings()
    if not s.email_enabled:
        log.warning("Email not configured (RESEND_API_KEY empty) — skipping confirmation.")
        return

    if guest_email:
        if s.resend_test_sender:
            log.warning(
                "MAIL_FROM is %s (Resend test sender): it only delivers to your own Resend account email. "
                "Guests will receive confirmations once you verify a domain.",
                s.MAIL_FROM,
            )
        try:
            subject, text, html = build_guest_email(name=name, message=message, has_video=has_video, video_seconds=video_seconds)
            # Replies from guests land in your inbox, not the sending address
            _send(guest_email, subject, text, html, reply_to=s.REPLY_TO or None)
            log.info("Confirmation sent to %s", guest_email)
        except Exception:  # noqa: BLE001 — a failed email must never lose a wish
            log.exception("Could not send confirmation to %s", guest_email)

    if s.NOTIFY_EMAIL:
        try:
            subject, text = build_owner_email(
                name=name, relation=relation, message=message, has_video=has_video, guest_email=guest_email
            )
            _send(s.NOTIFY_EMAIL, subject, text, reply_to=guest_email)
        except Exception:  # noqa: BLE001
            log.exception("Could not send owner notification")