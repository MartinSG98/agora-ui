import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// All API calls go out under /api and the proxy strips the prefix, so the
// backend keeps clean routes while page URLs like /debates/{id} never
// collide with API paths (a hard refresh on an arena URL must serve the
// SPA, not backend JSON).
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
