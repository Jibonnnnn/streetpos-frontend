import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["StreetSidePhoto.png", "favicon.svg"],
      manifest: {
        name: "StreetSide Café",
        short_name: "StreetSide",
        description: "Streetside Café — POS, orders, and menu",
        theme_color: "#f97316",
        background_color: "#fff7ed",
        display: "standalone",
        orientation: "portrait-primary",
        // Installed app opens straight into the POS (behind auth), not the
        // public marketing landing page. ProtectedRoute already bounces
        // logged-out users to /login, so this is safe either way.
        start_url: "/login",
        // Keep scope at "/" so /login and / stay "inside" the installed
        // app's navigation — otherwise a session-expiry redirect to /login
        // would kick the user out into a regular browser tab.
        scope: "/",
        icons: [
          {
            src: "/StreetSidePhoto.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/StreetSidePhoto.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        // Cache the app shell; API calls still go to the network
        navigateFallback: "/index.html",
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
      },
      devOptions: {
        // Optional: test PWA in dev (can be noisy)
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            if (id.includes("react")) return "vendor";
            if (id.includes("lucide")) return "icons";
          }
          return undefined;
        },
      },
    },
  },
});