import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// The backend runs unprefixed routes on :8000, so dev-proxy each API root.
const backend = "http://127.0.0.1:8000";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: Object.fromEntries(
      ["/debates", "/evaluations", "/models", "/formats", "/health"].map(
        (path) => [path, backend],
      ),
    ),
  },
});
