import { useEffect, useState } from "react";

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
}

function diff(target: number): CountdownParts {
  const ms = Math.max(0, target - Date.now());
  return {
    days: Math.floor(ms / 86_400_000),
    hours: Math.floor((ms / 3_600_000) % 24),
    minutes: Math.floor((ms / 60_000) % 60),
    seconds: Math.floor((ms / 1000) % 60),
    done: ms === 0,
  };
}

/** Live countdown to an ISO date. Stops ticking once it reaches zero. */
export function useCountdown(iso: string): CountdownParts {
  const target = new Date(iso).getTime();
  const [parts, setParts] = useState(() => diff(target));

  useEffect(() => {
    setParts(diff(target));
    if (diff(target).done) return;
    const id = setInterval(() => {
      const next = diff(target);
      setParts(next);
      if (next.done) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [target]);

  return parts;
}
