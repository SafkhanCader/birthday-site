"""
POST /api/voice/unlock  { "code": "..." }  (login required)

The second lock. Even if she shares the main password with someone, the
voice note's words and recording are only sent after this code is right.
It also sets a separate cookie that the media route checks before it will
serve anything in media/voice/.
"""
import json

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel

from ..config import CONTENT_DIR, get_settings
from ..deps import require_login
from ..security import Attempts, check_secret, normalise, unlock_voice

router = APIRouter(prefix="/api/voice", tags=["voice"], dependencies=[Depends(require_login)])

# 6 wrong codes per 5 minutes — a 4-digit code can't be brute-forced
_voice_attempts = Attempts(limit=6, window=300)


class UnlockBody(BaseModel):
    code: str


@router.post("/unlock")
def unlock(body: UnlockBody, request: Request, response: Response):
    _voice_attempts.check(request)
    if not check_secret(normalise(body.code), get_settings().VOICE_CODE_HASH):
        _voice_attempts.fail(request)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Wrong code")
    _voice_attempts.reset(request)
    unlock_voice(response)
    return json.loads((CONTENT_DIR / "voice.json").read_text(encoding="utf-8"))