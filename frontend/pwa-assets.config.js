import { defineConfig } from "@vite-pwa/assets-generator/config";

// Generates the PNG icons from public/favicon.svg (run: npm run generate-pwa-assets).
// The SVG is a full-bleed square with its content inside the maskable safe
// zone, so the same artwork is used for normal, maskable and Apple icons.
export default defineConfig({
  headLinkOptions: { preset: "2023" },
  preset: {
    transparent: {
      sizes: [64, 192, 512],
      favicons: [[48, "favicon.ico"]],
      padding: 0,
    },
    maskable: { sizes: [512], padding: 0 },
    apple: { sizes: [180], padding: 0 },
  },
  images: ["public/favicon.svg"],
});
