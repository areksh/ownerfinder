import { env } from "cloudflare:test";
import { exports } from "cloudflare:workers";
import { fixture } from "@ecf/model/acceptance-fixture";
import { beforeEach, describe, expect, it } from "vitest";
import { withReasons } from "./support/listed.ts";
import { loadGraph } from "./support/load.ts";

beforeEach(() => loadGraph(env.DB, fixture));

interface Body {
  query: Record<string, unknown>;
  node: { id: string; kind: string; name: string } | null;
  outcome: string;
  approximate: boolean;
  paths: Array<{
    grade?: string;
    effectiveSharePct?: number;
    approximate: boolean;
    entities: Array<{ id: string; name: string; listed: boolean }>;
    links: Array<{
      id: string;
      type: string;
      from: { id: string; name: string };
      to: { id: string; name: string };
      sources: string[];
      coverage?: string;
    }>;
  }>;
  listings: Array<{ entity: string; evidence: Array<{ criterion: string; summary: string }> }>;
  sources: Record<string, { id: string; url: string }>;
}

async function lookup(path: string): Promise<{ status: number; body: Body; res: Response }> {
  const res = await exports.default.fetch(`https://api.test${path}`);
  return { status: res.status, body: (await res.json()) as Body, res };
}

function summary(body: Body) {
  return {
    outcome: body.outcome,
    paths: body.paths.map((p) => `${p.grade}: ${p.entities.map((e) => e.id).join(" > ")}`),
  };
}

