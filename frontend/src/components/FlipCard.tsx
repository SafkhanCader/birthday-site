import { useState } from "react";
import { motion } from "motion/react";
import { Heart } from "lucide-react";

interface Props {
  number: number;
  text: string;
  onReveal?: () => void;
}

/** Tap to turn over and reveal one reason. */
export function FlipCard({ number, text, onReveal }: Props) {
  const [flipped, setFlipped] = useState(false);
  const label = `No. ${String(number).padStart(2, "0")}`;

  return (
    <button
      type="button"
      onClick={() => {
        if (!flipped) onReveal?.();
        setFlipped((f) => !f);
      }}
      aria-pressed={flipped}
      aria-label={flipped ? `${label}: ${text}` : `Reveal reason ${label}`}
      className="group relative aspect-[4/5] w-full [perspective:1200px]"
    >
      <motion.div
        className="relative h-full w-full [transform-style:preserve-3d]"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Front */}
        <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-rose to-rose-deep p-4 text-on-rose shadow-love [backface-visibility:hidden]">
          <div className="absolute inset-2.5 rounded-[1.1rem] border border-white/25" />
          <span className="text-[0.65rem] tracking-[0.3em] text-white/75 uppercase">{label}</span>
          <Heart className="my-3 size-9 fill-white/90 text-white/90 transition-transform duration-500 group-hover:scale-110 sm:size-11" />
          <span className="font-script text-2xl sm:text-3xl">I love you…</span>
          <span className="mt-2 text-[0.65rem] tracking-[0.2em] text-white/70 uppercase">Tap to open</span>
        </div>

        {/* Back */}
        <div className="card-love absolute inset-0 flex flex-col items-center justify-center p-5 text-center [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <span className="text-[0.65rem] tracking-[0.3em] text-gold uppercase">{label}</span>
          <p className="mt-3 font-display text-lg leading-snug text-balance text-ink italic sm:text-xl">{text}</p>
          <Heart className="mt-4 size-4 fill-rose text-rose" />
        </div>
      </motion.div>
    </button>
  );
}
