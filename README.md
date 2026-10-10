# Birthday Site 💗

A private, password-protected birthday story. Built with React, TypeScript, Tailwind CSS and Vite on the frontend, and FastAPI on the backend.

```
birthday-site/
├── frontend/   ← Step 1 (done): the full website, runs on its own with sample content
└── backend/    ← Step 2 (next): password login, private content, private photos
```

## Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 and use the password **love** (preview mode only).

## The story, in order

| # | Section | File |
|---|---|---|
| 1 | Lock screen | `frontend/src/pages/LockScreen.tsx` |
| 2 | Happy Birthday + countdown | `frontend/src/sections/Hero.tsx` |
| 3 | Our Journey (timeline) | `frontend/src/sections/Journey.tsx` |
| 4 | Our Album (chapters + full-screen viewer) | `frontend/src/sections/Album.tsx` |
| 5 | Reasons I Love You (flip cards) | `frontend/src/sections/Reasons.tsx` |
| 6 | The Letter (envelope + wax seal) | `frontend/src/sections/Letter.tsx` |
| 7 | Gift Reveal (unwrap) | `frontend/src/sections/GiftReveal.tsx` |
| 8 | London (boarding pass, itinerary, packing) | `frontend/src/sections/London.tsx` |
| 9 | Wishes from loved ones | `frontend/src/sections/Wishes.tsx` |
| 10 | Our Forever + closing | `frontend/src/sections/Future.tsx` |

Section order is set in `frontend/src/pages/Experience.tsx`.

## How it works

1. **Lock screen.** The password is checked by the backend, which sets an httpOnly cookie.
2. **`GET /api/content`.** Returns all words and photo paths. The Gift and London sections stay `null` until 13 October.
3. **`GET /api/media/...`.** Photos are served only to a logged-in visitor.

In preview mode (`VITE_USE_MOCK=true`), all of this is simulated in the browser, so you can design every section without the backend.

## Build plan

- [x] Step 1 — Frontend: theme, lock screen, all 10 sections, light/dark
- [ ] Step 2 — Backend: login, sessions, content API, protected media, date-sealing
- [ ] Step 3 — Real content: your photos (optimised to WebP), words, music
- [ ] Step 4 — Deploy: one FastAPI service serving the built frontend over HTTPS
- [ ] Step 5 — Test on her phone size, print a QR code for the card
