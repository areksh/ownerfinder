import { describe, expect, it } from "vitest";
import type { Graph } from "../src/schema.ts";
import { type IssueCode, validateGraph } from "../src/validate.ts";
import { graph, rel, SOURCE_ID } from "./builders.ts";

const A = "entity:a";
const B = "entity:b";
const X = "brand:x";

function codes(g: unknown): IssueCode[] {
  return validateGraph(g).map((issue) => issue.code);
}

function base(relationships: Graph["relationships"]): Graph {
  return graph({ entities: [A, B], brands: [X], relationships, listed: [A] });
}

describe("validateGraph", () => {
  it("accepts a valid graph", () => {
    expect(
      validateGraph(
        base([
          rel("owns", A, B, { stakePct: 60 }),
          rel("owns_brand", B, X),
          rel("holds_stake", A, B, {
            id: "relationship:s",
            stakePct: 10,
            validFrom: "1990",
            validTo: "2000",
          }),
        ]),
      ),
    ).toEqual([]);
  });

  it("reports shape problems with the record's id and stops there", () => {
    const g = base([rel("owns", A, "entity:missing", { validFrom: "soon" })]);
    const issues = validateGraph(g);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ code: "shape", id: "relationship:owns-a-missing" });
    expect(issues[0]?.message).toContain("validFrom");
  });

  it("reports input that is not a graph at all", () => {
    expect(codes(null)).toEqual(["shape"]);
  });

  it("reports ids used twice, across kinds", () => {
    const g = base([]);
    g.brands.push({ id: X, name: "again" });
    expect(codes(g)).toEqual(["duplicate-id"]);
  });

  it("reports two listings for one entity", () => {
    const g = base([]);
    const listing = g.listings[0];
    if (listing === undefined) throw new Error("fixture");
    g.listings.push(listing);
    expect(codes(g)).toEqual(["duplicate-id"]);
  });

  it("reports references to records that do not exist or are the wrong kind", () => {
    expect(codes(base([rel("owns", "entity:ghost", B)]))).toEqual(["dangling-reference"]);
    expect(codes(base([rel("owns_brand", A, "brand:ghost")]))).toEqual(["dangling-reference"]);
    expect(codes(base([rel("owns_brand", X, X, { id: "relationship:r" })]))).toContain(
      "dangling-reference",
    );
    expect(codes(base([rel("owns", A, B, { sources: ["source:ghost"] })]))).toEqual([
      "dangling-reference",
    ]);
    expect(codes(base([rel("owns", A, SOURCE_ID)]))).toEqual(["dangling-reference"]);
  });

  it("reports listings that point at missing entities, criteria or sources", () => {
    const g = graph({ entities: [A], listed: [{ entity: A, criterion: "criterion:ghost" }] });
    expect(codes(g)).toEqual(["dangling-reference"]);
    expect(codes(graph({ entities: [A], listed: ["entity:ghost"] }))).toEqual([
      "dangling-reference",
    ]);
  });

  it("reports a relationship whose target is the wrong kind for its type", () => {
    expect(codes(base([rel("owns", A, X)]))).toEqual(["wrong-target-kind"]);
    expect(codes(base([rel("licenses_brand", A, B)]))).toEqual(["wrong-target-kind"]);
  });

  it("reports a relationship from a holder to itself", () => {
    expect(codes(base([rel("controls_board", A, A)]))).toEqual(["self-reference"]);
  });

  it.each([
    ["holds_stake without a percentage", rel("holds_stake", A, B)],
    ["holds_stake of 0", rel("holds_stake", A, B, { stakePct: 0 })],
    ["holds_stake above 50", rel("holds_stake", A, B, { stakePct: 50.5 })],
    ["owns of 50", rel("owns", A, B, { stakePct: 50 })],
    ["owns above 100", rel("owns", A, B, { stakePct: 101 })],
    ["a percentage on a brand", rel("owns_brand", A, X, { stakePct: 100 })],
    ["a percentage on board control", rel("controls_board", A, B, { stakePct: 30 })],
  ])("reports %s", (_name, relationship) => {
    expect(codes(base([relationship]))).toEqual(["stake-out-of-range"]);
  });

  it("accepts a stake of exactly 50 and outright ownership of 100", () => {
    expect(codes(base([rel("holds_stake", A, B, { stakePct: 50 })]))).toEqual([]);
    expect(codes(base([rel("owns", A, B, { stakePct: 100 })]))).toEqual([]);
  });

  it("reports passive on anything but a stake", () => {
    expect(codes(base([rel("owns", A, B, { passive: false })]))).toEqual(["passive-not-allowed"]);
    expect(codes(base([rel("holds_stake", A, B, { stakePct: 3, passive: true })]))).toEqual([]);
  });

  it("reports an end that is not after the start", () => {
    expect(codes(base([rel("owns", A, B, { validFrom: "2020", validTo: "2020" })]))).toEqual([
      "date-order",
    ]);
    expect(codes(base([rel("owns", A, B, { validFrom: "2020-06", validTo: "2020" })]))).toEqual([
      "date-order",
    ]);
    expect(codes(base([rel("owns", A, B, { validFrom: "2020", validTo: "2020-06" })]))).toEqual([]);
  });

  it("reports a relationship or evidence item with no source", () => {
    expect(codes(base([rel("owns", A, B, { sources: [] })]))).toEqual(["missing-source"]);
    const g = base([]);
    const evidence = g.listings[0]?.evidence[0];
    if (evidence === undefined) throw new Error("fixture");
    evidence.sources = [];
    expect(codes(g)).toEqual(["missing-source"]);
  });

  describe("overlapping duplicates", () => {
    const first = { id: "relationship:first", stakePct: 16.7 };
    const second = { id: "relationship:second", stakePct: 21 };

    it("reports the same link twice at the same time and place", () => {
      expect(
        codes(base([rel("holds_stake", A, B, first), rel("holds_stake", A, B, second)])),
      ).toEqual(["overlapping-duplicate"]);
    });

    it("accepts successive stakes that meet without overlapping", () => {
      expect(
        codes(
          base([
            rel("holds_stake", A, B, { ...first, validFrom: "2015-06-12", validTo: "2025-12-31" }),
            rel("holds_stake", A, B, { ...second, validFrom: "2025-12-31" }),
          ]),
        ),
      ).toEqual([]);
    });

    it("accepts the same link in different countries", () => {
      expect(
        codes(
          base([
            rel("owns_brand", A, X, { id: "relationship:uk", scope: { include: ["GB", "IE"] } }),
            rel("owns_brand", A, X, {
              id: "relationship:rest",
              scope: { include: "world", exclude: ["GB", "IE"] },
            }),
          ]),
        ),
      ).toEqual([]);
    });

    it("reports a worldwide link that overlaps a listed country it does not exclude", () => {
      expect(
        codes(
          base([
            rel("owns_brand", A, X, { id: "relationship:uk", scope: { include: ["GB", "FR"] } }),
            rel("owns_brand", A, X, {
              id: "relationship:rest",
              scope: { include: "world", exclude: ["GB"] },
            }),
          ]),
        ),
      ).toEqual(["overlapping-duplicate"]);
    });

    it("accepts different types between the same pair", () => {
      expect(codes(base([rel("owns_brand", A, X), rel("distributes", A, X)]))).toEqual([]);
    });
  });
});
