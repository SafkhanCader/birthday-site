import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Letter as LetterT } from "../api/types";
import { SectionShell } from "../components/SectionShell";

function Envelope({ initial, onOpen }: { initial: string; onOpen: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      aria-label="Open the letter"
      className="group relative mx-auto block aspect-[3/2] w-full max-w-lg"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.4 } }}
      whileHover={{ y: -6 }}
    >
      {/* Body */}
      <span className="absolute inset-0 rounded-2xl border border-line bg-gradient-to-br from-surface-2 to-surface shadow-love" />
      {/* Bottom folds */}
      <span
        className="absolute inset-0 rounded-2xl bg-gradient-to-t from-rose-soft/70 to-transparent"
        style={{ clipPath: "polygon(0 100%, 50% 45%, 100% 100%)" }}
      />
      {/* Top flap */}
      <span
        className="absolute inset-x-0 top-0 h-[62%] rounded-t-2xl bg-gradient-to-b from-rose-soft to-surface-2 transition-transform duration-500 group-hover:-translate-y-1"
        style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }}
      />
      {/* Wax seal */}
      <span className="absolute top-[62%] left-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-gradient-to-br from-rose to-rose-deep shadow-love ring-4 ring-rose/20 transition-transform duration-500 group-hover:scale-110 sm:size-20">
        <span className="font-script text-3xl text-white/95 sm:text-4xl">{initial}</span>
      </span>
      <span className="absolute inset-x-0 bottom-5 text-center text-xs tracking-[0.3em] text-muted uppercase">
        Tap the seal to open
      </span>
    </motion.button>
  );
}

export function Letter({ letter }: { letter: LetterT }) {
  const [open, setOpen] = useState(false);

  return (
    <SectionShell
      id="letter"
      width="narrow"
      eyebrow="Chapter four"
      title={
        <>
          A letter, <span className="text-romance italic">just for you</span>
        </>
      }
    >
      <AnimatePresence mode="wait">
        {!open ? (
          <Envelope key="env" initial={letter.signature.charAt(0)} onOpen={() => setOpen(true)} />
        ) : (
          <motion.article
            key="letter"
            initial={{ opacity: 0, y: 60, rotateX: 12 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            className="paper card-love relative px-6 py-12 sm:px-14 sm:py-16"
            style={{ transformPerspective: 1200 }}
          >
            {/* Corner flourish */}
            <span className="absolute top-5 right-6 font-script text-5xl text-rose/15 select-none" aria-hidden>
              ♥
            </span>

            <p className="font-script text-4xl text-rose sm:text-5xl">{letter.greeting}</p>
            <div className="mt-8 space-y-6">
              {letter.paragraphs.map((p, i) => (
                <motion.p
                  key={i}
                  className="font-display text-xl leading-[2.4rem] text-pretty text-ink sm:text-[1.4rem]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 + i * 0.5, duration: 1 }}
                >
                  {p}
                </motion.p>
              ))}
            </div>
            <motion.div
              className="mt-12 text-right"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 + letter.paragraphs.length * 0.5, duration: 1 }}
            >
              <p className="font-display text-lg text-ink-soft italic">{letter.signoff}</p>
              <p className="mt-1 font-script text-5xl text-rose sm:text-6xl">{letter.signature}</p>
            </motion.div>
          </motion.article>
        )}
      </AnimatePresence>
    </SectionShell>
  );
}
