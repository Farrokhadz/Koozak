import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

const BRAND_PRIMARY = "#174C3C";
const BRAND_BACKGROUND = "#F7F6F0";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // A new service worker installs silently and takes over on next load.
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "favicon.ico", "apple-touch-icon-180x180.png"],
      manifest: {
        id: "/",
        name: "کوزک | مدیریت مالی شخصی",
        short_name: "کوزک",
        description: "مدیریت درآمد، هزینه و حساب‌های شخصی",
        lang: "fa",
        dir: "rtl",
        start_url: "/",
        scope: "/",
        display: "standalone",
        theme_color: BRAND_PRIMARY,
        background_color: BRAND_BACKGROUND,
        icons: [
          { src: "pwa-64x64.png", sizes: "64x64", type: "image/png" },
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // App shell: everything Vite builds is precached, so the app opens offline.
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
        cleanupOutdatedCaches: true,
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//, /^\/admin\//, /^\/static\//],
        runtimeCaching: [
          {
            // GET responses from the API: network first, cache when offline.
            // Cleared on logout (see logout in authService.js).
            urlPattern: ({ url, request }) =>
              request.method === "GET" && url.pathname.startsWith("/api/"),
            handler: "NetworkFirst",
            options: {
              cacheName: "koozak-api",
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
    }),
  ],
  server: {
    // Same-origin in development: the browser talks to :5173 and Vite forwards
    // /api to Django. This avoids CORS and Django's CSRF Origin check on POSTs.
    proxy: {
      "/api": { target: "http://localhost:8000" },
    },
  },
});
