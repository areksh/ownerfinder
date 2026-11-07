import { defineConfig, devices } from "@playwright/test";

// End-to-end checks against the site and API running locally on the real
// data. Load the data first: pnpm data:build, then the api's
// db:migrate:local and db:load:local (docs/website.md).
const PORT = 5174;

export default defineConfig({
  testDir: "./e2e",
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // The built site, as deployed, rather than the dev server, whose first
    // load can re-optimise dependencies and reload the page mid-test.
    command: `pnpm run build && pnpm exec vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
