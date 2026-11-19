import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Same-origin in development: the browser talks to :5173 and Vite forwards
    // /api to Django. This avoids CORS and Django's CSRF Origin check on POSTs.
    proxy: {
      "/api": { target: "http://localhost:8000" },
    },
  },
});
