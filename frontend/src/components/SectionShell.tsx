import type { ReactNode } from "react";
import { Ornament } from "./Ornament";
import { Reveal } from "./Reveal";

interface Props {
  id: string;
  eyebrow: string;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  className?: string;
  width?: "narrow" | "normal" | "wide";
}

const widths = { narrow: "max-w-3xl", normal: "max-w-5xl", wide: "max-w-6xl" };

/**
 * Shared frame for every section: same rhythm, same heading style.
 * Change spacing or heading design here once and all 9 sections follow.
 */
export function SectionShell({ id, eyebrow, title, subtitle, children, className = "", width = "normal" }: Props) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={`relative scroll-mt-16 px-4 py-24 sm:px-6 sm:py-32 ${className}`}>
      <div className={`mx-auto ${widths[width]}`}>
        <Reveal className="mx-auto mb-14 max-w-2xl text-center sm:mb-20">
          <p className="eyebrow">{eyebrow}</p>
          <Ornament className="my-4" />
          <h2 id={`${id}-title`} className="font-display text-4xl leading-[1.1] font-medium text-balance text-ink sm:text-6xl">
            {title}
          </h2>
          {subtitle && <p className="mt-5 text-base leading-relaxed text-pretty text-muted sm:text-lg">{subtitle}</p>}
        </Reveal>
        {children}
      </div>
    </section>
  );
}
