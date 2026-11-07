import { cloudflare } from "@cloudflare/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    cloudflare({
      viteEnvironment: { name: "ssr" },
      // In development the API Worker runs alongside the site, reading the
      // local D1 that `pnpm --filter api db:load:local` fills.
      auxiliaryWorkers: [{ configPath: "../api/wrangler.jsonc" }],
      persistState: { path: "../api/.wrangler/state" },
    }),
    reactRouter(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
});
