import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { AnimatePresence, motion, useAnimationControls } from "motion/react";
import {
  ArrowRight,
  Captions,
  CaptionsOff,
  Eye,
  EyeOff,
  Headphones,
  List,
  LoaderCircle,
  Lock,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import { api, ApiError, mediaUrl, USE_MOCK } from "../api/client";
import type { VoiceCue, VoiceNote } from "../api/types";
import { SectionShell } from "../components/SectionShell";

/* ------------------------------------------------------------------
   PRIVATE VOICE NOTE
   A second lock inside the site: even if she shares the main password
   with someone, the recording + subtitles only come from the server
   after the voice code is checked. Nothing about it is in page content.
------------------------------------------------------------------- */

const fmt = (s: number) => (Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "0:00");

/** Tell the background song to step aside while he's talking */
const announce = (playing: boolean) => window.dispatchEvent(new CustomEvent("bd:voice", { detail: playing }));

/* ============================ 1. The lock ============================ */

function VoiceLock({ hint, onOpen }: { hint?: string; onOpen: (note: VoiceNote) => void }) {
  const [code, setCode] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const shake = useAnimationControls();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      onOpen(await api.unlockVoice(code));
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 429
          ? "Too many tries. Wait a minute, my love."
          : err instanceof ApiError && err.status === 401
            ? "Not quite. Try again."
            : "Something went wrong. Please try again.",
      );
      setCode("");
      shake.start({ x: [0, -10, 10, -6, 6, 0], transition: { duration: 0.4 } });
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      className="card-love relative mx-auto max-w-xl overflow-hidden px-6 py-12 text-center sm:px-12"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.35 } }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="pointer-events-none absolute -top-24 left-1/2 size-64 -translate-x-1/2 rounded-full bg-rose/15 blur-3xl" aria-hidden />

      {/* Headphones with a small lock badge */}
      <div className="relative mx-auto grid size-20 place-items-center rounded-full bg-gradient-to-br from-rose to-rose-deep text-on-rose shadow-love">
        <Headphones className="size-9" />
        <span className="absolute -right-1 -bottom-1 grid size-8 place-items-center rounded-full bg-surface text-gold ring-4 ring-surface">
          <Lock className="size-4" />
        </span>
      </div>

      <h3 className="relative mt-7 font-display text-3xl text-ink sm:text-4xl">For your ears only</h3>
      <p className="relative mx-auto mt-3 max-w-sm leading-relaxed text-muted">
        Put your headphones on, find a quiet moment, and enter the little code I gave you.
      </p>

      <motion.form onSubmit={submit} animate={shake} className="relative mx-auto mt-8 max-w-xs">
        <label htmlFor="voice-code" className="sr-only">
          Voice note code
        </label>
        <div className="flex items-center gap-1 rounded-full border border-line bg-surface-2 p-1.5 transition-shadow focus-within:border-rose/50 focus-within:ring-4 focus-within:ring-rose/10">
          <input
            id="voice-code"
            type={show ? "text" : "password"}
            inputMode="text"
            autoComplete="off"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              if (error) setError(null);
            }}
            placeholder="• • • •"
            aria-invalid={!!error}
            aria-describedby="voice-code-msg"
            className="min-w-0 flex-1 bg-transparent px-3 py-2 text-center font-display text-2xl tracking-[0.4em] text-ink outline-none placeholder:tracking-[0.3em] placeholder:text-muted/50"
          />
          <button type="button" onClick={() => setShow((s) => !s)} className="btn-icon !size-10 shrink-0" aria-label={show ? "Hide code" : "Show code"}>
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
          <button type="submit" disabled={busy || !code.trim()} className="btn-love !size-11 shrink-0 !p-0" aria-label="Unlock voice note">
            {busy ? <LoaderCircle className="size-5 animate-spin" /> : <ArrowRight className="size-5" />}
          </button>
        </div>
        <p id="voice-code-msg" className={`mt-3 min-h-5 text-sm ${error ? "text-rose" : "text-muted/80 italic"}`} aria-live="polite">
          {error ?? hint ?? ""}
        </p>
      </motion.form>

      <p className="relative mt-6 text-xs tracking-[0.2em] text-gold uppercase">Even if you share this page, this stays between us</p>
    </motion.div>
  );
}

/* ========================= 2. Waveform scrubber ========================= */

// Decorative bars with a gentle, voice-like shape (deterministic, so no jumping)
function useBars(count: number) {
  return useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const wave = Math.sin(i * 0.55) * 0.35 + Math.sin(i * 1.7 + 1) * 0.2;
        const noise = (Math.sin(i * 12.9898) * 43758.5453) % 1;
        return 0.28 + Math.abs(wave) + Math.abs(noise) * 0.3;
      }),
    [count],
  );
}

