import { AnimatePresence, motion } from "motion/react";
import { useCountdown } from "../hooks/useCountdown";

function Unit({ value, label }: { value: number; label: string }) {
  const v = String(value).padStart(2, "0");
  return (
    <div className="flex flex-col items-center">
      <div className="glass relative grid h-16 w-14 place-items-center overflow-hidden rounded-2xl sm:h-20 sm:w-18">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={v}
            initial={{ y: "-60%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "60%", opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="font-display text-3xl font-medium tabular-nums text-ink sm:text-4xl"
          >
            {v}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="mt-2 text-[0.65rem] tracking-[0.25em] text-muted uppercase">{label}</span>
    </div>
  );
}

/** Returns null once the moment has arrived. */
export function Countdown({ to, className = "" }: { to: string; className?: string }) {
  const c = useCountdown(to);
  if (c.done) return null;
  return (
    <div className={`flex items-start justify-center gap-2.5 sm:gap-4 ${className}`} role="timer" aria-live="off">
      <Unit value={c.days} label="Days" />
      <Unit value={c.hours} label="Hours" />
      <Unit value={c.minutes} label="Mins" />
      <Unit value={c.seconds} label="Secs" />
    </div>
  );
}
