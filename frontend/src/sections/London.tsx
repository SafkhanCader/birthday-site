import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Luggage } from "lucide-react";
import type { London as LondonT } from "../api/types";
import { SectionShell } from "../components/SectionShell";
import { BoardingPass } from "../components/BoardingPass";
import { SealedCard } from "../components/SealedCard";
import { Reveal } from "../components/Reveal";

function Itinerary({ trip }: { trip: LondonT }) {
  const [day, setDay] = useState(0);
  const d = trip.days[day];
  if (!d) return null;

  return (
    <div className="card-love p-5 sm:p-8">
      <div className="flex gap-2" role="tablist" aria-label="Trip days">
        {trip.days.map((t, i) => (
          <button
            key={t.label}
            role="tab"
            aria-selected={i === day}
            onClick={() => setDay(i)}
            className={`flex-1 rounded-2xl px-2 py-3 text-center transition-all ${
              i === day ? "bg-gradient-to-br from-rose to-rose-deep text-on-rose shadow-love" : "bg-surface-2 text-ink-soft hover:text-rose"
            }`}
          >
            <span className="block text-[0.65rem] tracking-[0.25em] uppercase opacity-80">{t.label}</span>
            <span className="mt-0.5 block font-display text-base whitespace-nowrap sm:text-lg">{t.date}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={day}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.3 }}
          className="mt-7"
        >
          <h3 className="font-display text-3xl text-ink italic">{d.title}</h3>
          <ol className="relative mt-6 space-y-5 border-l border-line pl-6">
            {d.items.map((it, i) => (
              <li key={i} className="relative">
                <span className="absolute top-1.5 -left-[1.72rem] size-2.5 rounded-full bg-rose ring-4 ring-surface" />
                <p className="text-xs font-medium tracking-[0.2em] text-gold tabular-nums">{it.time}</p>
                <p className="mt-0.5 text-lg text-ink">{it.title}</p>
                {it.note && <p className="text-sm text-muted">{it.note}</p>}
              </li>
            ))}
          </ol>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Packing({ items }: { items: string[] }) {
  const [done, setDone] = useState<Set<number>>(new Set());
  const toggle = (i: number) =>
    setDone((s) => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });

  return (
    <div className="card-love p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-full bg-surface-2 text-rose">
          <Luggage className="size-5" />
        </span>
        <div>
          <h3 className="font-display text-2xl text-ink">What to pack</h3>
          <p className="text-xs text-muted tabular-nums">
            {done.size} / {items.length} ready
          </p>
        </div>
      </div>
      <ul className="mt-6 space-y-2">
        {items.map((it, i) => {
          const on = done.has(i);
          return (
            <li key={it}>
              <button
                type="button"
                onClick={() => toggle(i)}
                aria-pressed={on}
                className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-surface-2"
              >
                <span
                  className={`grid size-6 shrink-0 place-items-center rounded-full border transition-all ${
                    on ? "border-transparent bg-gradient-to-br from-rose to-rose-deep text-on-rose" : "border-rose/40"
                  }`}
                >
                  {on && <Check className="size-3.5" strokeWidth={3} />}
                </span>
                <span className={`transition-colors ${on ? "text-muted line-through" : "text-ink"}`}>{it}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function London({ trip, herName, unlockAt }: { trip: LondonT | null; herName: string; unlockAt: string }) {
  return (
    <SectionShell
      id="london"
      width="wide"
      eyebrow="Chapter six"
      title={
        trip ? (
          <>
            We're going to <span className="text-romance italic">London</span>
          </>
        ) : (
          <>
            One more <span className="text-romance italic">surprise</span>
          </>
        )
      }
      subtitle={trip?.headline}
    >
      {!trip ? (
          <SealedCard
          unlockAt={unlockAt}
          message="Somewhere special is waiting for us…"
          note={`This surprise opens on ${new Date(unlockAt).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}.`}
        />
      ) : (
        <>
          <Reveal>
            <BoardingPass trip={trip} passenger={herName} />
          </Reveal>
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <Reveal delay={0.1}>
              <Itinerary trip={trip} />
            </Reveal>
            <Reveal delay={0.2}>
              <Packing items={trip.packing} />
            </Reveal>
          </div>
        </>
      )}
    </SectionShell>
  );
}
