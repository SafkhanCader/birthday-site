import { Lock } from "lucide-react";
import { Countdown } from "./Countdown";

/** Shown in place of a surprise that hasn't opened yet. */
export function SealedCard({
  unlockAt,
  message,
  note = "This surprise opens on your birthday.",
}: {
  unlockAt: string;
  message: string;
  /** The small line under the message */
  note?: string;
}) {
  return (
    <div className="card-love mx-auto max-w-xl px-6 py-12 text-center sm:px-10">
      <div className="mx-auto mb-6 grid size-16 place-items-center rounded-full bg-gradient-to-br from-rose to-rose-deep text-on-rose shadow-love">
        <Lock className="size-7" />
      </div>
      <p className="font-display text-2xl text-ink italic sm:text-3xl">{message}</p>
      <p className="mt-3 text-sm text-muted">{note}</p>
      <Countdown to={unlockAt} className="mt-8" />
    </div>
  );
}