// vite.config.js
// CRITICAL FIX: Proxy was pointing to port 5555 but FastAPI runs on 8080.
// Updated to match the VITE_API_URL fallback in api.js (port 8080).
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    strictPort: true,

    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
        // NOTE: No rewrite — the backend expects the /api prefix.
        // If you ever remove the /api prefix from FastAPI routes, add:
        // rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
