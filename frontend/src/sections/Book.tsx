import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent, type ReactNode } from "react";
import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { ChevronLeft, ChevronRight, Heart, RotateCcw } from "lucide-react";
import type { Book as BookT, BookEntry } from "../api/types";
import { SectionShell } from "../components/SectionShell";
import { Photo } from "../components/Photo";

/* ==================================================================
   A 3D flip-book.

   How it's built — a real book is a stack of LEAVES (sheets of paper).
   Each leaf has a FRONT (seen on the right) and a BACK (seen on the left
   after it's turned). Every leaf is hinged at the spine and rotates
   0° → -180° to turn. So:

     leaf 0          front = cover              back = entry 1 words
     leaf 1..N       front = entry photo        back = next entry's words
     leaf N+1        front = "our next chapter" back = back cover

   which gives spreads of  [ words | photo ]  exactly like a photo book.
=================================================================== */

const EASE = [0.645, 0.045, 0.355, 1] as const; // ease-in-out, like a page settling
const TURN_SECONDS = 1.05;

/* ---------------------------- tiny helpers ---------------------------- */

function useMediaQuery(query: string) {
  const [match, setMatch] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return match;
}

/** A soft paper "whoosh", made on the fly with Web Audio — no sound file needed. */
function usePageSound() {
  const ctxRef = useRef<AudioContext | null>(null);
  return useCallback(() => {
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = (ctxRef.current ??= new Ctx());
      const len = Math.floor(ctx.sampleRate * 0.42);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        const t = i / len;
        d[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * t) ** 2 * (0.6 + 0.4 * Math.sin(t * 40));
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const band = ctx.createBiquadFilter();
      band.type = "bandpass";
      band.frequency.value = 2600;
      band.Q.value = 0.7;
      const gain = ctx.createGain();
      gain.gain.value = 0.12;
      src.connect(band).connect(gain).connect(ctx.destination);
      src.start();
    } catch {
      /* no audio available — silently skip */
    }
  }, []);
}

/* ------------------------------- faces ------------------------------- */

function PaperFace({ children, side, pageNo }: { children: ReactNode; side: "left" | "right"; pageNo?: number }) {
  return (
    <div
      className={`@container absolute inset-0 overflow-hidden bg-[#fbf6ef] text-[#3b1220] dark:bg-[#f4ebe0] ${
        side === "right" ? "rounded-r-[6px]" : "rounded-l-[6px]"
      }`}
    >
      {/* paper grain + gentle vignette */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.5] mix-blend-multiply"
        style={{
          backgroundImage:
            "radial-gradient(120% 90% at 50% 40%, transparent 60%, rgba(120,70,40,0.10)), url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='p'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3CfeColorMatrix values='0 0 0 0 .45 0 0 0 0 .3 0 0 0 0 .2 0 0 0 .08 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23p)'/%3E%3C/svg%3E\")",
        }}
      />
      {/* shadow of the spine falling onto the paper */}
      <div
        className={`pointer-events-none absolute inset-y-0 w-[14%] ${
          side === "right"
            ? "left-0 bg-gradient-to-r from-black/[0.16] via-black/[0.04] to-transparent"
            : "right-0 bg-gradient-to-l from-black/[0.16] via-black/[0.04] to-transparent"
        }`}
      />
      <div className="relative h-full">{children}</div>
      {pageNo !== undefined && (
        <span
          className={`absolute bottom-[3.5cqw] font-display text-[3.2cqw] text-[#9a6b78] italic ${
            side === "right" ? "right-[6cqw]" : "left-[6cqw]"
          }`}
        >
          {pageNo}
        </span>
      )}
    </div>
  );
}

function Flourish() {
  return (
    <div className="flex items-center justify-center gap-[2cqw] text-[#b8893f]" aria-hidden>
      <span className="h-px w-[10cqw] bg-gradient-to-r from-transparent to-current" />
      <Heart className="size-[3cqw] fill-current" />
      <span className="h-px w-[10cqw] bg-gradient-to-l from-transparent to-current" />
    </div>
  );
}

