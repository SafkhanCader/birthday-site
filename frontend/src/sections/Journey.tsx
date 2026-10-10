import { useRef } from "react";
import { motion, useScroll, useSpring } from "motion/react";
import { MapPin } from "lucide-react";
import type { Milestone } from "../api/types";
import { SectionShell } from "../components/SectionShell";
import { Photo } from "../components/Photo";
import { Reveal } from "../components/Reveal";

function MilestoneCard({ m, index }: { m: Milestone; index: number }) {
  const left = index % 2 === 0;
  return (
    <li className="relative grid grid-cols-[1.5rem_1fr] gap-5 md:grid-cols-[1fr_3rem_1fr] md:gap-8 md:not-first:-mt-40">
      {/* Dot on the line */}
      <div className="relative col-start-1 flex justify-center md:col-start-2">
        <span className="sticky top-1/2 mt-8 grid size-6 place-items-center rounded-full bg-canvas ring-1 ring-line">
          <span className="size-2.5 rounded-full bg-gradient-to-br from-rose to-rose-deep shadow-love" />
        </span>
      </div>

      <Reveal
        className={`col-start-2 row-start-1 ${left ? "md:col-start-1 md:text-right" : "md:col-start-3"}`}
        y={36}
      >
        <article className="card-love group overflow-hidden">
          {m.photo && (
            <div className="overflow-hidden">
              <Photo
                src={m.photo}
                alt={m.title}
                ratio="4/3"
                className="transition-transform duration-[1.2s] ease-out group-hover:scale-[1.03]"
              />
            </div>
          )}
          <div className="p-6 sm:p-7">
            <p className="eyebrow">{m.date}</p>
            <h3 className="mt-2 font-display text-3xl leading-tight font-medium text-ink">{m.title}</h3>
            {m.place && (
              <p className={`mt-1.5 flex items-center gap-1.5 text-sm text-muted ${left ? "md:justify-end" : ""}`}>
                <MapPin className="size-3.5 text-rose" /> {m.place}
              </p>
            )}
            <p className="mt-4 leading-relaxed text-pretty text-ink-soft">{m.text}</p>
          </div>
        </article>
      </Reveal>
    </li>
  );
}

export function Journey({ items }: { items: Milestone[] }) {
  const ref = useRef<HTMLDivElement>(null);
  // The line "draws itself" as she scrolls through the timeline
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 70%", "end 60%"] });
  const scaleY = useSpring(scrollYProgress, { stiffness: 80, damping: 25 });

  return (
    <SectionShell
      id="journey"
      eyebrow="Chapter one"
      title={
        <>
          Our <span className="text-romance italic">journey</span>
        </>
      }
      subtitle="Every step that brought us here — and every one I'd take again."
    >
      <div ref={ref} className="relative">
        {/* Track + animated fill */}
        <div className="absolute top-0 bottom-0 left-3 w-px -translate-x-1/2 bg-line md:left-1/2" aria-hidden />
        <motion.div
          className="absolute top-0 bottom-0 left-3 w-px origin-top -translate-x-1/2 bg-gradient-to-b from-rose via-rose-deep to-gold md:left-1/2"
          style={{ scaleY }}
          aria-hidden
        />
        <ol className="relative space-y-14 md:space-y-0">
          {items.map((m, i) => (
            <MilestoneCard key={m.id} m={m} index={i} />
          ))}
        </ol>
      </div>
    </SectionShell>
  );
}
