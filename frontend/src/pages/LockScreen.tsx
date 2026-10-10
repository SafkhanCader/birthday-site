import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  animate,
  AnimatePresence,
  motion,
  useAnimationControls,
  useMotionValue,
  useReducedMotion,
  type AnimationPlaybackControls,
} from "motion/react";
import { ArrowRight, Eye, EyeOff, Feather, LoaderCircle } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { ApiError, USE_MOCK } from "../api/client";
import { publicCopy } from "../config/public";
import { FloatingHearts } from "../components/FloatingHearts";
import { ThemeToggle } from "../components/ThemeToggle";
import { Dove, type DoveMode } from "../components/Dove";

/* ------------------------------------------------------------------
   The lock screen, told as a tiny story:

   1. flying     a white dove carrying a sealed letter wanders across the sky
   2. landing    it glides down and perches on the top edge of the card
   3. delivering it lets go of the letter → the envelope drops, the flap
                 opens and the letter rises out…
   4. ready      …and the letter IS the password field.

   Plays once per browser session (reloads go straight to the letter),
   can be skipped, and is skipped entirely for "reduce motion" users.
------------------------------------------------------------------- */

type Stage = "flying" | "landing" | "delivering" | "ready";

const SEEN_KEY = "bd-dove-seen";
const EASE = [0.45, 0, 0.25, 1] as const;

const PLAY_ONCE_PER_VISIT = false;

