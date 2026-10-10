import { AnimatePresence, motion } from "motion/react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../theme/ThemeProvider";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      className={`btn-icon ${className}`}
      aria-label={dark ? "Switch to light mode" : "Switch to candlelight mode"}
      title={dark ? "Light mode" : "Candlelight mode"}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.3 }}
          className="grid place-items-center"
        >
          {dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
