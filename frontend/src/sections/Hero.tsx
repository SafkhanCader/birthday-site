import type { CSSProperties } from "react";
import { motion } from "motion/react";
import { ChevronDown, Sparkles } from "lucide-react";
import type { SiteInfo } from "../api/types";
import { Countdown } from "../components/Countdown";
import { FloatingHearts } from "../components/FloatingHearts";
import { useCountdown } from "../hooks/useCountdown";

const ease = [0.22, 1, 0.36, 1] as const;

/* ------------------------------------------------------------------
   Little love notes that float up behind the hero, forever.
   Add, remove or change any line — the layout adapts automatically.
------------------------------------------------------------------- */
const COMPLIMENTS = [
  "You are so brave",
  "You are so intelligent",
  "You are my home",
  "Your smile lights up my world",
  "You are so beautiful",
  "You make every day better",
  "You are my best friend",
  "You are so kind",
  "I'm so proud of you",
  "You are my favourite person",
  "You are so strong",
  "You make me a better man",
  "Your laugh is my favourite sound",
  "You are pure magic",
  "You are my forever",
  "You inspire me every day",
  "You have the kindest heart",
  "You are my peace",
  "You are one in a million",
  "You are my greatest blessing",
  "You are so wonderful",
  "I choose you, always",
  "You are my sunshine",
  "Life is sweeter with you",
];

/* Stable "random" numbers so the layout is the same on every render */
const rnd = (seed: number) => {
  const v = Math.sin(seed * 9301 + 49297) * 233280;
  return v - Math.floor(v);
};

/*  3 depths give a soft sense of distance:
    far  = small, faint, slightly blurred, slow
    near = larger, clearer, a little faster                              */
const DEPTHS = [
  { size: "text-sm sm:text-base", opacity: 0.35, blur: 1.2, min: 34, max: 42 },
  { size: "text-base sm:text-xl", opacity: 0.5, blur: 0.4, min: 27, max: 33 },
  { size: "text-lg sm:text-2xl", opacity: 0.7, blur: 0, min: 21, max: 26 },
];
const TONES = ["text-rose", "text-rose-deep dark:text-rose", "text-gold", "text-ink-soft"];

const PER_SIDE = Math.ceil(COMPLIMENTS.length / 2);

const WORDS = COMPLIMENTS.map((text, i) => {
  const depth = DEPTHS[i % 3];
  const duration = depth.min + rnd(i + 1) * (depth.max - depth.min);
  const k = Math.floor(i / 2); // position within its side
  return {
    text,
    depth,
    tone: TONES[i % TONES.length],
    // alternate left / right so the words frame her name instead of covering it
    side: i % 2 === 0 ? ("left" as const) : ("right" as const),
    inset: 3 + (k % 3) * 6 + rnd(i + 7) * 3, // % from that edge, 3 sub-lanes
    duration,
    // evenly spaced phases (negative delay = the sky is already full when the page opens)
    delay: -((k + rnd(i + 3) * 0.4) / PER_SIDE) * duration,
    // sway inwards, so words on the right never slide off the screen
    sway: (8 + rnd(i + 11) * 18) * (i % 2 === 0 ? 1 : -1),
    swayTime: 5 + rnd(i + 13) * 4,
    heart: i % 4 === 0,
  };
});