function WordsPage({ entry, pageNo }: { entry: BookEntry; pageNo: number }) {
  return (
    <PaperFace side="left" pageNo={pageNo}>
      <div className="flex h-full flex-col justify-center px-[11cqw] py-[12cqw] text-center">
        {entry.chapter && (
          <p className="font-sans text-[2.6cqw] font-medium tracking-[0.35em] text-[#b8893f] uppercase">{entry.chapter}</p>
        )}
        <div className="my-[4cqw]">
          <Flourish />
        </div>
        <h3 className="font-display text-[8.5cqw] leading-[1.05] font-medium text-balance">{entry.title}</h3>
        {entry.date && <p className="mt-[3cqw] font-display text-[4cqw] text-[#9d1c43] italic">{entry.date}</p>}
        <p className="mx-auto mt-[6cqw] max-w-[62ch] text-left font-display text-[4.6cqw] leading-[1.55] text-pretty text-[#4d2330]">
          <span className="float-left mr-[1.5cqw] font-script text-[13cqw] leading-[0.8] text-[#d6336c]">{entry.text.charAt(0)}</span>
          {entry.text.slice(1)}
        </p>
      </div>
    </PaperFace>
  );
}

function PhotoPage({ entry, pageNo, eager }: { entry: BookEntry; pageNo: number; eager?: boolean }) {
  const tilt = ((pageNo * 37) % 5) - 2; // a small, consistent tilt per page (−2°…2°)
  return (
    <PaperFace side="right" pageNo={pageNo}>
      <div className="flex h-full flex-col items-center justify-center px-[9cqw] py-[10cqw]">
        <figure
          className="relative w-full bg-white p-[3.2cqw] pb-[3cqw] shadow-[0_2cqw_5cqw_-2cqw_rgba(59,18,32,0.45)]"
          style={{ transform: `rotate(${tilt * 0.6}deg)` }}
        >
          {/* washi tape */}
          <span
            className="absolute -top-[2.6cqw] left-1/2 h-[5.5cqw] w-[24cqw] -translate-x-1/2 rotate-[-3deg] bg-[#f7c9d5]/80 shadow-sm"
            aria-hidden
          />
          <Photo src={entry.photo} alt={entry.caption ?? entry.title} ratio="3/4" className="w-full" eager={eager} />
          {entry.caption && (
            <figcaption className="mt-[2.4cqw] text-center font-script text-[6cqw] leading-tight text-[#9d1c43]">{entry.caption}</figcaption>
          )}
        </figure>
      </div>
    </PaperFace>
  );
}

function CoverFront({ book, herName }: { book: BookT; herName: string }) {
  return (
    <div className="@container absolute inset-0 overflow-hidden rounded-r-[10px] rounded-l-[3px] bg-[#5e0f2b]">
      {/* leather texture + light */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(90% 70% at 30% 20%, rgba(255,160,190,0.22), transparent 60%), radial-gradient(120% 100% at 80% 110%, rgba(0,0,0,0.45), transparent 60%), linear-gradient(135deg, #7d1838 0%, #5a0e29 55%, #3d0719 100%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-40 mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='l'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.4' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23l)'/%3E%3C/svg%3E\")",
        }}
      />
      {/* spine hinge */}
      <div className="absolute inset-y-0 left-0 w-[5%] bg-gradient-to-r from-black/45 via-white/10 to-transparent" />
      <div className="absolute inset-y-0 left-[5.5%] w-px bg-black/30" />

      {/* gold frame */}
      <div className="absolute inset-[6cqw] rounded-[2cqw] border-[0.6cqw] border-[#d9b36a]/80" />
      <div className="absolute inset-[8.2cqw] rounded-[1.4cqw] border border-[#d9b36a]/50" />
      {["top-[5cqw] left-[5cqw]", "top-[5cqw] right-[5cqw] rotate-90", "bottom-[5cqw] right-[5cqw] rotate-180", "bottom-[5cqw] left-[5cqw] -rotate-90"].map(
        (pos) => (
          <svg key={pos} viewBox="0 0 40 40" className={`absolute size-[9cqw] text-[#e3c07a] ${pos}`} aria-hidden>
            <path d="M2 38 V14 Q2 2 14 2 H38" fill="none" stroke="currentColor" strokeWidth="2.2" />
            <path d="M8 38 V18 Q8 8 18 8 H38" fill="none" stroke="currentColor" strokeWidth="1" opacity=".7" />
            <circle cx="14" cy="14" r="2.6" fill="currentColor" />
          </svg>
        ),
      )}

      {/* title — gold foil */}
      <div className="relative flex h-full flex-col items-center justify-center px-[14cqw] text-center">
        <Heart className="size-[11cqw] fill-[#e3c07a] text-[#e3c07a] drop-shadow-[0_0.4cqw_0_rgba(0,0,0,0.35)]" />
        <p className="mt-[5cqw] font-sans text-[2.7cqw] tracking-[0.5em] text-[#e9cf97] uppercase">{book.subtitle ?? "A book of us"}</p>
        <h3
          className="mt-[3cqw] font-display text-[11.5cqw] leading-[0.98] font-semibold text-balance"
          style={{
            backgroundImage: "linear-gradient(100deg,#a8792c 0%,#f7e3a3 28%,#c9974a 46%,#fff1c4 62%,#b8893f 80%,#e8c77f 100%)",
            backgroundSize: "220% 100%",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            filter: "drop-shadow(0 0.35cqw 0 rgba(0,0,0,0.35))",
            animation: "shimmer 7s linear infinite",
          }}
        >
          {book.title}
        </h3>
        <div className="mt-[6cqw] h-px w-[30cqw] bg-gradient-to-r from-transparent via-[#e3c07a] to-transparent" />
        <p className="mt-[5cqw] font-script text-[8cqw] leading-none text-[#f3dca8]">{herName}</p>
        {book.dedication && <p className="mt-[3cqw] font-display text-[3.6cqw] text-[#e9cf97]/85 italic">{book.dedication}</p>}
      </div>
    </div>
  );
}

