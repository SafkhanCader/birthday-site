import { useActiveSection } from "../hooks/useActiveSection";

export interface NavItem {
  id: string;
  label: string;
}

/** Side navigation dots (desktop) — shows where she is in the story. */
export function NavDots({ items }: { items: NavItem[] }) {
  const active = useActiveSection(items.map((i) => i.id));

  return (
    <nav aria-label="Sections" className="fixed top-1/2 right-5 z-30 hidden -translate-y-1/2 lg:block">
      <ul className="flex flex-col items-end gap-3.5">
        {items.map((item) => {
          const on = item.id === active;
          return (
            <li key={item.id}>
              <a href={`#${item.id}`} className="group flex items-center gap-3" aria-current={on ? "true" : undefined}>
                <span
                  className={`font-display text-sm italic transition-all duration-300 ${
                    on ? "text-rose opacity-100" : "translate-x-2 text-muted opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                  }`}
                >
                  {item.label}
                </span>
                <span
                  className={`block rounded-full transition-all duration-300 ${
                    on ? "h-6 w-1.5 bg-rose shadow-love" : "size-1.5 bg-ink-soft/30 group-hover:bg-rose/60"
                  }`}
                />
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
