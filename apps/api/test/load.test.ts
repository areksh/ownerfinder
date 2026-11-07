import { env } from "cloudflare:test";
import { fixture } from "@ecf/model/acceptance-fixture";
import { expect, it } from "vitest";
import { loadGraph } from "./support/load.ts";

it("loads the acceptance fixture into the migrated database", async () => {
  await loadGraph(env.DB, fixture);
  const row = await env.DB.prepare("SELECT count(*) AS n FROM nodes").first<{ n: number }>();
  expect(row?.n).toBe(fixture.entities.length + fixture.brands.length);
});
