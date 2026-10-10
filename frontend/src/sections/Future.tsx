import { ArrowUp, Heart } from "lucide-react";
import type { Future as FutureT, SiteInfo } from "../api/types";
import { SectionShell } from "../components/SectionShell";
import { Photo } from "../components/Photo";
import { Reveal } from "../components/Reveal";
import { FloatingHearts } from "../components/FloatingHearts";

export function Future({ future, site }: { future: FutureT; site: SiteInfo }) {
  return (
    <>
      <SectionShell
        id="future"
        eyebrow="Chapter eight"
        title={
          <>
            Our <span className="text-romance italic">forever</span>
          </>
        }
        subtitle={future.intro}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          {future.dreams.map((d, i) => (
            <Reveal key={d.id} delay={(i % 2) * 0.1}>
              <div className="card-love group flex h-full gap-5 p-6 transition-transform duration-500 hover:-translate-y-1 sm:p-7">
                <span className="font-display text-5xl leading-none text-romance italic">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="font-display text-2xl text-ink">{d.title}</h3>
                  <p className="mt-2 leading-relaxed text-ink-soft">{d.text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </SectionShell>

      {/* Final full-width moment */}
      <section className="relative px-4 pb-10 sm:px-6" aria-label="Closing">
        <Reveal className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] shadow-love">
          <Photo src={future.photo} alt="Us, forever" ratio="16/10" className="min-h-[26rem] w-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a0610]/90 via-[#1a0610]/35 to-transparent" />
          <FloatingHearts count={10} />
          <div className="absolute inset-x-0 bottom-0 p-8 text-center sm:p-14">
            <p className="font-script text-5xl text-white sm:text-7xl">{future.closing}</p>
            <p className="mt-3 font-display text-xl text-white/80 italic sm:text-2xl">— {site.fromName}</p>
          </div>
        </Reveal>
      </section>

      <footer className="px-4 pt-10 pb-[max(2.5rem,env(safe-area-inset-bottom))] text-center">
        <a href="#hero" className="btn-love">
          <ArrowUp className="size-4" /> Read our story again
        </a>
        <p className="mt-8 flex items-center justify-center gap-1.5 text-xs tracking-[0.2em] text-muted uppercase">
          Made with <Heart className="size-3 fill-rose text-rose animate-heartbeat" /> by {site.fromName}, for {site.herName}
        </p>
      </footer>
    </>
  );
}
