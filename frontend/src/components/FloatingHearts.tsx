import { useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Heart } from "lucide-react";

// Small deterministic random so hearts don't reshuffle on every render
function seeded(i: number) {
  const x = Math.sin(i * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

/** Slowly rising hearts — ambient background for the Hero and Lock screen. */
export function FloatingHearts({ count = 14 }: { count?: number }) {
  const reduce = useReducedMotion();
  const hearts = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: seeded(i) * 100,
        size: 10 + seeded(i + 7) * 22,
        duration: 14 + seeded(i + 3) * 14,
        delay: seeded(i + 11) * -24,
        drift: (seeded(i + 5) - 0.5) * 80,
        opacity: 0.15 + seeded(i + 2) * 0.35,
        gold: i % 4 === 0,
      })),
    [count],
  );

  if (reduce) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {hearts.map((h, i) => (
        <motion.div
          key={i}
          className={`absolute bottom-0 ${h.gold ? "text-gold" : "text-rose"}`}
          style={{ left: `${h.left}%`, opacity: h.opacity }}
          initial={{ y: "10vh", x: 0 }}
          animate={{ y: "-110vh", x: [0, h.drift, 0] }}
          transition={{ duration: h.duration, delay: h.delay, repeat: Infinity, ease: "linear" }}
        >
          <Heart style={{ width: h.size, height: h.size }} className="fill-current" />
        </motion.div>
      ))}
    </div>
  );
}
