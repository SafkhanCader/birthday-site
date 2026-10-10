"""
POST /api/login   { "password": "..." }  → sets the session cookie
POST /api/logout                         → clears it (and the voice unlock)
GET  /api/me                             → 200 if logged in, 401 if not
"""
from fastapi import APIRouter, HTTPException, Request, Response, status
from pydantic import BaseModel

from ..config import get_settings
from ..security import Attempts, check_secret, end_session, has_session, normalise, start_session

router = APIRouter(prefix="/api", tags=["auth"])

# 8 wrong passwords per 5 minutes per visitor
_login_attempts = Attempts(limit=8, window=300)


class LoginBody(BaseModel):
    password: str


@router.post("/login", status_code=status.HTTP_204_NO_CONTENT)
def login(body: LoginBody, request: Request, response: Response):
    _login_attempts.check(request)
    if not check_secret(normalise(body.password), get_settings().PASSWORD_HASH):
        _login_attempts.fail(request)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "That's not quite it, my love.")
    _login_attempts.reset(request)
    start_session(response)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response):
    end_session(response)


@router.get("/me")
def me(request: Request):
    if not has_session(request):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not logged in.")
    return {"ok": True}