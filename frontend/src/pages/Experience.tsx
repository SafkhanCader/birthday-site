import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Heart } from "lucide-react";
import { api, ApiError } from "../api/client";
import type { Content } from "../api/types";
import { useAuth } from "../auth/AuthProvider";
import { TopBar } from "../components/TopBar";
import { NavDots, type NavItem } from "../components/NavDots";
import { Hero } from "../sections/Hero";
import { Reasons } from "../sections/Reasons";
import { Letter } from "../sections/Letter";
import { Voice } from "../sections/Voice";
import { GiftReveal } from "../sections/GiftReveal";
import { London } from "../sections/London";
import { Wishes } from "../sections/Wishes";
import { Future } from "../sections/Future";
import { Book } from "../sections/Book";

function Loading() {
  return (
    <div className="grid min-h-dvh place-items-center" role="status" aria-label="Loading">
      <div className="text-center">
        <Heart className="mx-auto size-10 animate-heartbeat fill-rose text-rose" />
        <p className="mt-4 font-display text-xl text-muted italic">Opening your gift…</p>
      </div>
    </div>
  );
}

/** The whole story, top to bottom. Section order lives here. */
export function Experience() {
  const { logout } = useAuth();
  const [content, setContent] = useState<Content | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.content().then(setContent, (e) => {
      // Session expired → back to the lock screen
      if (e instanceof ApiError && e.status === 401) logout();
      else setError(true);
    });
  }, [logout]);

  if (error)
    return (
      <div className="grid min-h-dvh place-items-center px-6 text-center">
        <div>
          <p className="font-display text-2xl text-ink">Something went wrong loading the page.</p>
          <button className="btn-love mt-6" onClick={() => location.reload()}>
            Try again
          </button>
        </div>
      </div>
    );
  if (!content) return <Loading />;

  const { site } = content;
  const nav: NavItem[] = [
    { id: "hero", label: "Happy Birthday" },
    { id: "reasons", label: "Reasons" },
    { id: "letter", label: "Your letter" },
    { id: "voice", label: "Voice note" },
    { id: "gift", label: "Your gift" },
    { id: "london", label: content.london ? "London" : "Surprise" },
    { id: "wishes", label: "Wishes" },
    { id: "future", label: "Forever" },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
      <TopBar site={site} />
      <NavDots items={nav} />
      <main>
        <Hero site={site} />
        {content.book && <Book book={content.book} herName={site.herName} fromName={site.fromName} />}
        <Reasons reasons={content.reasons} />
        <Letter letter={content.letter} />
        <Voice fromName={site.fromName} hint={content.voiceHint} />
        <GiftReveal gift={content.gift} unlockAt={content.unlockAt} />
        <London trip={content.london} herName={site.herName} unlockAt={content.unlockAt} />
        <Wishes wishes={content.wishes} herName={site.herName} invite={content.wishInvite} />
        <Future future={content.future} site={site} />
      </main>
    </motion.div>
  );
}