import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useAnimationControls } from "motion/react";
import { ArrowRight, EyeOff, Heart, KeyRound, LoaderCircle, Mail, Send, Sparkles, Video } from "lucide-react";
import { api, ApiError } from "../api/client";
import { WISH_RULES, type NewWish, type Relation, type WishInvite } from "../api/types";
import { FloatingHearts } from "../components/FloatingHearts";
import { HeartBurst } from "../components/HeartBurst";
import { ThemeToggle } from "../components/ThemeToggle";
import { WishCard } from "../components/WishCard";
import { VideoPicker, type PickedVideo } from "../components/VideoPicker";

/* ------------------------------------------------------------------
   PUBLIC guest page — /wish
   1. Guests open the link and type the invitation code you sent them.
   2. The code is checked on the server; only then does the form open.
   3. The code is remembered for this browser tab, so a refresh keeps
      the form open. (/wish?code=… still works and opens it directly.)
   Nothing private is ever shown here: a correct code only returns
   first names + the date.
------------------------------------------------------------------- */

type Phase = "loading" | "gate" | "form" | "sent";

const CODE_KEY = "bd-guest-code";
function storedCode() {
  try {
    return sessionStorage.getItem(CODE_KEY) ?? "";
  } catch {
    return "";
  }
}
function storeCode(code: string | null) {
  try {
    if (code) sessionStorage.setItem(CODE_KEY, code);
    else sessionStorage.removeItem(CODE_KEY);
  } catch {
    /* ignore */
  }
}

type Errors = Partial<Record<"name" | "message" | "email", string>>;

const starters = [
  { label: "A favourite memory", text: "My favourite memory with you is " },
  { label: "What I admire", text: "What I admire most about you is " },
  { label: "A wish for you", text: "This year, I wish you " },
];

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function validate(name: string, message: string, email: string): Errors {
  const e: Errors = {};
  const mail = email.trim();
  if (mail && (mail.length > WISH_RULES.emailMax || !EMAIL_RE.test(mail)))
    e.email = "That email doesn't look quite right — please check it (or leave it empty).";
  if (!name.trim()) e.name = "Please add your name so she knows who it's from.";
  const len = message.trim().length;
  if (len < WISH_RULES.messageMin) e.message = `A few more words, please (at least ${WISH_RULES.messageMin} characters).`;
  else if (len > WISH_RULES.messageMax) e.message = `Please keep it under ${WISH_RULES.messageMax} characters.`;
  return e;
}

/* ----------------------------- small parts ----------------------------- */

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-dvh overflow-hidden px-4 pt-20 pb-16 sm:px-6">
      <FloatingHearts count={12} />
      <ThemeToggle className="absolute top-[max(1rem,env(safe-area-inset-top))] right-4 z-10" />
      <div className="relative mx-auto max-w-5xl">{children}</div>
    </main>
  );
}

function Centered({ children }: { children: ReactNode }) {
  return <div className="mx-auto grid min-h-[70dvh] max-w-md place-items-center text-center">{children}</div>;
}

function Counter({ value, max, min = 0 }: { value: number; max: number; min?: number }) {
  const over = value > max;
  const near = value > max * 0.9;
  return (
    <span className={`text-xs tabular-nums ${over ? "text-rose" : near ? "text-gold" : "text-muted"}`}>
      {value < min ? `${min - value} more to go` : `${value} / ${max}`}
    </span>
  );
}

/* ------------------------------- page ------------------------------- */

