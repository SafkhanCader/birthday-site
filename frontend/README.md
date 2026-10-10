# Frontend

React 19, TypeScript, Tailwind CSS v4, Vite, Motion (animations), lucide-react (icons). Fonts are bundled, so nothing loads from Google.

```bash
npm install
npm run dev      # http://localhost:5173 — password: love
npm run build    # production build → dist/
```

## Modes (`.env.development`)

| Variable | Meaning |
|---|---|
| `VITE_USE_MOCK=true` | Runs alone using `src/mock/content.ts`. |
| `VITE_USE_MOCK=false` | Uses the FastAPI backend. `/api` is proxied to port 8000. |
| `VITE_MOCK_PASSWORD` | Preview password only. The real one lives on the backend. |
| `VITE_MOCK_LOCKED=true` | Previews the sealed Gift and London sections with their countdown. |

The mock content is loaded on demand, so it is **not included** in a build with `VITE_USE_MOCK=false`. Your real letter and photos never end up in public JavaScript.

## Colour & mood

All colours are tokens in `src/styles/index.css`, with the same names in both themes:

| Token | Light "Blush & Wine" | Dark "Candlelight" |
|---|---|---|
| `canvas` | `#fff6f4` blush cream | `#12060b` deep wine-black |
| `surface` | `#ffffff` | `#1f0d15` |
| `ink` | `#3b1220` wine | `#fbeaee` pale rose |
| `rose` | `#d6336c` | `#f2648f` glowing rose |
| `rose-deep` | `#9d1c43` burgundy | `#c9305e` |
| `gold` | `#b8893f` champagne | `#e3c07a` candle gold |

Change a value there and every section follows. Use them in classes like `bg-canvas`, `text-rose`, `from-rose to-rose-deep`.

Shared utilities: `text-romance` (gradient text), `glass`, `card-love`, `btn-love`, `btn-icon`, `shadow-love`, `paper`, `eyebrow`.

Fonts: **Great Vibes** (script, for romantic moments), **Cormorant Garamond** (display, headings and letters), **Jost** (body text).

## Structure

```
src/
├── api/          client.ts (mock ↔ real switch), types.ts (content shapes)
├── auth/         AuthProvider — locked / unlocked state
├── theme/        ThemeProvider — light / dark, remembers her choice
├── config/       public.ts — the ONLY text visible before login
├── pages/        LockScreen, Experience (section order)
├── sections/     Hero, Journey, Album, Reasons, Letter, GiftReveal, London, Wishes, Future
├── components/   SectionShell, Photo, Lightbox, FlipCard, GiftBox, BoardingPass,
│                 Countdown, SealedCard, HeartBurst, FloatingHearts, TopBar, NavDots, …
├── hooks/        useCountdown, useActiveSection
├── mock/         sample content (preview mode only)
└── styles/       index.css — design tokens + utilities
```

## Details already handled

- Mobile-first layout, safe-area insets for notched phones, and swipeable photos.
- Respects the phone's "reduce motion" setting.
- `noindex` meta tag keeps the site out of search engines.
- No light/dark flash on load, because the theme is set before first paint.
- Music starts after she taps "Open my gift", since browsers only allow sound after a tap.