function BackCover({ fromName }: { fromName: string }) {
  return (
    <div className="@container absolute inset-0 overflow-hidden rounded-l-[10px] rounded-r-[3px] bg-[#5e0f2b]">
      <div className="absolute inset-0" style={{ background: "linear-gradient(225deg, #7d1838 0%, #5a0e29 55%, #3d0719 100%)" }} />
      <div className="absolute inset-y-0 right-0 w-[5%] bg-gradient-to-l from-black/45 via-white/10 to-transparent" />
      <div className="absolute inset-[6cqw] rounded-[2cqw] border-[0.6cqw] border-[#d9b36a]/60" />
      <div className="relative flex h-full flex-col items-center justify-center gap-[3cqw] text-center">
        <Heart className="size-[7cqw] fill-[#e3c07a] text-[#e3c07a]" />
        <p className="font-script text-[7cqw] text-[#f3dca8]">with love, {fromName}</p>
      </div>
    </div>
  );
}

function ClosingPage({ book, pageNo }: { book: BookT; pageNo: number }) {
  return (
    <PaperFace side="left" pageNo={pageNo}>
      <div className="flex h-full flex-col items-center justify-center px-[12cqw] text-center">
        <Flourish />
        <h3 className="mt-[6cqw] font-script text-[12cqw] leading-none text-[#d6336c]">{book.closing.title}</h3>
        <p className="mt-[6cqw] font-display text-[4.8cqw] leading-[1.55] text-pretty text-[#4d2330] italic">{book.closing.text}</p>
      </div>
    </PaperFace>
  );
}

function NextChapterPage({ pageNo }: { pageNo: number }) {
  return (
    <PaperFace side="right" pageNo={pageNo}>
      <div className="flex h-full flex-col items-center justify-center gap-[4cqw] px-[12cqw] text-center">
        <div className="grid size-[22cqw] place-items-center rounded-full border border-dashed border-[#d6336c]/40">
          <Heart className="size-[8cqw] animate-heartbeat fill-[#d6336c]/80 text-[#d6336c]/80" />
        </div>
        <p className="font-sans text-[2.6cqw] tracking-[0.35em] text-[#b8893f] uppercase">Birthday four</p>
        <p className="font-display text-[5cqw] text-[#9a6b78] italic">This page is saved for us.</p>
      </div>
    </PaperFace>
  );
}

/* -------------------------------- leaf -------------------------------- */

interface LeafProps {
  index: number;
  total: number;
  turned: boolean;
  front: ReactNode;
  back: ReactNode;
  /** This leaf is the top page on the right (can be turned forward) */
  isNextTurn: boolean;
  /** This leaf is the top page on the left (can be turned back) */
  isPrevTurn: boolean;
  interactive: boolean;
  instant: boolean;
  onFlip: (dir: 1 | -1) => void;
}