function Waveform({ progress, duration, onSeek }: { progress: number; duration: number; onSeek: (ratio: number) => void }) {
  const bars = useBars(56);
  const ref = useRef<HTMLDivElement>(null);

  const seekFromPointer = (clientX: number) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    onSeek(Math.min(1, Math.max(0, (clientX - r.left) / r.width)));
  };

  const onKey = (e: KeyboardEvent) => {
    const step = duration ? 5 / duration : 0.05;
    if (e.key === "ArrowRight") onSeek(Math.min(1, progress + step));
    if (e.key === "ArrowLeft") onSeek(Math.max(0, progress - step));
  };

  return (
    <div
      ref={ref}
      role="slider"
      tabIndex={0}
      aria-label="Seek"
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={Math.round(progress * duration)}
      aria-valuetext={fmt(progress * duration)}
      onPointerDown={(e) => {
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        seekFromPointer(e.clientX);
      }}
      onPointerMove={(e) => e.buttons === 1 && seekFromPointer(e.clientX)}
      onKeyDown={onKey}
      className="flex h-16 w-full cursor-pointer touch-none items-center gap-[3px]"
    >
      {bars.map((h, i) => {
        const played = i / bars.length < progress;
        return (
          <span
            key={i}
            className={`flex-1 rounded-full transition-colors duration-300 ${played ? "bg-gradient-to-t from-rose-deep to-rose" : "bg-ink-soft/15"}`}
            style={{ height: `${Math.min(100, h * 100)}%` }}
          />
        );
      })}
    </div>
  );
}

/* ============================ 3. Subtitles ============================ */

/** The line being spoken — words light up as he says them */
function Subtitle({ cue, time }: { cue: VoiceCue | null; time: number }) {
  if (!cue) return null;
  const words = cue.words?.length ? cue.words : null;
  const texts = words ? words.map((w) => w.text) : cue.text.split(" ");
  const p = Math.min(1, Math.max(0, (time - cue.start) / (cue.end - cue.start)));
  const spoken = (i: number) => (words ? time >= words[i].start : i / texts.length < p);

  return (
    <p className="font-display text-2xl leading-snug text-balance italic sm:text-3xl">
      {texts.map((w, i) => (
        <span key={i} className={`transition-colors duration-200 ${spoken(i) ? "text-ink" : "text-muted/40"}`}>
          {w}{" "}
        </span>
      ))}
    </p>
  );
}

/** Which subtitle belongs to this moment (holds the last line briefly through pauses) */
function activeCueIndex(cues: VoiceCue[], t: number) {
  const now = cues.findIndex((c) => t >= c.start && t < c.end);
  if (now !== -1) return now;
  for (let i = cues.length - 1; i >= 0; i--) if (cues[i].end <= t) return t - cues[i].end < 0.8 ? i : -1;
  return -1;
}

/* ============================= 4. Player ============================= */

