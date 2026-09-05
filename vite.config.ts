import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(() => ({
  define: {
    "import.meta.env.VITE_API_URL": JSON.stringify("/api"),
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.ico",
        "apple-touch-icon.png",
        "clinic-logo.jpeg",
        "pwa-192x192.png",
        "pwa-512x512.png",
        "placeholder.svg",
      ],
      manifest: {
        id: "/",
        name: "Dunwell Clinic - Youth Priority",
        short_name: "Dunwell",
        description: "Dunwell Clinic Reception and Patient Management System with Full Offline Support",
        theme_color: "#0D1B2A",
        background_color: "#0D1B2A",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,jpeg,jpg,svg,woff,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^\/api\/(patients|bookings|nurses|catalogue|dashboard|attendance|users)/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "dunwell-api-cache",
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 120,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: "module",
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
