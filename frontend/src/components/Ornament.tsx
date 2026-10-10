import { Heart } from "lucide-react";

/** Thin gold line — heart — gold line. Used under eyebrows and as dividers. */
export function Ornament({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 text-gold ${className}`} aria-hidden>
      <span className="h-px w-10 bg-gradient-to-r from-transparent to-current opacity-60" />
      <Heart className="size-3.5 fill-current" />
      <span className="h-px w-10 bg-gradient-to-l from-transparent to-current opacity-60" />
    </div>
  );
}
