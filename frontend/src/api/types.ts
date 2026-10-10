/**
 * Shapes of the private content.
 * The backend's JSON files (backend/content/*.json) must match these.
 *
 * Photo paths:
 *  - mock mode: full URLs (placeholder images)
 *  - real mode: paths inside backend/media, e.g. "album/beach.webp"
 *    → resolved by mediaUrl() to /api/media/album/beach.webp
 */

export interface SiteInfo {
  herName: string;
  fromName: string;
  /** ISO date-time of the birthday, e.g. "2026-10-13T00:00:00+01:00" */
  birthday: string;
  heroLine: string;
  heroSubline: string;
  /** Optional background song (a file in backend/media/music) */
  music?: { src: string; title: string };
}

export interface Milestone {
  id: string;
  date: string;
  title: string;
  text: string;
  place?: string;
  photo?: string;
}

export interface AlbumPhoto {
  src: string;
  caption?: string;
  /** Natural size — used to reserve space so the grid doesn't jump */
  w: number;
  h: number;
}

export interface AlbumChapter {
  id: string;
  title: string;
  subtitle?: string;
  photos: AlbumPhoto[];
}

export interface Letter {
  greeting: string;
  paragraphs: string[];
  signoff: string;
  signature: string;
}

export interface GiftItem {
  title: string;
  note: string;
  photo?: string;
}

export interface Gift {
  title: string;
  note: string;
  photo?: string;
  /** Optional: several gifts, each with its own photo and note (shown after unwrapping) */
  items?: GiftItem[];
}

export interface TripItem {
  time: string;
  title: string;
  note?: string;
}

export interface TripDay {
  label: string;
  date: string;
  title: string;
  items: TripItem[];
}

export interface London {
  headline: string;
  from: string;
  fromCode: string;
  to: string;
  toCode: string;
  departDate: string;
  returnDate: string;
  stay: string;
  days: TripDay[];
  packing: string[];
}

export interface Wish {
  id: string;
  name: string;
  relation: string;
  message: string;
  /** ISO date — set on wishes sent through the guest form */
  createdAt?: string;
  /** Optional video message (media path, e.g. "wishes/abc123.mp4") */
  video?: string;
}

/* ---------------------- Guest wish form (/wish) ---------------------- */

/** Rules shared by the form and the backend (keep in sync with routes/wishes.py) */
export const WISH_RULES = {
  nameMax: 60,
  messageMin: 10,
  messageMax: 600,
  relations: ["Family", "Friend", "Colleague", "Other"] as const,
  /** Optional video message */
  videoMaxSeconds: 60,
  videoMaxMB: 150,
  emailMax: 254,
};

export type Relation = (typeof WISH_RULES.relations)[number];

/** What a valid invite link unlocks — only first names, nothing private */
export interface WishInvite {
  herName: string;
  fromName: string;
  birthday: string;
}

export interface NewWish {
  code: string;
  name: string;
  relation: Relation;
  message: string;
  /** Optional — only used to send them a confirmation, never shown on her page */
  email: string;
  /** Honeypot — real people never see or fill this */
  website: string;
}

/* --------------------- Private voice note (code-locked) --------------------- */

/** One spoken word, timed in seconds (made by backend/scripts/make_subtitles.py) */
export interface VoiceWord {
  start: number;
  end: number;
  text: string;
}

/** One subtitle line, timed in seconds from the start of the recording */
export interface VoiceCue {
  start: number;
  end: number;
  text: string;
  /** Optional exact word timings — when present, each word lights up as it's spoken */
  words?: VoiceWord[];
}

/** Only returned after the secret voice code is checked */
export interface VoiceNote {
  title: string;
  /** Media path, e.g. "voice/for-you.m4a" */
  src: string;
  cues: VoiceCue[];
}

/* ------------------------------ The book ------------------------------ */

/** One spread of the book: words on the left page, a photo on the right */
export interface BookEntry {
  /** Small label above the title, e.g. "Birthday one · 2024" */
  chapter?: string;
  date?: string;
  title: string;
  text: string;
  photo?: string;
  caption?: string;
}

export interface Book {
  title: string;
  subtitle?: string;
  /** Shown on the cover, e.g. "For Aisha, with all my love" */
  dedication?: string;
  entries: BookEntry[];
  /** Last left page */
  closing: { title: string; text: string };
}

export interface Future {
  intro: string;
  dreams: { id: string; title: string; text: string }[];
  closing: string;
  photo?: string;
}

export interface Content {
  site: SiteInfo;
  journey: Milestone[];
  album: AlbumChapter[];
  reasons: string[];
  letter: Letter;
  /** null = still sealed (before unlockAt). The backend removes it. */
  gift: Gift | null;
  london: London | null;
  wishes: Wish[];
  future: Future;
    /** The flip-book ("Your 3 Birthdays With Me") */
  book?: Book;
  /** Guest form link to share, e.g. "/wish?code=abc123" (only sent to her, after login) */
  wishInvite?: string;
  /** When the sealed sections open */
    /** When the sealed sections open */
  unlockAt: string;
  /** Per-section opening times, e.g. { gift: "…13 Oct…", london: "…13 Nov…" } */
  unlocks?: Record<string, string>;
  /** Hint shown on the voice note lock (the note itself is NOT in content) */
  voiceHint?: string;
}