import { motion } from "motion/react";

/**
 * A wrapped present drawn with plain divs (no image needed).
 * `opened` sends the lid flying and fades the box away.
 */
export function GiftBox({ opened, onOpen }: { opened: boolean; onOpen: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      disabled={opened}
      aria-label="Unwrap your gift"
      className="group relative mx-auto block h-64 w-60 sm:h-72 sm:w-68"
      animate={opened ? { scale: 0.9, opacity: 0, transition: { delay: 0.55, duration: 0.5 } } : { y: [0, -8, 0] }}
      transition={opened ? undefined : { duration: 3, repeat: Infinity, ease: "easeInOut" }}
      whileHover={opened ? undefined : { rotate: [0, -2, 2, -2, 0], transition: { duration: 0.5 } }}
    >
      {/* Glow */}
      <span className="absolute inset-x-6 bottom-0 h-10 rounded-full bg-rose/40 blur-2xl" aria-hidden />

      {/* Box body */}
      <span className="absolute inset-x-4 top-20 bottom-2 overflow-hidden rounded-2xl bg-gradient-to-br from-rose to-rose-deep shadow-love sm:top-22">
        <span className="absolute inset-y-0 left-1/2 w-9 -translate-x-1/2 bg-gradient-to-r from-gold-soft via-gold to-gold-soft opacity-95" />
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_55%)]" />
      </span>

      {/* Lid + bow */}
      <motion.span
        className="absolute inset-x-0 top-12 block h-12 sm:top-14"
        animate={opened ? { y: -170, rotate: -24, opacity: 0 } : { y: 0, rotate: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="absolute inset-0 rounded-xl bg-gradient-to-br from-rose to-rose-deep shadow-lg">
          <span className="absolute inset-y-0 left-1/2 w-9 -translate-x-1/2 bg-gradient-to-r from-gold-soft via-gold to-gold-soft" />
        </span>
        {/* Bow loops */}
        <span className="absolute -top-9 left-1/2 h-11 w-14 -translate-x-[95%] -rotate-[25deg] rounded-[50%_50%_10%_50%] border-[7px] border-gold" />
        <span className="absolute -top-9 left-1/2 h-11 w-14 -translate-x-[5%] rotate-[25deg] rounded-[50%_50%_50%_10%] border-[7px] border-gold" />
        <span className="absolute -top-3 left-1/2 size-5 -translate-x-1/2 rounded-full bg-gold shadow" />
      </motion.span>

      {!opened && (
        <span className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-xs tracking-[0.3em] whitespace-nowrap text-muted uppercase transition-colors group-hover:text-rose">
          Tap to unwrap
        </span>
      )}
    </motion.button>
  );
}
