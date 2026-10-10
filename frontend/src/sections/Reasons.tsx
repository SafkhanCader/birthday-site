import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { SectionShell } from "../components/SectionShell";
import { FlipCard } from "../components/FlipCard";
import { Reveal } from "../components/Reveal";

export function Reasons({ reasons }: { reasons: string[] }) {
  const [opened, setOpened] = useState(0);
  const all = opened >= reasons.length;

  return (
    <SectionShell
      id="reasons"
      width="wide"
      eyebrow="Chapter three"
      title={
        <>
          {reasons.length} reasons I <span className="text-romance italic">love you</span>
        </>
      }
      subtitle="Only a few — the full list would never fit on one page. Tap each card."
    >
      {/* Progress */}
      <div className="mx-auto mb-10 max-w-xs text-center">
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-rose to-gold"
            animate={{ width: `${(Math.min(opened, reasons.length) / reasons.length) * 100}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
        <p className="mt-2 text-xs tracking-[0.2em] text-muted uppercase tabular-nums">
          {Math.min(opened, reasons.length)} of {reasons.length} opened
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
        {reasons.map((r, i) => (
          <Reveal key={i} delay={(i % 4) * 0.08} y={24}>
            <FlipCard number={i + 1} text={r} onReveal={() => setOpened((n) => n + 1)} />
          </Reveal>
        ))}
      </div>

      <AnimatePresence>
        {all && (
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 text-center font-script text-4xl text-rose sm:text-5xl"
          >
            …and a million more.
          </motion.p>
        )}
      </AnimatePresence>
    </SectionShell>
  );
}
