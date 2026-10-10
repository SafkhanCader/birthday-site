import { useEffect, useRef, useState } from "react";
import { Music, Pause } from "lucide-react";
import { mediaUrl } from "../api/client";

/**
 * Background song. Tries to start right after login — this works because
 * she has just tapped "Open my gift" (browsers only allow sound after a tap).
 * If the browser still blocks it, the button simply shows "play".
 */
export function MusicToggle({ src, title }: { src: string; title: string }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  // Start the song once, right after login
  useEffect(() => {
    const a = ref.current;
    if (!a) return;
    a.volume = 0.8;
    a.play().then(
      () => setPlaying(true),
      () => setPlaying(false),
    );
  }, [src]);

  // Step aside while the private voice note plays, then come back softly
  useEffect(() => {
    let resumeAfter = false;
    const onVoice = (e: Event) => {
      const a = ref.current;
      if (!a) return;
      if ((e as CustomEvent<boolean>).detail) {
        resumeAfter = !a.paused;
        a.pause();
        setPlaying(false);
      } else if (resumeAfter) {
        resumeAfter = false;
        a.play().then(() => setPlaying(true), () => setPlaying(false));
      }
    };
    window.addEventListener("bd:voice", onVoice);
    return () => window.removeEventListener("bd:voice", onVoice);
  }, []);

  const toggle = () => {
    const a = ref.current;
    if (!a) return;
    if (a.paused) a.play().then(() => setPlaying(true), () => setPlaying(false));
    else {
      a.pause();
      setPlaying(false);
    }
  };

  return (
    <>
      <audio ref={ref} src={mediaUrl(src)} loop preload="auto" />
      <button
        type="button"
        onClick={toggle}
        className="btn-icon relative"
        aria-label={playing ? `Pause ${title}` : `Play ${title}`}
        title={title}
      >
        {playing ? <Pause className="size-[18px]" /> : <Music className="size-[18px]" />}
        {playing && (
          <span className="absolute -right-0.5 -bottom-0.5 flex h-3 items-end gap-[2px]" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-[2px] animate-[heartbeat_0.9s_ease-in-out_infinite] rounded-full bg-rose"
                style={{ height: 6 + i * 3, animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </span>
        )}
      </button>
    </>
  );
}