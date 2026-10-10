import { useEffect, useState } from "react";
import { LockKeyhole } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { ThemeToggle } from "./ThemeToggle";
import { MusicToggle } from "./MusicToggle";
import type { SiteInfo } from "../api/types";

export function TopBar({ site }: { site: SiteInfo }) {
  const { logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Her name, in the script font, top-left
  const brand = site.herName;

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6">
      <div
        className={`mx-auto flex max-w-6xl items-center justify-between rounded-full px-3 py-1.5 transition-all duration-500 sm:px-4 ${
          scrolled ? "glass shadow-love" : "border border-transparent"
        }`}
      >
        <a href="#hero" className="px-2 font-script text-2xl text-rose sm:text-3xl" aria-label="Back to top">
          {brand}
        </a>
        <div className="flex items-center gap-0.5">
          {site.music && <MusicToggle src={site.music.src} title={site.music.title} />}
          <ThemeToggle />
          <button type="button" onClick={logout} className="btn-icon" aria-label="Lock the site" title="Lock">
            <LockKeyhole className="size-[18px]" />
          </button>
        </div>
      </div>
    </header>
  );
}