function Leaf({ index, total, turned, front, back, isNextTurn, isPrevTurn, interactive, instant, onFlip }: LeafProps) {
  const rot = useMotionValue(turned ? -180 : 0);
  const el = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; w: number; dir: 1 | -1; moved: boolean } | null>(null);

  // Animate to the resting position whenever the book's page changes
  useEffect(() => {
    const c = animate(rot, turned ? -180 : 0, instant ? { duration: 0 } : { duration: TURN_SECONDS, ease: EASE });
    return () => c.stop();
  }, [turned, instant, rot]);

  // While a page is in the air it must sit above everything else
  const zIndex = useTransform(rot, (r) => (r > -1 ? total - index : r < -179 ? index + 1 : total + 10));

  // Lighting: the front darkens as it lifts away from the light; the back brightens as it lands
  const frontShade = useTransform(rot, [0, -90], [0, 0.42]);
  const backShade = useTransform(rot, [-90, -180], [0.42, 0]);
  // A soft highlight sweeping across the paper — reads as the page bending
  const sweep = useTransform(rot, [0, -90, -180], [120, 50, -20]);
  const highlight = useMotionTemplate`linear-gradient(90deg, transparent ${sweep}%, rgba(255,255,255,0.28) calc(${sweep}% + 8%), transparent calc(${sweep}% + 22%))`;
  const lift = useTransform(rot, [0, -20, -90, -160, -180], [0, 0.35, 0.55, 0.35, 0]);
  // (box-shadow, not filter: a CSS filter would flatten the 3D page)
  const shadow = useMotionTemplate`0 18px 40px -8px rgba(35,5,15,${lift})`;

  /* ---- drag a page by hand (desktop) ---- */
  const onDown = (e: RPointerEvent, dir: 1 | -1) => {
    if (!interactive) return;
    if ((dir === 1 && !isNextTurn) || (dir === -1 && !isPrevTurn)) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, w: el.current?.offsetWidth ?? 400, dir, moved: false };
  };
  const onMove = (e: RPointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 6) d.moved = true;
    if (!d.moved) return;
    const span = d.w * 1.7;
    const r = d.dir === 1 ? Math.min(0, Math.max(-180, (dx / span) * 180)) : Math.min(0, Math.max(-180, -180 + (dx / span) * 180));
    rot.set(r);
  };
  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (!d.moved) return onFlip(d.dir); // a simple click turns the page
    const r = rot.get();
    const commit = d.dir === 1 ? r < -55 : r > -125;
    if (commit) onFlip(d.dir);
    else animate(rot, d.dir === 1 ? 0 : -180, { duration: 0.45, ease: EASE }); // let go too early → falls back
  };

  const faceStyle = { backfaceVisibility: "hidden" as const, WebkitBackfaceVisibility: "hidden" as const };

  return (
    <motion.div
      ref={el}
      className="absolute top-0 left-1/2 h-full w-1/2 origin-left [transform-style:preserve-3d]"
      style={{ rotateY: rot, zIndex }}
    >
      {/* FRONT — seen on the right */}
      <motion.div
        className={`absolute inset-0 ${interactive && isNextTurn ? "cursor-grab active:cursor-grabbing" : ""}`}
        style={{ ...faceStyle, boxShadow: shadow }}
        onPointerDown={(e) => onDown(e, 1)}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        {front}
        <motion.div className="pointer-events-none absolute inset-0 rounded-r-[6px] bg-gradient-to-l from-black to-black/40" style={{ opacity: frontShade }} />
        <motion.div className="pointer-events-none absolute inset-0" style={{ backgroundImage: highlight }} />
        {/* the corner curls up a little on hover to invite a turn */}
        {interactive && isNextTurn && (
          <div className="group absolute right-0 bottom-0 size-[18%]">
            <div className="absolute right-0 bottom-0 size-0 bg-gradient-to-tl from-[#f4ebe0] via-[#e9dccb] to-[#cdb9a3] shadow-[-4px_-4px_10px_rgba(0,0,0,0.18)] transition-all duration-300 group-hover:size-[46%] [clip-path:polygon(100%_0,0_100%,100%_100%)]" />
          </div>
        )}
      </motion.div>

      {/* BACK — seen on the left once turned */}
      <motion.div
        className={`absolute inset-0 ${interactive && isPrevTurn ? "cursor-grab active:cursor-grabbing" : ""}`}
        style={{ ...faceStyle, rotateY: 180, boxShadow: shadow }}
        onPointerDown={(e) => onDown(e, -1)}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        {back}
        <motion.div className="pointer-events-none absolute inset-0 rounded-l-[6px] bg-gradient-to-r from-black to-black/40" style={{ opacity: backShade }} />
      </motion.div>
    </motion.div>
  );
}

