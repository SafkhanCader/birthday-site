import { Quote } from "lucide-react";
import { mediaUrl } from "../api/client";

interface Props {
  name: string;
  relation: string;
  message: string;
  /** Optional video message — a media path or a local preview URL */
  video?: string;
  /** Faded placeholder look for the empty live preview */
  ghost?: boolean;
  className?: string;
}

/**
 * One wish, exactly as she sees it.
 * Shared by the Wishes section and the guest form's live preview,
 * so what guests see while typing is what she'll actually read.
 */
export function WishCard({ name, relation, message, video, ghost, className = "" }: Props) {
  const initial = name.trim().charAt(0).toUpperCase() || "♥";
  return (
    <figure className={`card-love relative flex h-full flex-col justify-between overflow-hidden ${className}`}>
      {video && (
        // Portrait phone videos stay whole (object-contain) on a soft dark stage
        <video
          src={`${mediaUrl(video)}#t=0.1`}
          controls
          playsInline
          preload="metadata"
          className="max-h-[26rem] w-full bg-[#0d0408] object-contain"
          aria-label={`Video message from ${name}`}
        />
      )}
      <div className="relative flex flex-1 flex-col justify-between p-7">
        <Quote className="absolute top-6 right-6 size-8 text-rose/15" aria-hidden />
        <blockquote
          className={`pr-8 font-display text-xl leading-relaxed text-pretty break-words whitespace-pre-line italic ${
            ghost ? "text-muted/70" : "text-ink"
          }`}
        >
          {message}
        </blockquote>
        <figcaption className="mt-6 flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-rose to-rose-deep font-display text-lg text-on-rose">
            {initial}
          </span>
          <span className="min-w-0">
            <span className={`block truncate font-medium ${ghost ? "text-muted" : "text-ink"}`}>{name}</span>
            <span className="block text-xs tracking-[0.2em] text-muted uppercase">{relation}</span>
          </span>
        </figcaption>
      </div>
    </figure>
  );
}
