import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Camera } from "lucide-react";
import type { AlbumChapter } from "../api/types";
import { SectionShell } from "../components/SectionShell";
import { Photo } from "../components/Photo";
import { Lightbox } from "../components/Lightbox";

export function Album({ chapters }: { chapters: AlbumChapter[] }) {
  const [active, setActive] = useState(chapters[0]?.id ?? "");
  const [viewing, setViewing] = useState<number | null>(null);
  const chapter = useMemo(() => chapters.find((c) => c.id === active) ?? chapters[0], [chapters, active]);
  const total = chapters.reduce((n, c) => n + c.photos.length, 0);

  if (!chapter) return null;

  return (
    <SectionShell
      id="album"
      width="wide"
      eyebrow="Chapter two"
      title={
        <>
          Our <span className="text-romance italic">album</span>
        </>
      }
      subtitle={`${total} little moments I never want us to forget.`}
    >
      {/* Chapter tabs */}
      <div className="no-scrollbar -mx-4 mb-10 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:justify-center sm:px-0" role="tablist">
        {chapters.map((c) => {
          const on = c.id === chapter.id;
          return (
            <button
              key={c.id}
              role="tab"
              aria-selected={on}
              onClick={() => setActive(c.id)}
              className={`relative shrink-0 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                on ? "text-on-rose" : "text-ink-soft hover:text-rose"
              }`}
            >
              {on && (
                <motion.span
                  layoutId="album-tab"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-rose to-rose-deep shadow-love"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative">{c.title}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={chapter.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.45 }}
        >
          {chapter.subtitle && (
            <p className="mb-8 text-center font-display text-xl text-muted italic">{chapter.subtitle}</p>
          )}

          {/* Masonry via CSS columns — keeps each photo's natural shape */}
          <div className="columns-2 gap-3 sm:gap-5 md:columns-3">
            {chapter.photos.map((p, i) => (
              <motion.button
                key={p.src}
                type="button"
                onClick={() => setViewing(i)}
                className="group relative mb-3 block w-full break-inside-avoid overflow-hidden rounded-2xl shadow-love sm:mb-5"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.6, delay: (i % 3) * 0.08 }}
                aria-label={p.caption ? `Open photo: ${p.caption}` : `Open photo ${i + 1}`}
              >
                <Photo
                  src={p.src}
                  alt={p.caption ?? `Memory ${i + 1}`}
                  ratio={`${p.w}/${p.h}`}
                  className="transition-transform duration-700 group-hover:scale-105"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-rose-deep/70 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                {p.caption && (
                  <span className="absolute inset-x-0 bottom-0 translate-y-2 p-4 text-left font-display text-lg text-white italic opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                    {p.caption}
                  </span>
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      <p className="mt-8 flex items-center justify-center gap-2 text-sm text-muted">
        <Camera className="size-4 text-rose" /> Tap any photo to see it full screen
      </p>

      <Lightbox photos={chapter.photos} index={viewing} onChange={setViewing} />
    </SectionShell>
  );
}
