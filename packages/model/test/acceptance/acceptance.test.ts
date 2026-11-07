/**
 * The acceptance cases from docs/data-model.md, run against the cited
 * fixture graph.
 */
import { describe, expect, it } from "vitest";
import { type Query, resolve } from "../../src/resolve";
import { validateGraph } from "../../src/validate";
import { fixture } from "./fixture";

function ask(node: string, date: string, country = "GB", extra: Partial<Query> = {}) {
  return resolve(fixture, { node, date, country, ...extra });
}

/** Each path as grade, entity chain and indicative share, for readable assertions. */
function summary(node: string, date: string, country = "GB", extra: Partial<Query> = {}) {
  const result = ask(node, date, country, extra);
  return {
    outcome: result.outcome,
    paths: result.paths.map((p) => ({
      grade: p.grade,
      entities: p.entities,
      ...(p.effectiveSharePct === undefined ? {} : { share: p.effectiveSharePct }),
    })),
  };
}

it("the fixture is a valid graph", () => {
  expect(validateGraph(fixture)).toEqual([]);
});

describe("Nestle and L'Oreal", () => {
  it("links L'Oreal to Nestle through a stake, not ownership", () => {
    expect(summary("entity:loreal", "2026-11-07")).toEqual({
      outcome: "linked",
      paths: [{ grade: "stake", entities: ["entity:loreal", "entity:nestle"], share: 20.16 }],
    });
  });

  it("drops the stake when the threshold is set above it", () => {
    expect(ask("entity:loreal", "2026-11-07", "GB", { minStakePct: 25 }).outcome).toBe("no-link");
  });
});

describe("Starbucks at home", () => {
  it("is owned by Starbucks and licensed to Nestle", () => {
    const result = ask("brand:starbucks", "2026-11-07");
    expect(summary("brand:starbucks", "2026-11-07")).toEqual({
      outcome: "linked",
      paths: [
        { grade: "owned", entities: ["entity:starbucks"] },
        { grade: "licensed", entities: ["entity:nestle"] },
      ],
    });
    expect(result.paths[1]?.links[0]?.coverage).toContain("not ready-to-drink");
  });

  it("had no Nestle link before the licence", () => {
    expect(summary("brand:starbucks", "2018-01-15")).toEqual({
      outcome: "no-link",
      paths: [{ grade: "owned", entities: ["entity:starbucks"] }],
    });
  });
});

describe("Coca-Cola and Monster", () => {
  it("links Monster to Coca-Cola through a 16.7% stake in 2020", () => {
    expect(summary("entity:monster", "2020-06-01").paths).toEqual([
      { grade: "stake", entities: ["entity:monster", "entity:coca-cola"], share: 16.7 },
    ]);
  });

  it("links Monster to Coca-Cola through a 21% stake in 2026", () => {
    expect(summary("entity:monster", "2026-11-07")).toEqual({
      outcome: "linked",
      paths: [{ grade: "stake", entities: ["entity:monster", "entity:coca-cola"], share: 21 }],
    });
  });
});

describe("Coca-Cola, Costa and Innocent", () => {
  it("has Costa owned by Coca-Cola, but not before January 2019", () => {
    expect(summary("entity:costa", "2026-11-07").paths).toEqual([
      { grade: "owned", entities: ["entity:costa", "entity:coca-cola"] },
    ]);
    expect(ask("entity:costa", "2018-12-31").outcome).toBe("no-link");
  });

  it("has Innocent owned by Coca-Cola", () => {
    expect(summary("entity:innocent", "2026-11-07")).toEqual({
      outcome: "linked",
      paths: [{ grade: "owned", entities: ["entity:innocent", "entity:coca-cola"] }],
    });
  });
});

