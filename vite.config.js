// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    strictPort: true,

    proxy: {
      "/api": {
        target: "http://localhost:5555",
        changeOrigin: true,
        secure: false, // avoids issues with local https/self-signed
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
