import { useState } from "react";
import { Heart } from "lucide-react";
import { mediaUrl } from "../api/client";

interface Props {
  src?: string;
  alt: string;
  className?: string;
  /** e.g. "4/3" — reserves space so the layout never jumps */
  ratio?: string;
  eager?: boolean;
}

/**
 * Image with a soft fade-in, a blush placeholder while loading,
 * and a graceful fallback if the file is missing.
 */
export function Photo({ src, alt, className = "", ratio, eager }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const url = mediaUrl(src);

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br from-rose-soft via-surface-2 to-gold-soft ${className}`}
      style={ratio ? { aspectRatio: ratio } : undefined}
    >
      {(!url || failed) && (
        <div className="absolute inset-0 grid place-items-center text-rose/60">
          <Heart className="size-8 fill-current" aria-hidden />
        </div>
      )}
      {url && !failed && (
        <img
          src={url}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`h-full w-full object-cover transition-[opacity,transform] duration-1000 ease-out ${
            loaded ? "scale-100 opacity-100" : "scale-105 opacity-0"
          }`}
        />
      )}
    </div>
  );
}
