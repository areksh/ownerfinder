import { env } from "cloudflare:test";
import { exports } from "cloudflare:workers";
import { fixture } from "@ecf/model/acceptance-fixture";
import { beforeEach, describe, expect, it } from "vitest";
import { withReasons } from "./support/listed.ts";
import { loadGraph } from "./support/load.ts";

beforeEach(() => loadGraph(env.DB, fixture));

interface Link {
  id: string;
  from: { id: string; name: string };
}

interface NodeBody {
  node: { id: string; kind: string; name: string };
  listing: unknown;
  heldBy: Link[];
  holds: Link[];
  sources: Record<string, unknown>;
  criteria?: unknown;
}

async function get(path: string) {
  const res = await exports.default.fetch(`https://api.test${path}`);
  return { status: res.status, body: (await res.json()) as NodeBody };
}

describe("GET /nodes/:id", () => {
  it("shows a company with what holds it and what it holds, across all dates", async () => {
    const { status, body } = await get("/nodes/entity:innocent");
    expect(status).toBe(200);
    expect(body.node).toEqual({
      id: "entity:innocent",
      kind: "entity",
      name: "Fresh Trading Ltd (innocent)",
    });
    expect(body.listing).toBeNull();
    expect(body.heldBy.map((r) => r.id)).toEqual([
      "relationship:coca-cola-innocent-2010",
      "relationship:coca-cola-innocent-2013",
    ]);
    expect(body.heldBy[0]).toMatchObject({
      type: "owns",
      from: { id: "entity:coca-cola", name: "The Coca-Cola Company" },
      to: { id: "entity:innocent", name: "Fresh Trading Ltd (innocent)" },
      stakePct: 58,
      validTo: "2013-02",
    });
    expect(body.holds).toEqual([]);
    expect(Object.keys(body.sources).sort()).toEqual([
      "source:marketing-week-innocent-2010",
      "source:marketing-week-innocent-2013",
    ]);
  });

  it("shows a listed company's listing and what it holds", async () => {
    const { body } = await get("/nodes/entity%3Amars");
    expect(body.listing).toMatchObject({
      entity: "entity:mars",
      evidence: [{ criterion: "criterion:example" }],
    });
    expect(body.holds.map((r) => r.id)).toEqual(["relationship:mars-kellanova"]);
    expect(body.sources).toHaveProperty(["source:mars-kellanova-2025"]);
  });

  it("includes the sources a listing's evidence cites", async () => {
    await loadGraph(env.DB, withReasons);
    const { body } = await get("/nodes/entity:mars");
    expect(body.sources).toHaveProperty(["source:reason-a"]);
    expect(body.sources).toHaveProperty(["source:reason-b"]);
  });

  it("shows a brand", async () => {
    const { body } = await get("/nodes/brand:persil");
    expect(body.node.kind).toBe("brand");
    expect(body.heldBy.map((r) => r.from.id).sort()).toEqual(["entity:henkel", "entity:unilever"]);
  });

  it("answers 404 for an id that is not recorded and 400 for a malformed one", async () => {
    expect((await get("/nodes/entity:nobody")).status).toBe(404);
    expect((await get("/nodes/nobody")).status).toBe(400);
  });
});

describe("GET /criteria", () => {
  it("lists the criteria", async () => {
    const { status, body } = await get("/criteria");
    expect(status).toBe(200);
    expect(body).toEqual({ criteria: fixture.criteria });
  });
});
