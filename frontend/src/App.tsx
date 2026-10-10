import { AnimatePresence, motion } from "motion/react";
import { useAuth } from "./auth/AuthProvider";
import { LockScreen } from "./pages/LockScreen";
import { Experience } from "./pages/Experience";
import { WishPage } from "./pages/WishPage";

/** Public guest page — no password. Everything else sits behind the lock. */
const isWishPage = window.location.pathname.replace(/\/+$/, "") === "/wish";

export default function App() {
  if (isWishPage) return <WishPage />;
  return <PrivateSite />;
}

function PrivateSite() {
  const { status } = useAuth();
  if (status === "checking") return null;

  return (
    <AnimatePresence mode="wait">
      {status === "locked" ? (
        <motion.div key="lock" exit={{ opacity: 0, scale: 1.04, filter: "blur(6px)" }} transition={{ duration: 0.6 }}>
          <LockScreen />
        </motion.div>
      ) : (
        <motion.div key="story">
          <Experience />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
