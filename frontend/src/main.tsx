import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MotionConfig } from "motion/react";
import { ThemeProvider } from "./theme/ThemeProvider";
import { AuthProvider } from "./auth/AuthProvider";
import App from "./App";
// Fonts are self-hosted (bundled), so nothing loads from Google —
// faster on mobile and keeps the private site fully private.
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import "@fontsource/cormorant-garamond/500-italic.css";
import "@fontsource/great-vibes/400.css";
import "@fontsource/jost/300.css";
import "@fontsource/jost/400.css";
import "@fontsource/jost/500.css";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* Respects the phone's "reduce motion" accessibility setting */}
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </MotionConfig>
  </StrictMode>,
);