export function WishPage() {
  const [initialCode] = useState(() => new URLSearchParams(window.location.search).get("code") || storedCode());
  const [code, setCode] = useState(initialCode);
  const [phase, setPhase] = useState<Phase>(initialCode ? "loading" : "gate");
  const [gateError, setGateError] = useState<string | null>(null);
  const [invite, setInvite] = useState<WishInvite | null>(null);

  // form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [relation, setRelation] = useState<Relation>("Family");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [video, setVideo] = useState<PickedVideo | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [burst, setBurst] = useState(0);
  const [sentWithVideo, setSentWithVideo] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const shake = useAnimationControls();
  const ids = { name: useId(), email: useId(), message: useId(), relation: useId() };

  /** Called with a correct code — opens the form */
  const welcome = (inv: WishInvite, okCode: string) => {
    setInvite(inv);
    setCode(okCode);
    storeCode(okCode);
    setGateError(null);
    setPhase("form");
    document.title = `A birthday wish for ${inv.herName}`;
    // Tidy the address bar, so the code isn't visible in screenshots or shared links
    if (window.location.search) window.history.replaceState(null, "", window.location.pathname);
    window.scrollTo({ top: 0 });
  };

  // A code from the link or from earlier in this tab: try it quietly
  useEffect(() => {
    if (!initialCode) return;
    api.wishInvite(initialCode).then(
      (inv) => welcome(inv, initialCode),
      () => {
        storeCode(null);
        setGateError("That invitation code didn't work. Please type it in again.");
        setPhase("gate");
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const errors = validate(name, message, email);
  const show = (field: keyof Errors) => (touched[field] ? errors[field] : undefined);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, message: true, email: true });
    if (Object.keys(errors).length) {
      shake.start({ x: [0, -10, 10, -6, 6, 0], transition: { duration: 0.4 } });
      return;
    }
    setBusy(true);
    setServerError(null);
    const wish: NewWish = { code, name: name.trim(), relation, message: message.trim(), email: email.trim(), website };
    try {
      await api.submitWish(wish, video?.file, setProgress);
      setSentWithVideo(!!video);
      setSentTo(email.trim() || null);
      setPhase("sent");
      setBurst((b) => b + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setServerError(
        err instanceof ApiError && err.status === 413
          ? "That video is too large to send. Please trim it or choose a shorter one."
          : err instanceof ApiError && err.status === 429
          ? "Lots of love arriving at once! Please wait a minute and try again."
          : "We couldn't send your wish. Please check your connection and try again.",
      );
      // The code was changed while they were writing — ask for the new one
      if (err instanceof ApiError && (err.status === 403 || err.status === 404)) {
        storeCode(null);
        setGateError("This invitation code has changed. Please enter the new one — your words are kept.");
        setPhase("gate");
      }
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const writeAnother = () => {
    setMessage("");
    setVideo(null);
    setTouched({});
    setPhase("form");
  };

  const insertStarter = (text: string) => {
    setMessage((m) => (m.trim() ? `${m.trimEnd()}\n\n${text}` : text));
    document.getElementById(ids.message)?.focus();
  };

  /* ------------------------------ states ------------------------------ */

  if (phase === "loading")
    return (
      <Shell>
        <Centered>
          <Heart className="size-10 animate-heartbeat fill-rose text-rose" aria-label="Loading" />
        </Centered>
      </Shell>
    );

  if (phase === "gate" || !invite)
    return (
      <Shell>
        <Centered>
          <CodeGate initialError={gateError} onWelcome={welcome} />
        </Centered>
      </Shell>
    );

  const date = new Date(invite.birthday).toLocaleDateString("en-GB", { day: "numeric", month: "long" });

  if (phase === "sent")
    return (
      <Shell>
        <Centered>
          <div className="relative">
            <HeartBurst burstKey={burst} count={30} />
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 220, damping: 16 }}
              className="mx-auto grid size-24 place-items-center rounded-full bg-gradient-to-br from-rose to-rose-deep shadow-love"
            >
              <Heart className="size-11 animate-heartbeat fill-white text-white" />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8 }}>
              <p className="mt-8 font-script text-5xl text-balance text-rose">Thank you, {name.trim()}</p>
              <p className="mt-4 font-display text-xl leading-relaxed text-ink-soft italic">
                {sentWithVideo ? "Your wish and video are" : "Your wish is"} safely tucked away. {invite.herName} will{" "}
                {sentWithVideo ? "watch and read them" : "read it"} on her birthday.
              </p>
              {sentTo && (
                <p className="mt-5 inline-flex max-w-full items-center gap-2 text-sm text-ink-soft">
                  <Mail className="size-4 shrink-0 text-rose" />
                  <span className="min-w-0">
                    A confirmation is on its way to <span className="font-medium break-all text-ink">{sentTo}</span>
                  </span>
                </p>
              )}
              <div>
                <p className="mt-6 inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-sm text-muted">
                  <EyeOff className="size-4 text-gold" /> Shh — please keep it a surprise
                </p>
              </div>
              <div className="mt-10">
                <button type="button" onClick={writeAnother} className="text-sm font-medium text-rose underline-offset-4 hover:underline">
                  Write another wish
                </button>
              </div>
            </motion.div>
          </div>
        </Centered>
      </Shell>
    );

  /* ------------------------------- form ------------------------------- */

  return (
    <Shell>
      {/* Header */}
      <motion.header
        className="mx-auto max-w-2xl text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="eyebrow">A birthday wish for</p>
        <h1 className="mt-3 font-script text-6xl leading-tight text-rose sm:text-7xl">{invite.herName}</h1>
        <p className="mx-auto mt-5 max-w-xl font-display text-2xl leading-snug text-balance text-ink italic sm:text-3xl">
          This will be the most special birthday she has ever celebrated — and you are part of it.
        </p>
        <p className="mx-auto mt-4 max-w-lg leading-relaxed text-pretty text-ink-soft">
          {invite.fromName} is gathering messages from the people who love her, as a surprise for her birthday on{" "}
          <span className="font-medium text-ink">{date}</span>. Write something from the heart and, if you can, record a{" "}
          <span className="font-medium text-ink">short video of up to 1 minute</span>. Seeing your face and hearing your voice will
          make her day unforgettable.
        </p>
        <p className="mt-4 inline-flex items-center gap-2 text-xs tracking-[0.2em] text-gold uppercase">
          <EyeOff className="size-3.5" /> It's a secret — please don't tell her
        </p>
      </motion.header>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-12">
        {/* ------- Form ------- */}
        <motion.form
          onSubmit={submit}
          noValidate
          animate={shake}
          className="card-love space-y-7 p-6 sm:p-9"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.15 }}
        >
          {/* Name */}
          <div>
            <div className="flex items-baseline justify-between">
              <label htmlFor={ids.name} className="text-sm font-medium text-ink">
                Your name
              </label>
              <Counter value={name.length} max={WISH_RULES.nameMax} />
            </div>
            <input
              id={ids.name}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, name: true }))}
              maxLength={WISH_RULES.nameMax}
              autoComplete="name"
              placeholder="e.g. Aunty Fatima"
              aria-invalid={!!show("name")}
              aria-describedby={show("name") ? `${ids.name}-err` : undefined}
              className={`mt-2 w-full rounded-2xl border bg-surface-2 px-4 py-3.5 text-base text-ink transition outline-none placeholder:text-muted/60 focus:bg-surface focus:ring-4 ${
                show("name") ? "border-rose focus:ring-rose/15" : "border-line focus:border-rose/60 focus:ring-rose/10"
              }`}
            />
            <FieldError id={`${ids.name}-err`} text={show("name")} />
          </div>

          {/* Email (optional) */}
          <div>
            <div className="flex items-baseline justify-between">
              <label htmlFor={ids.email} className="text-sm font-medium text-ink">
                Your email <span className="font-normal text-muted">(optional)</span>
              </label>
              <span className="text-xs text-muted">For a confirmation</span>
            </div>
            <input
              id={ids.email}
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="off"
              spellCheck={false}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              maxLength={WISH_RULES.emailMax}
              placeholder="you@example.com"
              aria-invalid={!!show("email")}
              aria-describedby={show("email") ? `${ids.email}-err` : `${ids.email}-help`}
              className={`mt-2 w-full rounded-2xl border bg-surface-2 px-4 py-3.5 text-base text-ink transition outline-none placeholder:text-muted/60 focus:bg-surface focus:ring-4 ${
                show("email") ? "border-rose focus:ring-rose/15" : "border-line focus:border-rose/60 focus:ring-rose/10"
              }`}
            />
            {show("email") ? (
              <FieldError id={`${ids.email}-err`} text={show("email")} />
            ) : (
              <p id={`${ids.email}-help`} className="mt-2 text-xs text-muted">
                We'll email you once your wish{video ? " and video are" : " is"} safely received. It's never shown on her page.
              </p>
            )}
          </div>

          {/* Relation */}
          <fieldset>
            <legend id={ids.relation} className="text-sm font-medium text-ink">
              How do you know her?
            </legend>
            <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-labelledby={ids.relation}>
              {WISH_RULES.relations.map((r) => {
                const on = r === relation;
                return (
                  <button
                    key={r}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setRelation(r)}
                    className={`relative rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                      on ? "text-on-rose" : "border border-line text-ink-soft hover:border-rose/50 hover:text-rose"
                    }`}
                  >
                    {on && (
                      <motion.span
                        layoutId="relation-pill"
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-rose to-rose-deep shadow-love"
                        transition={{ type: "spring", stiffness: 400, damping: 32 }}
                      />
                    )}
                    <span className="relative">{r}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Message */}
          <div>
            <div className="flex items-baseline justify-between">
              <label htmlFor={ids.message} className="text-sm font-medium text-ink">
                Your wish
              </label>
              <Counter value={message.trim().length} max={WISH_RULES.messageMax} min={WISH_RULES.messageMin} />
            </div>

            <div className="mt-2 flex flex-wrap gap-2" aria-label="Need a starting point?">
              {starters.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => insertStarter(s.text)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-xs text-ink-soft transition-colors hover:text-rose"
                >
                  <Sparkles className="size-3 text-gold" /> {s.label}
                </button>
              ))}
            </div>

            <textarea
              id={ids.message}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, message: true }))}
              rows={6}
              maxLength={WISH_RULES.messageMax + 50}
              placeholder="Happy birthday! I still remember the day…"
              aria-invalid={!!show("message")}
              aria-describedby={show("message") ? `${ids.message}-err` : undefined}
              className={`mt-3 w-full resize-y rounded-2xl border bg-surface-2 px-4 py-3.5 font-display text-lg leading-relaxed text-ink italic transition outline-none placeholder:text-muted/60 focus:bg-surface focus:ring-4 ${
                show("message") ? "border-rose focus:ring-rose/15" : "border-line focus:border-rose/60 focus:ring-rose/10"
              }`}
            />
            <FieldError id={`${ids.message}-err`} text={show("message")} />
          </div>

          {/* Video message */}
          <VideoPicker value={video} onChange={setVideo} disabled={busy} />

          {/* Honeypot — hidden from people, bots fill it and get silently ignored */}
          <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
            <label>
              Website
              <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </label>
          </div>

          <AnimatePresence>
            {serverError && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-2xl border border-rose/30 bg-rose/5 px-4 py-3 text-sm text-rose"
                role="alert"
              >
                {serverError}
              </motion.p>
            )}
          </AnimatePresence>

          <div className="flex flex-col-reverse items-center gap-4 sm:flex-row sm:justify-between">
            <p className="text-xs text-muted">
              {busy && video ? "Please keep this page open until it's sent." : `Only ${invite.herName} and ${invite.fromName} will see this.`}
            </p>
            <button type="submit" disabled={busy} className="btn-love relative w-full overflow-hidden sm:w-auto">
              {/* Upload progress fills the button */}
              {busy && progress !== null && (
                <span
                  className="absolute inset-y-0 left-0 bg-white/20 transition-[width] duration-200"
                  style={{ width: `${progress}%` }}
                  aria-hidden
                />
              )}
              <span className="relative inline-flex items-center gap-2 whitespace-nowrap tabular-nums">
                {busy ? <LoaderCircle className="size-4 animate-spin" /> : video ? <Video className="size-4" /> : <Send className="size-4" />}
                {busy
                  ? video
                    ? `Uploading video… ${progress ?? 0}%`
                    : "Sending…"
                  : video
                    ? "Send my wish & video"
                    : "Send my wish"}
              </span>
            </button>
          </div>
        </motion.form>

        {/* ------- Live preview ------- */}
        <aside className="lg:sticky lg:top-8 lg:self-start" aria-label="Preview">
          <p className="eyebrow mb-4 text-center lg:text-left">How she'll see it</p>
          <motion.div layout transition={{ duration: 0.3 }}>
            <WishCard
              name={name.trim() || "Your name"}
              relation={relation}
              message={message.trim() || "Your words will appear here, just like this…"}
              video={video?.url}
              ghost={!message.trim()}
            />
          </motion.div>
          <p className="mt-4 text-center text-sm text-muted lg:text-left">
            It will appear in the <span className="font-display text-base text-rose italic">“From the people who love you”</span> chapter
            of her birthday gift.
          </p>
        </aside>
      </div>
    </Shell>
  );
}