describe("GET /lookup/:id", () => {
  it("answers Kellogg's in the US with the brand owner and the licensee", async () => {
    const { status, body, res } = await lookup("/lookup/brand:kelloggs?country=US&date=2026-11-07");
    expect(status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("public, max-age=300");
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    expect(body.query).toEqual({
      node: "brand:kelloggs",
      date: "2026-11-07",
      country: "US",
      minStakePct: 5,
      includePassive: false,
    });
    expect(body.node).toEqual({ id: "brand:kelloggs", kind: "brand", name: "Kellogg's" });
    expect(summary(body)).toEqual({
      outcome: "linked",
      paths: [
        "owned: entity:kellanova > entity:mars",
        "licensed: entity:wk-kellogg-co > entity:ferrero",
      ],
    });
    const [owned, licensed] = body.paths;
    expect(owned?.entities).toEqual([
      { id: "entity:kellanova", name: "Kellanova", listed: false },
      { id: "entity:mars", name: "Mars, Incorporated", listed: true },
    ]);
    expect(owned?.links[0]).toMatchObject({
      id: "relationship:kellanova-kelloggs",
      type: "owns_brand",
      from: { id: "entity:kellanova", name: "Kellanova" },
      to: { id: "brand:kelloggs", name: "Kellogg's" },
      sources: ["source:kellogg-brand-agreement-2023"],
    });
    expect(licensed?.links[0]?.coverage).toContain("Exclusive, perpetual licence");
    expect(body.sources["source:kellogg-brand-agreement-2023"]?.url).toMatch(
      /^https:\/\/www\.sec\.gov\//,
    );
    expect(Object.keys(body.sources).sort()).toEqual([
      "source:ferrero-wk-kellogg-2025",
      "source:kellogg-brand-agreement-2023",
      "source:mars-kellanova-2025",
    ]);
  });

  it.each([
    [
      "/lookup/entity:loreal?country=GB&date=2026-11-07",
      "linked",
      ["stake: entity:loreal > entity:nestle"],
    ],
    ["/lookup/brand:starbucks?country=GB&date=2018-01-15", "no-link", ["owned: entity:starbucks"]],
    [
      "/lookup/entity:monster?country=GB&date=2020-06-01",
      "linked",
      ["stake: entity:monster > entity:coca-cola"],
    ],
    [
      "/lookup/entity:costa?country=GB&date=2026-11-07",
      "linked",
      ["owned: entity:costa > entity:coca-cola"],
    ],
    ["/lookup/brand:persil?country=DE&date=2026-11-07", "no-link", ["owned: entity:henkel"]],
    ["/lookup/brand:persil?country=ES&date=2026-11-07", "unknown", []],
    [
      "/lookup/brand:tropicana?country=US&date=2026-11-07",
      "linked",
      [
        "owned: entity:tropicana-brands-group > entity:pai-partners",
        "stake: entity:tropicana-brands-group > entity:pepsico",
        "distributed: entity:pepsico",
      ],
    ],
    [
      "/lookup/brand:ben-and-jerrys?country=GB&date=2026-11-07",
      "linked",
      ["stake: entity:ben-and-jerrys-homemade > entity:magnum-ice-cream-company > entity:unilever"],
    ],
  ])("answers the acceptance case %s", async (path, outcome, paths) => {
    const { status, body } = await lookup(path);
    expect(status).toBe(200);
    expect(summary(body)).toEqual({ outcome, paths });
  });

  it("gives the indicative share on a path through a stake", async () => {
    const { body } = await lookup("/lookup/brand:ben-and-jerrys?country=GB&date=2026-11-07");
    expect(body.paths[0]?.effectiveSharePct).toBe(19.9);
  });

  it("flags an answer inside an imprecise date", async () => {
    const { body } = await lookup("/lookup/brand:kelloggs?country=GB&date=2025-12-09");
    expect(body.approximate).toBe(true);
  });

  it("accepts an encoded colon in the id", async () => {
    const { status, body } = await lookup("/lookup/brand%3Akelloggs?country=GB&date=2026-11-07");
    expect(status).toBe(200);
    expect(body.node?.id).toBe("brand:kelloggs");
  });

  it("answers unknown, not an error, for an id that is not recorded", async () => {
    const { status, body } = await lookup("/lookup/brand:not-recorded?country=GB");
    expect(status).toBe(200);
    expect(body).toMatchObject({ node: null, outcome: "unknown", paths: [], sources: {} });
  });

  it("applies the chosen criteria, threshold and passive options", async () => {
    const only = await lookup(
      "/lookup/entity:loreal?country=GB&date=2026-11-07&criteria=criterion:other",
    );
    expect(only.body.outcome).toBe("no-link");
    const high = await lookup("/lookup/entity:loreal?country=GB&date=2026-11-07&minStakePct=25");
    expect(high.body.query.minStakePct).toBe(25);
    expect(high.body.outcome).toBe("no-link");
    const passive = await lookup(
      "/lookup/entity:loreal?country=GB&date=2026-11-07&includePassive=true",
    );
    expect(passive.body.query.includePassive).toBe(true);
  });

  it("gives each listed company on the paths with its reasons and their sources", async () => {
    await loadGraph(env.DB, withReasons);
    const { body } = await lookup("/lookup/brand:kelloggs?country=GB&date=2026-11-07");
    expect(body.listings).toEqual([
      {
        entity: "entity:mars",
        evidence: [
          expect.objectContaining({ criterion: "criterion:example", summary: "Placeholder A." }),
          expect.objectContaining({ criterion: "criterion:other", summary: "Placeholder B." }),
        ],
      },
    ]);
    expect(body.sources).toHaveProperty(["source:reason-a"]);
    expect(body.sources).toHaveProperty(["source:reason-b"]);
  });

  it("gives only the reasons that meet the chosen criteria", async () => {
    await loadGraph(env.DB, withReasons);
    const { body } = await lookup(
      "/lookup/brand:kelloggs?country=GB&date=2026-11-07&criteria=criterion:other",
    );
    expect(body.listings.map((l) => l.evidence.map((e) => e.criterion))).toEqual([
      ["criterion:other"],
    ]);
    expect(body.sources).not.toHaveProperty(["source:reason-a"]);
    expect(body.sources).toHaveProperty(["source:reason-b"]);
  });

  it("gives no listings when nothing listed is reached", async () => {
    const { body } = await lookup("/lookup/entity:henkel?country=DE&date=2026-11-07");
    expect(body.listings).toEqual([]);
  });

  it("defaults the date to today in UTC", async () => {
    const before = new Date().toISOString().slice(0, 10);
    const { body } = await lookup("/lookup/brand:persil?country=GB");
    const after = new Date().toISOString().slice(0, 10);
    expect([before, after]).toContain(body.query.date);
  });

  it.each([
    ["no country", "/lookup/brand:persil"],
    ["a country that is not ISO 3166-1", "/lookup/brand:persil?country=UK"],
    ["a lower-case country", "/lookup/brand:persil?country=gb"],
    ["a date without a day", "/lookup/brand:persil?country=GB&date=2026"],
    ["an impossible date", "/lookup/brand:persil?country=GB&date=2026-02-30"],
    ["a threshold that is not a number", "/lookup/brand:persil?country=GB&minStakePct=lots"],
    ["a threshold above 100", "/lookup/brand:persil?country=GB&minStakePct=101"],
    [
      "includePassive other than true or false",
      "/lookup/brand:persil?country=GB&includePassive=yes",
    ],
    ["an id without a kind", "/lookup/persil?country=GB"],
    ["an id of the wrong kind", "/lookup/source:x?country=GB"],
    ["an id that is not validly encoded", "/lookup/brand%E0%A4%A?country=GB"],
  ])("rejects %s with 400", async (_name, path) => {
    const res = await exports.default.fetch(`https://api.test${path}`);
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "bad_request", message: expect.any(String) });
  });
});
