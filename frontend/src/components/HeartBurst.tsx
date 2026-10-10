import { useMemo } from "react";
import { motion } from "motion/react";
import { Heart, Sparkles } from "lucide-react";

/**
 * A one-shot explosion of hearts & sparkles from the centre.
 * Re-fire it by changing `burstKey`.
 */
export function HeartBurst({ burstKey, count = 26 }: { burstKey: number; count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
        const dist = 120 + Math.random() * 180;
        return {
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist - 60,
          rot: (Math.random() - 0.5) * 120,
          size: 12 + Math.random() * 16,
          sparkle: i % 3 === 0,
          gold: i % 2 === 0,
        };
      }),
    [burstKey, count],
  );

  if (!burstKey) return null;

  return (
    <div key={burstKey} className="pointer-events-none absolute inset-0 grid place-items-center" aria-hidden>
      {pieces.map((p, i) => {
        const Icon = p.sparkle ? Sparkles : Heart;
        return (
          <motion.span
            key={i}
            className={`absolute ${p.gold ? "text-gold" : "text-rose"}`}
            initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
            animate={{ x: p.x, y: p.y, scale: 1, opacity: 0, rotate: p.rot }}
            transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <Icon style={{ width: p.size, height: p.size }} className={p.sparkle ? "" : "fill-current"} />
          </motion.span>
        );
      })}
    </div>
  );
}
