import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

export default defineConfig(async () => {
  const migrations = await readD1Migrations("./migrations");
  return {
    plugins: [
      cloudflareTest({
        wrangler: { configPath: "./wrangler.jsonc" },
        miniflare: { bindings: { TEST_MIGRATIONS: migrations } },
      }),
    ],
    test: {
      restoreMocks: true,
      setupFiles: ["./test/support/apply-migrations.ts"],
      coverage: {
        provider: "istanbul" as const,
        include: ["src/**"],
      },
    },
  };
});
