import { defineConfig } from "vitest/config";

// Component tests only; the Workers dev plugin in vite.config.ts is not
// needed to render components. End-to-end checks run under Playwright.
export default defineConfig({
  test: {
    environment: "happy-dom",
    include: ["app/**/*.test.{ts,tsx}"],
    restoreMocks: true,
  },
});