function alreadySeen() {
  if (!PLAY_ONCE_PER_VISIT) return false;
  try {
    return sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}
function markSeen() {
  try {
    sessionStorage.setItem(SEEN_KEY, "1");
  } catch {
    /* ignore */
  }
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);

export function LockScreen() {
  const { login } = useAuth();
  const reduce = useReducedMotion();
  const skipIntro = reduce || alreadySeen();

  const [stage, setStage] = useState<Stage>(skipIntro ? "ready" : "flying");
  const [doveMode, setDoveMode] = useState<DoveMode>(skipIntro ? "perch" : "fly");
  const [facing, setFacing] = useState<1 | -1>(1);
  // envelope choreography: 0 falling · 1 flap open · 2 letter rising · 3 done
  const [envPhase, setEnvPhase] = useState(skipIntro ? 3 : 0);

  // form
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const shake = useAnimationControls();
  const inputRef = useRef<HTMLInputElement>(null);

  // layout
  const sceneRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [doveW, setDoveW] = useState(120);
  const x = useMotionValue(-200);
  const y = useMotionValue(120);
  const running = useRef<AnimationPlaybackControls[]>([]);

  /* ---------- where the dove perches: top edge of the card, right side ---------- */
  const perchPoint = useCallback(() => {
    const scene = sceneRef.current?.getBoundingClientRect();
    const card = cardRef.current?.getBoundingClientRect();
    if (!scene || !card) return { x: 0, y: 0 };
    const h = doveW * (100 / 140);
    return {
      x: card.left - scene.left + card.width * 0.8 - doveW / 2,
      y: card.top - scene.top - h * 0.8,
    };
  }, [doveW]);

  // Dove size follows the screen
  useLayoutEffect(() => {
    const size = () => setDoveW(window.innerWidth < 640 ? 92 : 124);
    size();
    window.addEventListener("resize", size);
    return () => window.removeEventListener("resize", size);
  }, []);

  // Keep the perched dove on the card when the window resizes
  useEffect(() => {
    if (stage === "flying" || stage === "landing") return;
    const place = () => {
      const p = perchPoint();
      x.set(p.x);
      y.set(p.y);
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [stage, perchPoint, x, y]);

  // Face the direction of travel
  useEffect(() => {
    let last = x.get();
    return x.on("change", (v) => {
      const d = v - last;
      last = v;
      if (Math.abs(d) > 0.6) setFacing(d > 0 ? 1 : -1);
    });
  }, [x]);

  /* ------------------------------ the flight ------------------------------ */
  const deliver = useCallback(() => {
    setStage("delivering");
    setDoveMode("perch");
    setFacing(-1); // turn to look at the letter / the reader
    markSeen();
    setEnvPhase(0);
    setTimeout(() => setEnvPhase(1), 750);
    setTimeout(() => setEnvPhase(2), 1350);
    setTimeout(() => {
      setEnvPhase(3);
      setStage("ready");
    }, 2300);
  }, []);

  useEffect(() => {
    if (skipIntro) return;
    const scene = sceneRef.current;
    if (!scene) return;
    let cancelled = false;

    (async () => {
      const W = scene.clientWidth;
      const H = scene.clientHeight;
      const top = H * 0.08;
      const bottom = H * 0.55;
      // Enter from the left, wander through a few random points, drift away from the card…
      const xs = [-doveW * 1.4, rand(W * 0.12, W * 0.3), rand(W * 0.6, W * 0.85), rand(W * 0.2, W * 0.4), rand(W * 0.55, W * 0.75)];
      const ys = [rand(top, bottom), rand(top, bottom * 0.7), rand(top, bottom), rand(top, bottom * 0.6), rand(top, top + H * 0.15)];
      x.set(xs[0]);
      y.set(ys[0]);

      const dur = W < 640 ? 5.2 : 6.4;
      running.current = [
        animate(x, xs, { duration: dur, ease: "easeInOut" }),
        animate(y, ys, { duration: dur, ease: "easeInOut" }),
      ];
      await Promise.all(running.current);
      if (cancelled) return;

      // …then glide down onto the card
      setStage("landing");
      setDoveMode("glide");
      const p = perchPoint();
      running.current = [
        animate(x, p.x, { duration: 1.7, ease: EASE }),
        animate(y, [y.get(), p.y - 40, p.y], { duration: 1.7, ease: EASE }),
      ];
      await Promise.all(running.current);
      if (cancelled) return;
      deliver();
    })();

    return () => {
      cancelled = true;
      running.current.forEach((c) => c.stop());
    };
    // run once on mount
  }, []);

  const skip = () => {
    running.current.forEach((c) => c.stop());
    const p = perchPoint();
    x.set(p.x);
    y.set(p.y);
    deliver();
  };

  // Focus the field the moment the letter is open
  useEffect(() => {
    if (stage === "ready") inputRef.current?.focus({ preventScroll: true });
  }, [stage]);

  /* ------------------------------ login ------------------------------ */
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      await login(password);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? "That's not quite it, my love. Try again."
          : err instanceof ApiError && err.status === 429
            ? "Too many tries — wait a minute and try again."
            : "Something went wrong. Please try again.",
      );
      shake.start({ x: [0, -12, 12, -8, 8, -4, 4, 0], transition: { duration: 0.5 } });
      setDoveMode("flutter"); // the dove is startled too
      setTimeout(() => setDoveMode("perch"), 800);
      inputRef.current?.select();
    } finally {
      setBusy(false);
    }
  };

  const [titleStart, titleEnd] = [
    publicCopy.lockTitle.split(" ").slice(0, -1).join(" "),
    publicCopy.lockTitle.split(" ").slice(-1)[0],
  ];
  const inTheAir = stage === "flying" || stage === "landing";

  return (
    <main ref={sceneRef} className="relative flex min-h-dvh items-center justify-center overflow-hidden px-5 py-20">
      <FloatingHearts count={12} />
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 size-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose/20 blur-[110px]"
        aria-hidden
      />
      <ThemeToggle className="absolute top-[max(1rem,env(safe-area-inset-top))] right-4 z-30" />

      {/* ------------------------------ the dove ------------------------------ */}
      <motion.div className="pointer-events-none absolute top-0 left-0 z-20" style={{ x, y, width: doveW }}>
        {/* gentle rise-and-fall while flying */}
        <motion.div
          animate={inTheAir ? { y: [0, -10, 0, 8, 0], rotate: [0, -4, 0, 3, 0] } : { y: 0, rotate: 0 }}
          transition={inTheAir ? { duration: 2.2, repeat: Infinity, ease: "easeInOut" } : { duration: 0.4 }}
        >
          <div
            style={{ transform: `scaleX(${facing})`, transition: "transform .35s ease" }}
            className="drop-shadow-[0_10px_18px_rgba(90,20,45,0.28)]"
          >
            <Dove mode={doveMode} letter={inTheAir} />
          </div>
        </motion.div>
      </motion.div>

      {/* ------------------------------ the card ------------------------------ */}
      <motion.div
        ref={cardRef}
        className="glass relative z-10 w-full max-w-md rounded-[2rem] px-6 pt-10 pb-8 text-center shadow-love sm:px-10"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="eyebrow">Private · For your eyes only</p>
        <h1 className="mt-4 font-display text-[2.6rem] leading-tight font-medium text-balance text-ink sm:text-5xl">
          {titleStart} <span className="text-romance italic">{titleEnd}</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xs leading-relaxed text-muted">{publicCopy.lockSubtitle}</p>

        {/* the letter's stage */}
        <div className="relative mx-auto mt-8 h-[16.5rem] w-full max-w-sm">
          <AnimatePresence mode="wait">
            {inTheAir ? (
              <motion.div
                key="waiting"
                className="absolute inset-0 flex flex-col items-center justify-center gap-4"
                exit={{ opacity: 0, transition: { duration: 0.3 } }}
              >
                <div className="relative grid size-20 place-items-center">
                  <span className="absolute inset-0 animate-ping rounded-full border border-rose/30 [animation-duration:2.6s]" />
                  <span className="absolute inset-2 rounded-full border border-dashed border-rose/40" />
                  <Feather className="size-7 text-rose/70" />
                </div>
                <p className="font-display text-lg text-muted italic">A little messenger is on its way…</p>
              </motion.div>
            ) : (
              <LetterReveal key="letter" phase={envPhase}>
                {/* ----------- the letter's contents: the password form ----------- */}
                <motion.form onSubmit={submit} animate={shake} className="flex h-full flex-col px-6 pt-6 pb-5 text-left">
                  <p className="font-display text-2xl leading-tight text-ink italic">My love,</p>
                  <p className="mt-1 text-sm text-muted">Only you know the key to this letter.</p>

                  <label htmlFor="key" className="sr-only">
                    Secret key
                  </label>
                  <div className="mt-5 flex items-center border-b-2 border-rose/30 transition-colors focus-within:border-rose">
                    <input
                      ref={inputRef}
                      id="key"
                      type={show ? "text" : "password"}
                      autoComplete="current-password"
                      disabled={envPhase < 3}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError(null);
                      }}
                      placeholder={publicCopy.placeholder}
                      aria-invalid={!!error}
                      aria-describedby={error ? "key-error" : "key-hint"}
                      className="min-w-0 flex-1 bg-transparent py-2.5 font-display text-2xl tracking-wide text-[#3b1220] outline-none placeholder:text-base placeholder:tracking-normal placeholder:text-[#9a6b78]/70"
                    />
                    <button
                      type="button"
                      onClick={() => setShow((s) => !s)}
                      className="grid size-9 shrink-0 place-items-center rounded-full text-[#9a6b78] transition-colors hover:text-[#d6336c]"
                      aria-label={show ? "Hide key" : "Show key"}
                    >
                      {show ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
                    </button>
                  </div>

                  <div className="mt-2 min-h-5 text-sm" aria-live="polite">
                    {error ? (
                      <p id="key-error" className="text-[#d6336c]">
                        {error}
                      </p>
                    ) : (
                      <p id="key-hint" className="text-[#9a6b78] italic">
                        {publicCopy.hint}
                      </p>
                    )}
                  </div>

                  <button type="submit" disabled={busy || !password.trim()} className="btn-love mt-auto w-full">
                    {busy ? <LoaderCircle className="size-5 animate-spin" /> : null}
                    {busy ? "Opening…" : publicCopy.button}
                    {!busy && <ArrowRight className="size-4" />}
                  </button>
                </motion.form>
              </LetterReveal>
            )}
          </AnimatePresence>
        </div>

        {USE_MOCK && stage === "ready" && (
          <p className="mt-6 inline-block rounded-full border border-dashed border-line px-3 py-1 text-xs text-muted">
            Preview mode · password: <code className="font-medium text-ink">{import.meta.env.VITE_MOCK_PASSWORD || "love"}</code>
          </p>
        )}
      </motion.div>

      {/* skip the intro */}
      <AnimatePresence>
        {inTheAir && (
          <motion.button
            type="button"
            onClick={skip}
            className="absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-1/2 z-30 -translate-x-1/2 rounded-full px-4 py-2 text-xs tracking-[0.25em] text-muted uppercase transition-colors hover:text-rose"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 1.2 } }}
            exit={{ opacity: 0 }}
          >
            Skip ›
          </motion.button>
        )}
      </AnimatePresence>
    </main>
  );
}

