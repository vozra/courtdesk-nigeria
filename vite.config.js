// vite.config.js
// Run: npm install vite-plugin-pwa --save-dev
// Then replace your vite.config.js with this file

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Use the custom sw.js you wrote (or let Workbox auto-generate)
      strategies: "injectManifest",      // use your own sw.js
      srcDir: "public",
      filename: "sw.js",

      // Alternatively, use Workbox auto-generation (simpler):
      // strategies: "generateSW",

      registerType: "autoUpdate",         // auto-update SW when new version deployed
      injectRegister: "auto",

      manifest: {
        name: "CourtDesk Nigeria",
        short_name: "CourtDesk",
        description: "The litigation CMS built for Nigerian law firms",
        theme_color: "#c9a84c",
        background_color: "#040c18",
        display: "standalone",
        orientation: "any",
        scope: "/",
        start_url: "/",
        lang: "en-NG",
        icons: [
          { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
          { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
        shortcuts: [
          { name: "Matters", url: "/?page=matters", icons: [{ src: "/icons/icon-96x96.png", sizes: "96x96" }] },
          { name: "Court Runner", url: "/?page=runner", icons: [{ src: "/icons/icon-96x96.png", sizes: "96x96" }] },
          { name: "Client Updates", url: "/?page=updates", icons: [{ src: "/icons/icon-96x96.png", sizes: "96x96" }] },
        ],
      },

      workbox: {
        // Pre-cache these patterns
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],

        // Runtime caching rules
        runtimeCaching: [
          {
            // Google Fonts — cache-first
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Supabase API — network-first (don't cache API responses)
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-cache",
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },

      devOptions: {
        enabled: true,               // Enable PWA in dev for testing
        type: "module",
      },
    }),
  ],

  server: {
    port: 5173,
    host: true,                      // Expose on local network (for phone testing)
  },

  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
        },
      },
    },
  },
});


// ============================================================
// HOW TO GENERATE APP ICONS
// ============================================================
//
// Option 1 — pwa-asset-generator (recommended, free):
//   npm install -g pwa-asset-generator
//   pwa-asset-generator logo.png ./public/icons --manifest public/manifest.json
//   (requires a 512x512 or larger logo PNG as input)
//
// Option 2 — Online tools (no install needed):
//   https://realfavicongenerator.net
//   https://progressier.com/pwa-icons-and-screenshots-generator
//   Upload your logo → download all sizes → put in public/icons/
//
// Option 3 — Use emoji as placeholder (for quick testing only):
//   Just create a simple 512x512 PNG with the ⚖ scales emoji
//   on a #c9a84c (gold) background
//
// Your icon file structure should look like:
//   public/
//     icons/
//       icon-72x72.png
//       icon-96x96.png
//       icon-128x128.png
//       icon-144x144.png
//       icon-152x152.png
//       icon-192x192.png
//       icon-384x384.png
//       icon-512x512.png
//     manifest.json
//     sw.js
//     offline.html
//   src/
//     App.jsx    ← CourtDesk_Nigeria_v3.jsx goes here
//     main.jsx
