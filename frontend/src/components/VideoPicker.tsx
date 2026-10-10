import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Clapperboard, RefreshCw, Trash2, Video } from "lucide-react";
import { WISH_RULES } from "../api/types";

export interface PickedVideo {
  file: File;
  /** Local object URL for the preview player */
  url: string;
  /** Seconds, or null if the browser can't read it (backend double-checks) */
  duration: number | null;
}

const ACCEPT = "video/mp4,video/quicktime,video/webm,video/x-m4v,.mov,.mp4,.m4v,.webm";

export const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
const fmtMB = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(bytes > 10 * 1024 * 1024 ? 0 : 1)} MB`;

/** Reads a video's length in the browser without uploading it. */
function readDuration(url: string): Promise<number | null> {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    const done = (d: number | null) => {
      v.removeAttribute("src");
      resolve(d);
    };
    v.preload = "metadata";
    v.muted = true;
    v.onloadedmetadata = () => done(Number.isFinite(v.duration) ? v.duration : null);
    v.onerror = () => done(null);
    setTimeout(() => done(null), 8000);
    v.src = url;
  });
}

function isVideo(file: File) {
  return file.type.startsWith("video/") || /\.(mov|mp4|m4v|webm)$/i.test(file.name);
}

interface Props {
  value: PickedVideo | null;
  onChange: (v: PickedVideo | null) => void;
  disabled?: boolean;
}

/**
 * Optional video message.
 * On phones the file input offers "Record video" or "Choose from library".
 * Length and size are checked right here, before anything is uploaded,
 * so nobody waits for a 3-minute upload only to be rejected.
 */
export function VideoPicker({ value, onChange, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  // Free the preview memory when the video is replaced or the page closes
  useEffect(() => () => void (value && URL.revokeObjectURL(value.url)), [value]);

  const pick = async (file?: File) => {
    if (!file) return;
    setError(null);

    if (!isVideo(file)) return setError("That doesn't look like a video. Please choose an MP4 or MOV file.");
    if (file.size > WISH_RULES.videoMaxMB * 1024 * 1024)
      return setError(`This video is ${fmtMB(file.size)} — please keep it under ${WISH_RULES.videoMaxMB} MB.`);

    setChecking(true);
    const url = URL.createObjectURL(file);
    const duration = await readDuration(url);
    setChecking(false);

    if (duration !== null && duration > WISH_RULES.videoMaxSeconds + 0.5) {
      URL.revokeObjectURL(url);
      return setError(
        `This video is ${fmtTime(duration)} long. Please trim it to 1 minute or less — on iPhone tap Edit and drag the yellow edges; on Android tap Edit → Trim.`,
      );
    }
    onChange({ file, url, duration });
  };

  const remove = () => {
    onChange(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium text-ink">
          A video message <span className="font-normal text-muted">(please must)</span>
        </p>
        <span className="text-xs text-muted">Up to 1 minute</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => pick(e.target.files?.[0])}
        disabled={disabled}
        aria-label="Choose a video"
      />

      <AnimatePresence mode="wait" initial={false}>
        {!value ? (
          <motion.button
            key="empty"
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || checking}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              pick(e.dataTransfer.files?.[0]);
            }}
            className="group mt-2 flex w-full items-center gap-4 rounded-2xl border-2 border-dashed border-rose/30 bg-rose/[0.03] px-5 py-5 text-left transition-colors hover:border-rose/60 hover:bg-rose/[0.06]"
          >
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-rose to-rose-deep text-on-rose shadow-love transition-transform group-hover:scale-105">
              {checking ? <Clapperboard className="size-5 animate-pulse" /> : <Video className="size-5" />}
            </span>
            <span>
              <span className="block font-medium text-ink">{checking ? "Checking your video…" : "Record or choose a short video"}</span>
              <span className="mt-0.5 block text-sm text-muted">Hearing your voice will mean the world to her.</span>
            </span>
          </motion.button>
        ) : (
          <motion.div
            key="picked"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2 overflow-hidden rounded-2xl border border-line bg-surface-2"
          >
            <video src={`${value.url}#t=0.1`} controls playsInline preload="metadata" className="max-h-80 w-full bg-black object-contain" />
            <div className="flex items-center gap-3 px-4 py-3 text-sm">
              {value.duration !== null && (
                <span className="rounded-full bg-rose/10 px-2.5 py-0.5 text-xs font-medium text-rose tabular-nums">
                  {fmtTime(value.duration)}
                </span>
              )}
              <span className="min-w-0 flex-1 truncate text-muted">
                {value.file.name} · {fmtMB(value.file.size)}
              </span>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={disabled}
                className="btn-icon !size-9"
                aria-label="Replace video"
                title="Replace"
              >
                <RefreshCw className="size-4" />
              </button>
              <button type="button" onClick={remove} disabled={disabled} className="btn-icon !size-9" aria-label="Remove video" title="Remove">
                <Trash2 className="size-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2 text-sm leading-relaxed text-rose"
            role="alert"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