/* ------------------------------------------------------------------
   The envelope: drops in, opens its flap, and the letter rises out.
   phase 0 falling · 1 flap open · 2 letter rising · 3 envelope gone
------------------------------------------------------------------- */
function LetterReveal({ phase, children }: { phase: number; children: ReactNode }) {
  const done = phase >= 3;
  return (
    <motion.div className="absolute inset-0" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* envelope (bottom part of the stage) */}
      <motion.div
        className="absolute inset-x-4 bottom-0 h-36 [perspective:900px]"
        initial={{ y: -150, opacity: 0, rotate: -10, scale: 0.55 }}
        animate={
          done
            ? { y: 30, opacity: 0, scale: 0.9, transition: { duration: 0.5 } }
            : { y: 0, opacity: 1, rotate: 0, scale: 1, transition: { type: "spring", stiffness: 140, damping: 14 } }
        }
      >
        {/* back */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-[#f4dfe5] to-[#ecd2da] shadow-love" />
        {/* flap */}
        <motion.div
          className="absolute inset-x-0 top-0 h-[60%] origin-top"
          style={{ zIndex: phase >= 1 ? 1 : 30, transformStyle: "preserve-3d" }}
          animate={{ rotateX: phase >= 1 ? 180 : 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          <div className="h-full w-full bg-gradient-to-b from-[#f7e6eb] to-[#e9c9d3] [clip-path:polygon(0_0,100%_0,50%_100%)]" />
          {/* wax seal on the flap */}
          <div className="absolute top-[78%] left-1/2 grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-gradient-to-br from-rose to-rose-deep text-white shadow-love [backface-visibility:hidden]">
            <span className="text-sm">♥</span>
          </div>
        </motion.div>
        {/* front pocket */}
        <div className="absolute inset-0 z-20 rounded-xl bg-gradient-to-t from-[#f2d8df] to-[#f8e8ec] [clip-path:polygon(0_28%,50%_62%,100%_28%,100%_100%,0_100%)]" />
      </motion.div>

      {/* the letter — rises out of the envelope and becomes the form */}
      <motion.div
        className="absolute inset-x-0 top-0 h-full overflow-hidden rounded-2xl border border-[#ead6dc] text-[#3b1220] shadow-[0_24px_50px_-24px_rgba(90,20,45,0.5)]"
        style={{
          zIndex: done ? 40 : 10,
          pointerEvents: done ? "auto" : "none",
          // warm letter paper with a soft deckle-edge glow
          background: "radial-gradient(120% 90% at 50% 0%, #fffdf9 0%, #fff7f1 60%, #fbeee8 100%)",
        }}
        initial={{ y: 150, scale: 0.84, opacity: 0 }}
        animate={
          phase >= 2
            ? { y: 0, scale: 1, opacity: 1, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } }
            : { y: 150, scale: 0.84, opacity: 0 }
        }
      >
        {children}
      </motion.div>
    </motion.div>
  );
}