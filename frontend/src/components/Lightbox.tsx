import { useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { mediaUrl } from "../api/client";
import type { AlbumPhoto } from "../api/types";

interface Props {
  photos: AlbumPhoto[];
  index: number | null;
  onChange: (i: number | null) => void;
}

/** Full-screen photo viewer: swipe on phone, arrow keys on desktop, Esc to close. */
export function Lightbox({ photos, index, onChange }: Props) {
  const open = index !== null;
  const count = photos.length;

  const go = useCallback(
    (dir: 1 | -1) => {
      if (index === null) return;
      onChange((index + dir + count) % count);
    },
    [index, count, onChange],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onChange(null);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, go, onChange]);

  const photo = index !== null ? photos[index] : null;

  return createPortal(
    <AnimatePresence>
      {open && photo && (
        <motion.div
          className="fixed inset-0 z-[70] flex flex-col bg-[#0d0408]/95 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
          onClick={() => onChange(null)}
        >
          <div className="flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))] text-white/80">
            <span className="text-sm tracking-[0.2em] tabular-nums">
              {index! + 1} / {count}
            </span>
            <button type="button" className="grid size-11 place-items-center rounded-full hover:bg-white/10" aria-label="Close">
              <X className="size-6" />
            </button>
          </div>

          <div className="relative flex flex-1 items-center justify-center overflow-hidden px-2 sm:px-16">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.img
                key={photo.src}
                src={mediaUrl(photo.src)}
                alt={photo.caption ?? "Our memory"}
                className="max-h-[78dvh] max-w-full cursor-grab rounded-lg object-contain shadow-2xl active:cursor-grabbing"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.35 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.6}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -70) go(1);
                  else if (info.offset.x > 70) go(-1);
                }}
                onClick={(e) => e.stopPropagation()}
              />
            </AnimatePresence>

            {count > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    go(-1);
                  }}
                  className="absolute left-3 hidden size-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:grid"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="size-6" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    go(1);
                  }}
                  className="absolute right-3 hidden size-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:grid"
                  aria-label="Next photo"
                >
                  <ChevronRight className="size-6" />
                </button>
              </>
            )}
          </div>

          <div className="min-h-20 px-6 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center">
            {photo.caption && <p className="font-display text-xl text-white/90 italic sm:text-2xl">{photo.caption}</p>}
            <p className="mt-1 text-xs text-white/40 sm:hidden">Swipe to see more</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