function FloatingCompliments() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none" aria-hidden>
      <style>{`
        @keyframes compliment-rise {
          0%   { transform: translateY(100%); opacity: 0; }
          12%  { opacity: var(--o); }
          72%  { opacity: var(--o); }
          100% { transform: translateY(10%); opacity: 0; }
        }
        @keyframes compliment-sway {
          0%, 100% { transform: translateX(0) rotate(-2deg); }
          50%      { transform: translateX(var(--sway)) rotate(2deg); }
        }
        .compliment      { animation: compliment-rise var(--d) linear var(--delay) infinite; opacity: 0; will-change: transform, opacity; }
        .compliment > span { animation: compliment-sway var(--st) ease-in-out infinite; }
        /* almost invisible behind her name, clear around it */
        .compliments-fade { mask-image: radial-gradient(42% 46% at 50% 50%, rgba(0,0,0,.06) 0%, rgba(0,0,0,.06) 45%, #000 100%); -webkit-mask-image: radial-gradient(42% 46% at 50% 50%, rgba(0,0,0,.06) 0%, rgba(0,0,0,.06) 45%, #000 100%); }
        @media (prefers-reduced-motion: reduce) { .compliment { display: none; } }
      `}</style>

      <div className="compliments-fade absolute inset-0">
        {WORDS.map((w, i) => (
          <div
            key={w.text}
            // show fewer on phones so it never feels busy
            className={`compliment absolute inset-0 ${i >= 14 ? "hidden sm:block" : ""}`}
            style={
              {
                "--d": `${w.duration}s`,
                "--delay": `${w.delay}s`,
                "--o": w.depth.opacity,
                "--sway": `${w.sway}px`,
                "--st": `${w.swayTime}s`,
              } as CSSProperties
            }
          >
            <span
              className={`absolute top-0 inline-flex items-center gap-1.5 font-display whitespace-nowrap italic ${w.depth.size} ${w.tone}`}
              style={{
                [w.side]: `${w.inset}%`,
                filter: w.depth.blur ? `blur(${w.depth.blur}px)` : undefined,
              }}
            >
              {w.heart && <span className="text-[0.7em] not-italic">♥</span>}
              {w.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Hero({ site }: { site: SiteInfo }) {
  const { done: isBirthday } = useCountdown(site.birthday);
  const date = new Date(site.birthday).toLocaleDateString("en-GB", { day: "numeric", month: "long" });

  return (
    <section id="hero" className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 pt-24 pb-28">
      <FloatingHearts count={16} />
      <FloatingCompliments />

      {/* Soft halo behind the name */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose/15 blur-[110px]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-4xl text-center">
        <motion.p
          className="eyebrow"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease, delay: 0.2 }}
        >
          {isBirthday ? `Today · ${date}` : `Coming · ${date}`}
        </motion.p>

        <motion.p
          className="mt-6 font-script text-6xl leading-none text-rose sm:text-8xl"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease, delay: 0.4 }}
        >
          Happy Birthday
        </motion.p>

        <h1 className="mt-2 font-display text-6xl leading-[1.02] font-medium sm:text-8xl md:text-9xl" aria-label={site.herName}>
          {site.herName.split("").map((ch, i) => (
            <motion.span
              key={i}
              className="inline-block animate-shimmer text-romance"
              initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.9, ease, delay: 0.9 + i * 0.06 }}
              aria-hidden
            >
              {ch === " " ? " " : ch}
            </motion.span>
          ))}
        </h1>

        <motion.p
          className="mx-auto mt-8 max-w-xl font-display text-xl leading-relaxed text-pretty text-ink-soft italic sm:text-2xl"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease, delay: 1.6 }}
        >
          {site.heroLine}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease, delay: 1.9 }}
          className="mt-10"
        >
          {isBirthday ? (
            <p className="inline-flex items-center gap-2 rounded-full glass px-5 py-2.5 text-sm tracking-wide text-ink-soft">
              <Sparkles className="size-4 text-gold" /> Today is all about you <Sparkles className="size-4 text-gold" />
            </p>
          ) : (
            <Countdown to={site.birthday} />
          )}
        </motion.div>

        <motion.p
          className="mt-10 text-sm text-muted"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2.3 }}
        >
          {site.heroSubline}
        </motion.p>
      </div>

      <motion.a
        href="#journey"
        className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-muted transition-colors hover:text-rose"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 8, 0] }}
        transition={{ opacity: { delay: 2.6, duration: 1 }, y: { repeat: Infinity, duration: 2.2, ease: "easeInOut" } }}
      >
        <span className="text-[0.65rem] tracking-[0.3em] uppercase">Begin our story</span>
        <ChevronDown className="size-5" />
      </motion.a>
    </section>
  );
}