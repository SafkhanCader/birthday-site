import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Copy, Send, Share2 } from "lucide-react";

/**
 * Lets her send the guest wish link to family & friends.
 * Uses the phone's native share sheet when available (WhatsApp, Messages…),
 * with Copy and WhatsApp buttons as fallbacks on desktop.
 */
export function ShareInvite({ path, herName }: { path: string; herName: string }) {
  const [copied, setCopied] = useState(false);
  const url = new URL(path, window.location.origin).toString();
  const text = `Would you leave a birthday wish for ${herName}? It takes one minute 💗`;
  const canShare = typeof navigator !== "undefined" && "share" in navigator;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Older browsers: select-and-copy fallback
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const share = async () => {
    try {
      await navigator.share({ title: `Wishes for ${herName}`, text, url });
    } catch {
      /* she closed the share sheet — nothing to do */
    }
  };

  return (
    <div className="card-love relative mx-auto mb-12 max-w-3xl overflow-hidden p-6 sm:p-8">
      <div className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-rose/15 blur-3xl" aria-hidden />

      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="grid size-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-rose to-rose-deep text-on-rose shadow-love">
          <Send className="size-6" />
        </div>
        <div className="flex-1">
          <h3 className="font-display text-2xl leading-tight text-ink sm:text-3xl">Collect more love</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            Share this link with family and friends. They can write you a wish — no password, and they won't see anything else here.
          </p>
        </div>
      </div>

      {/* Link + actions */}
      <div className="relative mt-6 flex flex-col gap-2 sm:flex-row">
        <div className="flex min-w-0 flex-1 items-center rounded-full border border-line bg-surface-2 px-4 py-3 text-sm text-ink-soft">
          <span className="truncate">{url}</span>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={copy} className="btn-love flex-1 !py-3 sm:flex-none" aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={copied ? "done" : "copy"}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="inline-flex items-center gap-2"
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? "Copied" : "Copy link"}
              </motion.span>
            </AnimatePresence>
          </button>
          {canShare ? (
            <button
              type="button"
              onClick={share}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-line px-5 py-3 text-sm font-medium text-ink transition-colors hover:border-rose hover:text-rose sm:flex-none"
            >
              <Share2 className="size-4" /> Share
            </button>
          ) : (
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-line px-5 py-3 text-sm font-medium text-ink transition-colors hover:border-rose hover:text-rose sm:flex-none"
            >
              <Share2 className="size-4" /> WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