/* ----------------------- stacked page edges ----------------------- */

function PageEdges({ side, count }: { side: "left" | "right"; count: number }) {
  const w = Math.min(count, 14) * 0.9;
  if (w <= 0) return null;
  return (
    <div
      className={`pointer-events-none absolute top-[0.6%] bottom-[0.6%] ${side === "right" ? "left-full rounded-r-[4px]" : "right-full rounded-l-[4px]"}`}
      style={{
        width: w,
        background: "repeating-linear-gradient(90deg,#efe4d5 0 1px,#d8c8b3 1px 2px)",
        boxShadow: side === "right" ? "2px 0 4px rgba(0,0,0,.15)" : "-2px 0 4px rgba(0,0,0,.15)",
      }}
      aria-hidden
    />
  );
}

/* ================================ Book ================================ */

export function Book({ book, herName, fromName }: { book: BookT; herName: string; fromName: string }) {
  const reduce = useReducedMotion();
  const narrow = useMediaQuery("(max-width: 639px)"); // phones: one page at a time
  const playSound = usePageSound();

  const entries = book.entries;
  const N = entries.length;
  const LEAVES = N + 2;

  // current = number of leaves turned (0 = closed on the cover, LEAVES = closed on the back)
  const [current, setCurrent] = useState(0);
  // phones only: which half of the spread is on screen
  const [side, setSide] = useState<"left" | "right">("right");

  const leaves = useMemo(() => {
    const list: { front: ReactNode; back: ReactNode }[] = [];
    list.push({
      front: <CoverFront book={book} herName={herName} />,
      back: <WordsPage entry={entries[0]} pageNo={1} />,
    });
    entries.forEach((entry, i) => {
      list.push({
        front: <PhotoPage entry={entry} pageNo={i * 2 + 2} eager={i < 2} />,
        back: i + 1 < N ? <WordsPage entry={entries[i + 1]} pageNo={i * 2 + 3} /> : <ClosingPage book={book} pageNo={N * 2 + 1} />,
      });
    });
    list.push({ front: <NextChapterPage pageNo={N * 2 + 2} />, back: <BackCover fromName={fromName} /> });
    return list;
  }, [book, entries, N, herName, fromName]);

  const flip = useCallback(
    (dir: 1 | -1) => {
      setCurrent((c) => {
        const next = Math.max(0, Math.min(LEAVES, c + dir));
        if (next !== c) playSound();
        return next;
      });
    },
    [LEAVES, playSound],
  );

  // Phone navigation: read the left page, then the right page, then turn
  const next = useCallback(() => {
    if (!narrow) return flip(1);
    if (current > 0 && current < LEAVES && side === "left") return setSide("right");
    if (current >= LEAVES) return;
    flip(1);
    setSide("left");
  }, [narrow, current, side, LEAVES, flip]);

  const prev = useCallback(() => {
    if (!narrow) return flip(-1);
    if (current > 0 && current < LEAVES && side === "right") return setSide("left");
    if (current <= 0) return;
    flip(-1);
    setSide("right");
  }, [narrow, current, side, LEAVES, flip]);

  const restart = () => {
    setCurrent(0);
    setSide("right");
    playSound();
  };

  // Keyboard: ← → when the book is on screen
  const wrap = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const r = wrap.current?.getBoundingClientRect();
      if (!r || r.bottom < 0 || r.top > window.innerHeight) return;
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  // Swipe (phones)
  const swipe = useRef<number | null>(null);

  // Where the book sits: closed → cover centred; open → spread centred
  const closedFront = current === 0;
  const closedBack = current === LEAVES;
  const shift = narrow
    ? side === "right" || closedFront
      ? "-50%"
      : "0%"
    : closedFront
      ? "-25%"
      : closedBack
        ? "25%"
        : "0%";

  // Label under the book
  const label = closedFront
    ? "Tap the cover to open"
    : closedBack
      ? "The end — for now"
      : narrow
        ? `Page ${side === "left" ? current * 2 - 1 : current * 2} of ${LEAVES * 2 - 2}`
        : `Pages ${current * 2 - 1}–${current * 2} of ${LEAVES * 2 - 2}`;

  return (
    <SectionShell
      id="book"
      width="wide"
      eyebrow="Our story in pages"
      title={
        <>
          A book, <span className="text-romance italic">just about us</span>
        </>
      }
      subtitle="Turn the pages slowly — drag a corner, tap a page, or use the arrows."
    >
      <div ref={wrap} className="relative mx-auto" style={{ width: narrow ? "100%" : "min(100%, 1080px, calc((100svh - 17rem) * 1.5))" }}>
        {/* soft light pooling under the book */}
        <div className="pointer-events-none absolute inset-x-[10%] -bottom-6 h-16 rounded-[50%] bg-rose/25 blur-2xl" aria-hidden />

        <div
          className={narrow ? "overflow-hidden rounded-xl" : ""}
          style={{ perspective: 2600 }}
          onPointerDown={(e) => narrow && (swipe.current = e.clientX)}
          onPointerUp={(e) => {
            if (!narrow || swipe.current === null) return;
            const dx = e.clientX - swipe.current;
            swipe.current = null;
            if (dx < -40) next();
            else if (dx > 40) prev();
            else {
              // a tap: right part of the screen = forward, left part = back
              const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
              if (e.clientX - r.left > r.width * 0.35) next();
              else prev();
            }
          }}
        >
          <motion.div
            className="relative"
            // Flat container (so z-index decides which page is on top) that gives each page its own perspective
            style={{ width: narrow ? "200%" : "100%", aspectRatio: "3 / 2", perspective: narrow ? 1600 : 2200 }}
            initial={false}
            animate={{ x: shift, rotateX: narrow ? 0 : 7 }}
            transition={reduce ? { duration: 0 } : { duration: 0.9, ease: EASE }}
          >
            {/* the pages that don't move: the stack's edges on each side */}
            <div className="absolute inset-y-0 right-0 w-1/2">{!closedBack && <PageEdges side="right" count={LEAVES - current - 1} />}</div>
            <div className="absolute inset-y-0 left-0 w-1/2">{!closedFront && <PageEdges side="left" count={current - 1} />}</div>

            {/* spine shadow between the two open pages */}
            {!closedFront && !closedBack && (
              <div
                className="pointer-events-none absolute top-0 bottom-0 left-1/2 z-[200] w-[5%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(40,10,20,0.28),transparent_70%)]"
                aria-hidden
              />
            )}

            {leaves.map((leaf, i) => (
              <Leaf
                key={i}
                index={i}
                total={LEAVES}
                turned={i < current}
                front={leaf.front}
                back={leaf.back}
                isNextTurn={i === current}
                isPrevTurn={i === current - 1}
                interactive={!narrow}
                instant={!!reduce}
                onFlip={flip}
              />
            ))}
          </motion.div>
        </div>

        {/* controls */}
        <div className="mt-10 flex items-center justify-center gap-3 sm:gap-5">
          <button type="button" onClick={prev} disabled={current === 0 && side === "right"} className="btn-icon glass !size-12 disabled:opacity-30" aria-label="Previous page">
            <ChevronLeft className="size-5" />
          </button>
          <div className="min-w-44 text-center">
            <p className="font-display text-lg text-ink italic tabular-nums">{label}</p>
            {/* progress */}
            <div className="mx-auto mt-2 h-1 w-40 overflow-hidden rounded-full bg-surface-2">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-rose to-gold"
                animate={{ width: `${(current / LEAVES) * 100}%` }}
                transition={{ duration: 0.6 }}
              />
            </div>
          </div>
          {closedBack ? (
            <button type="button" onClick={restart} className="btn-icon glass !size-12" aria-label="Read again from the start">
              <RotateCcw className="size-5" />
            </button>
          ) : (
            <button type="button" onClick={next} className="btn-icon glass !size-12" aria-label="Next page">
              <ChevronRight className="size-5" />
            </button>
          )}
        </div>
      </div>
    </SectionShell>
  );
}