/* ------------------------------------------------------------------
   The invitation: a sealed card. The right code breaks the wax seal.
------------------------------------------------------------------- */
function CodeGate({ initialError, onWelcome }: { initialError: string | null; onWelcome: (inv: WishInvite, code: string) => void }) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [opening, setOpening] = useState(false);
  const shake = useAnimationControls();
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const typed = value.trim();
    if (!typed || busy) return;
    setBusy(true);
    setError(null);
    try {
      const inv = await api.wishInvite(typed);
      setOpening(true); // break the seal…
      setTimeout(() => onWelcome(inv, typed), 900); // …then open the form
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 429
          ? "Too many tries — please wait a few minutes and try again."
          : err instanceof ApiError && err.status === 404
            ? "That code isn't quite right. Please check the message you were sent."
            : "We couldn't check the code. Please check your connection and try again.",
      );
      shake.start({ x: [0, -12, 12, -8, 8, -4, 4, 0], transition: { duration: 0.5 } });
      inputRef.current?.select();
      setBusy(false);
    }
  };

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 24 }}
      animate={opening ? { opacity: 0, y: -16, scale: 0.97, transition: { delay: 0.55, duration: 0.4 } } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="card-love relative overflow-hidden px-6 pt-14 pb-8 sm:px-10">
        {/* envelope flap across the top of the card */}
        <div
          className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-rose-soft/70 to-transparent [clip-path:polygon(0_0,100%_0,50%_100%)]"
          aria-hidden
        />

        {/* wax seal — breaks open with the right code */}
        <div className="relative mx-auto grid size-20 place-items-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-rose/15 [animation-duration:2.6s]" aria-hidden />
          <motion.span
            className="absolute inset-0 rounded-full bg-gradient-to-br from-rose to-rose-deep shadow-love [clip-path:polygon(0_0,52%_0,46%_38%,56%_62%,48%_100%,0_100%)]"
            animate={opening ? { x: -26, rotate: -24, opacity: 0 } : { x: 0, rotate: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeIn" }}
            aria-hidden
          />
          <motion.span
            className="absolute inset-0 rounded-full bg-gradient-to-br from-rose to-rose-deep shadow-love [clip-path:polygon(52%_0,100%_0,100%_100%,48%_100%,56%_62%,46%_38%)]"
            animate={opening ? { x: 26, rotate: 24, opacity: 0 } : { x: 0, rotate: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeIn" }}
            aria-hidden
          />
          <motion.span
            animate={opening ? { scale: 1.6, opacity: 0 } : { scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <Heart className="size-8 animate-heartbeat fill-white text-white" />
          </motion.span>
        </div>

        <div className="mt-8 text-center">
          <p className="eyebrow">You're invited</p>
          <h1 className="mt-3 font-display text-4xl leading-tight font-medium text-balance text-ink sm:text-5xl">
            A secret <span className="text-romance italic">birthday</span> surprise
          </h1>
          <p className="mx-auto mt-4 max-w-sm leading-relaxed text-pretty text-muted">
            Please enter the invitation code you were sent to leave your wish.
          </p>
        </div>

        <motion.form onSubmit={submit} animate={shake} className="mt-8" noValidate>
          <label htmlFor={inputId} className="sr-only">
            Invitation code
          </label>
          <div
            className={`flex items-center gap-2 rounded-2xl border bg-surface-2 py-1.5 pr-1.5 pl-4 transition focus-within:bg-surface focus-within:ring-4 ${
              error ? "border-rose focus-within:ring-rose/15" : "border-line focus-within:border-rose/60 focus-within:ring-rose/10"
            }`}
          >
            <KeyRound className="size-5 shrink-0 text-gold" aria-hidden />
            <input
              ref={inputRef}
              id={inputId}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                if (error) setError(null);
              }}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="go"
              placeholder="Invitation code"
              aria-invalid={!!error}
              aria-describedby={`${inputId}-msg`}
              className="min-w-0 flex-1 bg-transparent py-2.5 text-lg tracking-[0.18em] text-ink outline-none placeholder:text-base placeholder:tracking-normal placeholder:text-muted/60"
            />
            <button type="submit" disabled={busy || !value.trim()} className="btn-love shrink-0 !px-4 !py-3 sm:!px-5" aria-label="Open the invitation">
              {busy ? <LoaderCircle className="size-5 animate-spin" /> : <ArrowRight className="size-5" />}
              <span className="hidden sm:inline">{busy ? "Opening…" : "Open"}</span>
            </button>
          </div>

          <div id={`${inputId}-msg`} className="mt-3 min-h-5 text-center text-sm" aria-live="polite">
            {error ? (
              <p className="text-rose">{error}</p>
            ) : (
              <p className="text-muted/80 italic">Don't have a code? Ask the person who invited you.</p>
            )}
          </div>
        </motion.form>

        <p className="mt-6 flex items-center justify-center gap-2 text-xs tracking-[0.2em] text-gold uppercase">
          <EyeOff className="size-3.5" /> Shh — it's a surprise
        </p>
      </div>
    </motion.div>
  );
}

function FieldError({ id, text }: { id: string; text?: string }) {
  return (
    <AnimatePresence>
      {text && (
        <motion.p
          id={id}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="mt-2 text-sm text-rose"
        >
          {text}
        </motion.p>
      )}
    </AnimatePresence>
  );
}