describe("PepsiCo and Tropicana", () => {
  const owner = ["entity:tropicana-brands-group", "entity:pai-partners"];
  const stake = ["entity:tropicana-brands-group", "entity:pepsico"];

  it("is owned by PAI Partners' company, with a 39% PepsiCo stake, outside the US", () => {
    expect(summary("brand:tropicana", "2026-11-07", "GB")).toEqual({
      outcome: "linked",
      paths: [
        { grade: "owned", entities: owner },
        { grade: "stake", entities: stake, share: 39 },
      ],
    });
  });

  it("is also distributed by PepsiCo in the US", () => {
    expect(summary("brand:tropicana", "2026-11-07", "US").paths).toEqual([
      { grade: "owned", entities: owner },
      { grade: "stake", entities: stake, share: 39 },
      { grade: "distributed", entities: ["entity:pepsico"] },
    ]);
  });

  it("was owned by PepsiCo in 2021", () => {
    expect(summary("brand:tropicana", "2021-06-01", "US")).toEqual({
      outcome: "linked",
      paths: [{ grade: "owned", entities: ["entity:pepsico"] }],
    });
  });

  it("is approximate in the month the sale closed", () => {
    expect(ask("brand:tropicana", "2022-01-20", "US").approximate).toBe(true);
  });
});

describe("Persil", () => {
  it.each(["GB", "IE", "FR"])("is Unilever's in %s", (country) => {
    expect(summary("brand:persil", "2026-11-07", country)).toEqual({
      outcome: "linked",
      paths: [{ grade: "owned", entities: ["entity:unilever"] }],
    });
  });

  it("is Henkel's in Germany, with no link", () => {
    expect(summary("brand:persil", "2026-11-07", "DE")).toEqual({
      outcome: "no-link",
      paths: [{ grade: "owned", entities: ["entity:henkel"] }],
    });
  });

  it("is unknown where no owner is recorded", () => {
    expect(ask("brand:persil", "2026-11-07", "ES").outcome).toBe("unknown");
  });
});

describe("Ben & Jerry's", () => {
  const company = "entity:ben-and-jerrys-homemade";

  it("was owned by Unilever before the demerger", () => {
    expect(summary("brand:ben-and-jerrys", "2025-11-15")).toEqual({
      outcome: "linked",
      paths: [{ grade: "owned", entities: [company, "entity:unilever"] }],
    });
  });

  it("is owned by The Magnum Ice Cream Company afterwards, with a 19.9% Unilever stake", () => {
    expect(summary("brand:ben-and-jerrys", "2026-11-07")).toEqual({
      outcome: "linked",
      paths: [
        {
          grade: "stake",
          entities: [company, "entity:magnum-ice-cream-company", "entity:unilever"],
          share: 19.9,
        },
      ],
    });
  });
});

describe("Kellogg's", () => {
  const brandOwner = { grade: "owned", entities: ["entity:kellanova", "entity:mars"] };

  it("is Mars's brand in the UK", () => {
    expect(summary("brand:kelloggs", "2026-11-07", "GB")).toEqual({
      outcome: "linked",
      paths: [brandOwner],
    });
  });

  it("is also made under licence by Ferrero's WK Kellogg Co in the US", () => {
    expect(summary("brand:kelloggs", "2026-11-07", "US")).toEqual({
      outcome: "linked",
      paths: [
        brandOwner,
        { grade: "licensed", entities: ["entity:wk-kellogg-co", "entity:ferrero"] },
      ],
    });
  });

  it("had no link before Mars bought Kellanova", () => {
    expect(summary("brand:kelloggs", "2025-06-01", "GB")).toEqual({
      outcome: "no-link",
      paths: [{ grade: "owned", entities: ["entity:kellanova"] }],
    });
  });

  it("is approximate in the month Mars completed", () => {
    expect(ask("brand:kelloggs", "2025-12-09", "GB").approximate).toBe(true);
  });
});

describe("Unknown", () => {
  it("is unknown for a brand not in the graph", () => {
    expect(ask("brand:not-recorded", "2026-11-07")).toEqual({
      outcome: "unknown",
      paths: [],
      approximate: false,
    });
  });
});
