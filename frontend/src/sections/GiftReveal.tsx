import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Gift, GiftItem } from "../api/types";
import { SectionShell } from "../components/SectionShell";
import { GiftBox } from "../components/GiftBox";
import { HeartBurst } from "../components/HeartBurst";
import { Photo } from "../components/Photo";
import { SealedCard } from "../components/SealedCard";

export function GiftReveal({ gift, unlockAt }: { gift: Gift | null; unlockAt: string }) {
  const [opened, setOpened] = useState(false);
  const [burst, setBurst] = useState(0);

  const open = () => {
    setOpened(true);
    setBurst((b) => b + 1);
  };

  return (
    <SectionShell
      id="gift"
      eyebrow="Chapter five"
      title={
        <>
          A little <span className="text-romance italic">something</span>
        </>
      }
      subtitle={gift ? "Go on — it's yours." : undefined}
    >
      {!gift ? (
        <SealedCard unlockAt={unlockAt} message="Wrapped with love, waiting for you." />
      ) : (
        <div className="relative grid min-h-[26rem] place-items-center">
          <HeartBurst burstKey={burst} />
          <AnimatePresence mode="wait">
            {!opened ? (
              <motion.div key="box" exit={{ opacity: 0 }} transition={{ duration: 0.3, delay: 0.9 }}>
                <GiftBox opened={opened} onOpen={open} />
              </motion.div>
            ) : gift.items?.length ? (
              <motion.div
                key="reveal-many"
                className="w-full"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              >
                <div className="mx-auto max-w-2xl text-center">
                  <p className="eyebrow">Happy birthday</p>
                  <h3 className="mt-3 font-display text-3xl leading-tight font-medium text-balance text-ink sm:text-4xl">{gift.title}</h3>
                  <p className="mx-auto mt-4 max-w-xl leading-relaxed text-pretty text-ink-soft">{gift.note}</p>
                </div>

                <div className={`mx-auto mt-10 grid gap-6 ${gift.items.length > 1 ? "max-w-4xl sm:grid-cols-2" : "max-w-md"}`}>
                  {gift.items.map((item, i) => (
                    <GiftCard key={item.title} item={item} index={i} />
                  ))}
                </div>

                <motion.p
                  className="mt-10 text-center font-script text-3xl text-rose sm:text-4xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 + gift.items.length * 0.5, duration: 0.8 }}
                >
                  With all my love
                </motion.p>
              </motion.div>
            ) : (
              <motion.div
                key="reveal"
                className="card-love mx-auto grid max-w-3xl overflow-hidden md:grid-cols-2"
                initial={{ opacity: 0, scale: 0.85, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              >
                <Photo src={gift.photo} alt={gift.title} ratio="1/1" className="md:aspect-auto md:h-full" eager />
                <div className="flex flex-col justify-center p-7 sm:p-10">
                  <p className="eyebrow">Happy birthday</p>
                  <h3 className="mt-3 font-display text-3xl leading-tight font-medium text-ink sm:text-4xl">{gift.title}</h3>
                  <p className="mt-5 leading-relaxed text-pretty text-ink-soft">{gift.note}</p>
                  <p className="mt-6 font-script text-3xl text-rose">With all my love</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </SectionShell>
  );
}

/* One gift in a multi-gift reveal — each appears a moment after the last */
function GiftCard({ item, index }: { item: GiftItem; index: number }) {
  return (
    <motion.article
      className="card-love group overflow-hidden"
      initial={{ opacity: 0, y: 40, scale: 0.92, rotate: index % 2 ? 2 : -2 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.7 + index * 0.5 }}
    >
      <div className="overflow-hidden">
        <Photo
          src={item.photo}
          alt={item.title}
          ratio="1/1"
          className="transition-transform duration-700 group-hover:scale-[1.04]"
          eager
        />
      </div>
      <div className="p-6 text-center sm:p-8">
        <p className="eyebrow">Gift {String(index + 1).padStart(2, "0")}</p>
        <h4 className="mt-2 font-display text-2xl leading-tight font-medium text-ink sm:text-3xl">{item.title}</h4>
        <p className="mt-3 leading-relaxed text-pretty text-ink-soft">{item.note}</p>
      </div>
    </motion.article>
  );
}