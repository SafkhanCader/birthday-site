import { Heart } from "lucide-react";
import type { Wish } from "../api/types";
import { SectionShell } from "../components/SectionShell";
import { Reveal } from "../components/Reveal";
import { WishCard } from "../components/WishCard";
import { ShareInvite } from "../components/ShareInvite";

interface Props {
  wishes: Wish[];
  herName: string;
  /** Guest link path from the API, e.g. "/wish?code=family2026" */
  invite?: string;
}

export function Wishes({ wishes, herName, invite }: Props) {
  // Newest guest wishes first, then the ones you wrote into content
  const sorted = [...wishes].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  // Videos in their own row, so short text cards never stretch beside a tall video
  const withVideo = sorted.filter((w) => w.video);
  const written = sorted.filter((w) => !w.video);

  return (
    <SectionShell
      id="wishes"
      width="wide"
      eyebrow="Chapter seven"
      title={
        <>
          From the people who <span className="text-romance italic">love you</span>
        </>
      }
      subtitle={
        sorted.length
          ? `${sorted.length} ${sorted.length === 1 ? "person" : "people"} wrote to you. You are loved by so many.`
          : "You are loved by so many — and their words will appear here."
      }
    >
      {invite && (
        <Reveal>
          <ShareInvite path={invite} herName={herName} />
        </Reveal>
      )}

      {sorted.length === 0 ? (
        <div className="mx-auto max-w-md text-center text-muted">
          <Heart className="mx-auto size-8 animate-heartbeat fill-rose/30 text-rose/40" />
          <p className="mt-4 font-display text-xl italic">No wishes yet — share the link above and watch them arrive.</p>
        </div>
      ) : (
        <div className="space-y-12">
          <WishGrid title="Video messages" wishes={withVideo} />
          <WishGrid title={withVideo.length ? "Written wishes" : undefined} wishes={written} />
        </div>
      )}
    </SectionShell>
  );
}

function WishGrid({ title, wishes }: { title?: string; wishes: Wish[] }) {
  if (!wishes.length) return null;
  return (
    <div>
      {title && (
        <p className="eyebrow mb-6 text-center">
          {title} · {wishes.length}
        </p>
      )}
      <div
        className={`grid items-start gap-5 ${
          wishes.length === 1 ? "mx-auto max-w-md" : wishes.length > 4 ? "sm:grid-cols-2 lg:grid-cols-3" : "mx-auto max-w-4xl sm:grid-cols-2"
        }`}
      >
        {wishes.map((w, i) => (
          <Reveal key={w.id} delay={(i % 3) * 0.1} className="h-full">
            <WishCard name={w.name} relation={w.relation} message={w.message} video={w.video} />
          </Reveal>
        ))}
      </div>
    </div>
  );
}
