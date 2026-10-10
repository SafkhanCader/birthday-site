"""
FastAPI entry point.

  /api/login, /api/logout, /api/me   → routes/auth.py     (her password)
  /api/content                       → routes/content.py  (her page, sealed sections)
  /api/voice/unlock                  → routes/voice.py    (the voice note's own code)
  /api/media/{path}                  → routes/media.py    (private photos, music, videos)
  /api/wishes/invite, /api/wishes    → routes/wishes.py   (public guest form + emails)

In production it also serves the built React app (frontend/dist), so the
whole site runs as one service on one domain.
"""
import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .config import BASE_DIR
from .routes import auth, content, media, voice, wishes

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

app = FastAPI(title="Birthday Site", docs_url=None, redoc_url=None, openapi_url=None)


@app.middleware("http")
async def private_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Robots-Tag"] = "noindex, nofollow, noarchive"  # stay out of search engines
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "same-origin"
    if request.url.path.startswith("/api/") and not request.url.path.startswith("/api/media/"):
        response.headers["Cache-Control"] = "no-store"  # never cache private data
    return response


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


for r in (auth, content, voice, media, wishes):
    app.include_router(r.router)


# ------------------ Built frontend (production only) ------------------ #
DIST = BASE_DIR.parent / "frontend" / "dist"

if DIST.exists():
    app.mount("/assets", StaticFiles(directory=DIST / "assets"), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def spa(full_path: str):
        # Never let a stray preview file (e.g. public/voice/…) bypass the voice lock
        if full_path.startswith(("api/", "voice/")):
            raise HTTPException(404, "Not found")
        file = (DIST / full_path).resolve()
        if full_path and DIST.resolve() in file.parents and file.is_file():
            return FileResponse(file)  # favicon.svg etc.
        return FileResponse(DIST / "index.html")  # React handles /, /wish, …