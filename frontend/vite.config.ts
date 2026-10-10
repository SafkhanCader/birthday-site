import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// In development, /api calls are forwarded to FastAPI (port 8000).
// While VITE_USE_MOCK=true the frontend never calls the backend.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      // 127.0.0.1 (not "localhost"): on macOS "localhost" can resolve to IPv6 (::1),
      // while uvicorn listens on IPv4 only — the proxy would then fail to connect.
      "/api": { target: "http://127.0.0.1:8000", changeOrigin: true },
    },
  },
});