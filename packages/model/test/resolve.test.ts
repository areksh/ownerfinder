import { describe, expect, it } from "vitest";
import { type Query, resolve } from "../src/resolve.ts";
import type { Graph } from "../src/schema.ts";
import { graph, rel } from "./builders.ts";

const A = "entity:a";
const B = "entity:b";
const C = "entity:c";
const D = "entity:d";
const X = "brand:x";

function ask(g: Graph, node: string, extra: Partial<Query> = {}) {
  return resolve(g, { node, date: "2026-11-07", country: "GB", ...extra });
}

/** Each path as its entity ids, for compact assertions. */
function chains(g: Graph, node: string, extra: Partial<Query> = {}): string[][] {
  return ask(g, node, extra).paths.map((p) => p.entities);
}

describe("resolve", () => {
  it("follows ownership up to a listed group", () => {
    const g = graph({
      entities: [A, B],
      brands: [X],
      relationships: [rel("owns_brand", B, X), rel("owns", A, B)],
      listed: [A],
    });
    const result = ask(g, X);
    expect(result.outcome).toBe("linked");
    expect(result.approximate).toBe(false);
    expect(result.paths).toHaveLength(1);
    expect(result.paths[0]).toMatchObject({
      entities: [B, A],
      listed: [A],
      grade: "owned",
      approximate: false,
    });
    expect(result.paths[0]?.links.map((r) => r.type)).toEqual(["owns_brand", "owns"]);
    expect(result.paths[0]?.effectiveSharePct).toBeUndefined();
  });

  it("keeps going past a listed company that is itself held", () => {
    const g = graph({
      entities: [A, B, C],
      relationships: [rel("owns", A, B), rel("owns", C, A)],
      listed: [A, C],
    });
    expect(ask(g, B).paths[0]?.listed).toEqual([A, C]);
  });

  describe("stakes", () => {
    it("ignores a stake below the threshold unless the threshold is lowered", () => {
      const g = graph({
        entities: [A, B],
        relationships: [rel("holds_stake", A, B, { stakePct: 3 })],
        listed: [A],
      });
      expect(ask(g, B).outcome).toBe("no-link");
      const lowered = ask(g, B, { minStakePct: 1 });
      expect(lowered.outcome).toBe("linked");
      expect(lowered.paths[0]).toMatchObject({ grade: "stake", effectiveSharePct: 3 });
    });

    it("counts a stake exactly at the threshold", () => {
      const g = graph({
        entities: [A, B],
        relationships: [rel("holds_stake", A, B, { stakePct: 5 })],
        listed: [A],
      });
      expect(ask(g, B).outcome).toBe("linked");
    });

    it("ignores a passive stake unless asked to include passive holdings", () => {
      const g = graph({
        entities: [A, B],
        relationships: [rel("holds_stake", A, B, { stakePct: 7, passive: true })],
        listed: [A],
      });
      expect(ask(g, B).outcome).toBe("no-link");
      expect(ask(g, B, { includePassive: true }).outcome).toBe("linked");
    });

    it("multiplies stakes along a path into an indicative share", () => {
      const g = graph({
        entities: [A, C, D],
        relationships: [
          rel("owns", C, D, { stakePct: 60 }),
          rel("holds_stake", A, C, { stakePct: 40 }),
        ],
        listed: [A],
      });
      expect(ask(g, D).paths[0]).toMatchObject({ grade: "stake", effectiveSharePct: 24 });
    });

    it("gives no share for a path through board control", () => {
      const g = graph({
        entities: [A, C, D],
        relationships: [rel("controls_board", C, D), rel("holds_stake", A, C, { stakePct: 40 })],
        listed: [A],
      });
      const path = ask(g, D).paths[0];
      expect(path?.grade).toBe("stake");
      expect(path?.effectiveSharePct).toBeUndefined();
    });
  });

  describe("grades", () => {
    it("grades a path by its weakest link", () => {
      const g = graph({
        entities: [A, B, C],
        brands: [X],
        relationships: [
          rel("licenses_brand", B, X),
          rel("owns", A, B),
          rel("controls_board", A, C),
        ],
        listed: [A],
      });
      expect(ask(g, X).paths[0]?.grade).toBe("licensed");
      expect(ask(g, C).paths[0]?.grade).toBe("controlled");
    });

    it("returns both the owner and the licensee of a brand, strongest first", () => {
      const g = graph({
        entities: [A, B],
        brands: [X],
        relationships: [
          rel("licenses_brand", A, X),
          rel("owns_brand", B, X),
          rel("distributes", A, X),
        ],
        listed: [A],
      });
      const result = ask(g, X);
      expect(result.outcome).toBe("linked");
      expect(result.paths.map((p) => p.grade)).toEqual(["owned", "licensed", "distributed"]);
      expect(result.paths[0]?.listed).toEqual([]);
    });
  });

  describe("dates and countries", () => {
    const demerged = graph({
      entities: [A, B, C],
      relationships: [
        rel("owns", A, B, { validFrom: "2000-08", validTo: "2025-12-06" }),
        rel("owns", C, B, { validFrom: "2025-12-06" }),
      ],
      listed: [A],
    });

    it("applies a relationship up to, not including, its end date", () => {
      expect(chains(demerged, B, { date: "2025-12-05" })).toEqual([[B, A]]);
      expect(chains(demerged, B, { date: "2025-12-06" })).toEqual([[B, C]]);
    });

    it("applies a relationship only in its countries", () => {
      const g = graph({
        entities: [A, B],
        brands: [X],
        relationships: [
          rel("owns_brand", A, X, { id: "relationship:uk", scope: { include: ["GB", "IE"] } }),
          rel("owns_brand", B, X, {
            id: "relationship:rest",
            scope: { include: "world", exclude: ["GB", "IE"] },
          }),
        ],
        listed: [A],
      });
      expect(ask(g, X, { country: "IE" }).outcome).toBe("linked");
      expect(chains(g, X, { country: "DE" })).toEqual([[B]]);
      expect(ask(g, X, { country: "DE" }).outcome).toBe("no-link");
    });

    it("flags a path whose link has an imprecise boundary around the date", () => {
      const result = ask(demerged, B, { date: "2000-08-20" });
      expect(result.paths[0]?.approximate).toBe(true);
      expect(result.approximate).toBe(true);
    });

    it("flags the result when a link was left out only by an imprecise boundary", () => {
      const g = graph({
        entities: [A],
        brands: [X],
        relationships: [rel("owns_brand", A, X, { validTo: "2025-12" })],
        listed: [A],
      });
      const result = ask(g, X, { date: "2025-12-15" });
      expect(result).toEqual({ outcome: "unknown", paths: [], approximate: true });
    });
  });

  describe("outcomes", () => {
    it("is unknown for a node not in the graph", () => {
      expect(ask(graph({}), "brand:nowhere")).toEqual({
        outcome: "unknown",
        paths: [],
        approximate: false,
      });
    });

    it("is unknown for a brand that nothing holds in that country", () => {
      const g = graph({
        entities: [A],
        brands: [X],
        relationships: [rel("owns_brand", A, X, { scope: { include: ["US"] } })],
        listed: [A],
      });
      expect(ask(g, X).outcome).toBe("unknown");
    });

    it("treats an entity with no holders as its own ultimate holder", () => {
      const g = graph({ entities: [A, B], listed: [A] });
      expect(ask(g, B)).toMatchObject({
        outcome: "no-link",
        paths: [{ entities: [B], links: [] }],
      });
      expect(ask(g, A)).toMatchObject({
        outcome: "linked",
        paths: [{ entities: [A], listed: [A] }],
      });
      expect(ask(g, A).paths[0]?.grade).toBeUndefined();
    });

    it("counts a listing only for the chosen criteria", () => {
      const g = graph({
        entities: [A, B],
        relationships: [rel("owns", A, B)],
        criteria: ["criterion:example", "criterion:other"],
        listed: [{ entity: A, criterion: "criterion:other" }],
      });
      expect(ask(g, B).outcome).toBe("linked");
      expect(ask(g, B, { criteria: ["criterion:other"] }).outcome).toBe("linked");
      expect(ask(g, B, { criteria: ["criterion:example"] }).outcome).toBe("no-link");
      expect(ask(g, B, { criteria: [] }).outcome).toBe("no-link");
    });
  });

  it("stops at a cycle and still reports the path", () => {
    const g = graph({
      entities: [A, B],
      relationships: [
        rel("holds_stake", A, B, { stakePct: 20 }),
        rel("holds_stake", B, A, { stakePct: 20 }),
      ],
      listed: [A],
    });
    expect(chains(g, B)).toEqual([[B, A]]);
    expect(ask(g, B).outcome).toBe("linked");
  });

  it.each([
    ["a date without a day", { date: "2026" }],
    ["an impossible date", { date: "2026-02-30" }],
    ["a country that is not ISO 3166-1", { country: "UK" }],
    ["a negative threshold", { minStakePct: -1 }],
    ["a threshold above 100", { minStakePct: 101 }],
  ])("rejects a query with %s", (_name, extra) => {
    expect(() => ask(graph({}), X, extra)).toThrow(RangeError);
  });
});
