"""Shared route guards."""
from fastapi import HTTPException, Request, status

from .security import has_session


def require_login(request: Request) -> None:
    """Add to any route that must only work after she has entered the password."""
    if not has_session(request):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Please enter the password first.")