function VoicePlayer({ note, fromName, onLock }: { note: VoiceNote; fromName: string; onLock: () => void }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const [captions, setCaptions] = useState(true);
  const [transcript, setTranscript] = useState(false);

  // Smooth clock: timeupdate only fires ~4×/sec, too slow for word highlighting
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const tick = () => {
      if (audio.current) setTime(audio.current.currentTime);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  // Leaving the section (or locking) always stops the voice and brings the music back
  useEffect(() => () => void announce(false), []);

  const toggle = useCallback(() => {
    const a = audio.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => setLoadError(true));
    else a.pause();
  }, []);

  const seekTo = (seconds: number) => {
    const a = audio.current;
    if (!a) return;
    a.currentTime = Math.max(0, Math.min(seconds, duration || seconds));
    setTime(a.currentTime);
  };

  const total = duration || note.cues.at(-1)?.end || 0;
  const idx = activeCueIndex(note.cues, time);
  const cue = idx >= 0 ? note.cues[idx] : null;

  return (
    <motion.div
      className="card-love relative mx-auto max-w-2xl overflow-hidden px-5 py-10 sm:px-10 sm:py-12"
      initial={{ opacity: 0, y: 30, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className={`pointer-events-none absolute -top-32 left-1/2 size-80 -translate-x-1/2 rounded-full bg-rose/20 blur-3xl transition-opacity duration-1000 ${
          playing ? "opacity-100" : "opacity-40"
        }`}
        aria-hidden
      />

      <audio
        ref={audio}
        src={mediaUrl(note.src)}
        preload="metadata"
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onPlay={() => {
          setPlaying(true);
          announce(true);
        }}
        onPause={() => {
          setPlaying(false);
          announce(false);
        }}
        onEnded={() => {
          setPlaying(false);
          announce(false);
        }}
        onTimeUpdate={(e) => !playing && setTime(e.currentTarget.currentTime)}
        onError={() => setLoadError(true)}
      />

      {/* Title */}
      <div className="relative text-center">
        <p className="eyebrow">A voice note from {fromName}</p>
        <h3 className="mt-3 font-display text-3xl leading-tight text-ink italic sm:text-4xl">{note.title}</h3>
      </div>

      {/* Play button with breathing rings */}
      <div className="relative mt-10 flex justify-center">
        <div className="relative grid size-24 place-items-center">
          {playing &&
            [0, 1].map((i) => (
              <motion.span
                key={i}
                className="absolute inset-0 rounded-full border border-rose/40"
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 1.7, opacity: 0 }}
                transition={{ duration: 2.4, repeat: Infinity, delay: i * 1.2, ease: "easeOut" }}
                aria-hidden
              />
            ))}
          <button
            type="button"
            onClick={toggle}
            disabled={loadError}
            className="relative grid size-24 place-items-center rounded-full bg-gradient-to-br from-rose to-rose-deep text-on-rose shadow-love transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
            aria-label={playing ? "Pause" : "Play voice note"}
          >
            {playing ? <Pause className="size-9 fill-current" /> : <Play className="ml-1 size-9 fill-current" />}
          </button>
        </div>
      </div>

      {/* Waveform + time */}
      <div className="relative mt-8">
        <Waveform progress={total ? time / total : 0} duration={total} onSeek={(r) => seekTo(r * total)} />
        <div className="mt-2 flex justify-between text-xs text-muted tabular-nums">
          <span>{fmt(time)}</span>
          <span>{fmt(total)}</span>
        </div>
      </div>

      {/* Subtitles */}
      {captions && (
        <div className="relative mt-8 flex min-h-32 items-center justify-center text-center sm:min-h-28" aria-live="off">
          <AnimatePresence mode="wait">
            <motion.div
              key={idx === -1 ? (time === 0 ? "start" : "gap") : idx}
              initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
              transition={{ duration: 0.45 }}
            >
              {cue ? (
                <Subtitle cue={cue} time={time} />
              ) : (
                <p className="font-display text-xl text-muted italic">{time === 0 ? "Press play and listen closely…" : "…"}</p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {loadError && (
        <p className="relative mt-6 rounded-2xl border border-rose/30 bg-rose/5 px-4 py-3 text-center text-sm text-rose" role="alert">
          The recording couldn't be loaded.
          {USE_MOCK && ` Preview mode: put your file at frontend/public${note.src}`}
        </p>
      )}

      {/* Small controls */}
      <div className="relative mt-8 flex flex-wrap items-center justify-center gap-1 border-t border-line pt-5">
        <button type="button" onClick={() => seekTo(time - 5)} className="btn-icon !w-auto gap-1.5 px-3 text-xs" aria-label="Back 5 seconds">
          <RotateCcw className="size-4" /> 5s
        </button>
        <button
          type="button"
          onClick={() => setCaptions((c) => !c)}
          aria-pressed={captions}
          className={`btn-icon !w-auto gap-1.5 px-3 text-xs ${captions ? "!text-rose" : ""}`}
        >
          {captions ? <Captions className="size-4" /> : <CaptionsOff className="size-4" />} Subtitles
        </button>
        <button
          type="button"
          onClick={() => setTranscript((t) => !t)}
          aria-expanded={transcript}
          className={`btn-icon !w-auto gap-1.5 px-3 text-xs ${transcript ? "!text-rose" : ""}`}
        >
          <List className="size-4" /> All words
        </button>
        <button type="button" onClick={onLock} className="btn-icon !w-auto gap-1.5 px-3 text-xs" aria-label="Lock voice note again">
          <Lock className="size-4" /> Lock
        </button>
      </div>

      {/* Full transcript — tap a line to jump there */}
      <AnimatePresence>
        {transcript && (
          <motion.ol
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="relative mt-4 space-y-1 overflow-hidden"
          >
            {note.cues.map((c, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => seekTo(c.start)}
                  className={`flex w-full gap-4 rounded-xl px-3 py-2 text-left transition-colors hover:bg-surface-2 ${
                    i === idx ? "bg-surface-2" : ""
                  }`}
                >
                  <span className="pt-1 text-xs text-gold tabular-nums">{fmt(c.start)}</span>
                  <span className={`font-display text-lg italic ${i === idx ? "text-rose" : "text-ink-soft"}`}>{c.text}</span>
                </button>
              </li>
            ))}
          </motion.ol>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ============================== Section ============================== */

export function Voice({ fromName, hint }: { fromName: string; hint?: string }) {
  // Kept in memory only: a reload (or someone else picking up the phone) sees the lock again
  const [note, setNote] = useState<VoiceNote | null>(null);

  return (
    <SectionShell
      id="voice"
      width="narrow"
      eyebrow="Only for you"
      title={
        <>
          A little <span className="text-romance italic">voice note</span>
        </>
      }
      subtitle="Some things sound better than they read."
    >
      <AnimatePresence mode="wait">
        {note ? (
          <VoicePlayer key="player" note={note} fromName={fromName} onLock={() => setNote(null)} />
        ) : (
          <VoiceLock key="lock" hint={hint} onOpen={setNote} />
        )}
      </AnimatePresence>
    </SectionShell>
  );
}