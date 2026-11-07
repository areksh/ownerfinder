import { describe, expect, it } from "vitest";
import { COUNTRY_CODES, isCountryCode } from "../src/countries";
import { graphSchema } from "../src/schema";

function validGraph() {
  return {
    entities: [
      { id: "entity:holder", name: "Holder plc", identifiers: { lei: "5493001KJTIIGC8Y1R12" } },
      { id: "entity:held", name: "Held Ltd" },
    ],
    brands: [{ id: "brand:fizz", name: "Fizz", aliases: ["Fizzy"] }],
    relationships: [
      {
        id: "relationship:holder-held",
        type: "holds_stake",
        from: "entity:holder",
        to: "entity:held",
        stakePct: 20,
        validFrom: "2015-06",
        scope: { include: "world", exclude: ["FR"] },
        sources: ["source:report"],
      },
    ],
    sources: [
      {
        id: "source:report",
        url: "https://example.org/report.pdf",
        title: "Annual report",
        publisher: "Holder plc",
        published: "2025",
        retrieved: "2026-11-07",
      },
    ],
    criteria: [{ id: "criterion:example", name: "Example", description: "An example." }],
    listings: [
      {
        entity: "entity:holder",
        evidence: [
          {
            criterion: "criterion:example",
            summary: "Alleged by an example party.",
            status: "alleged",
            date: "2025-03",
            sources: ["source:report"],
          },
        ],
      },
    ],
  };
}

type Graph = ReturnType<typeof validGraph>;

function rejects(change: (graph: Graph) => void): void {
  const graph = validGraph();
  change(graph);
  expect(graphSchema.safeParse(graph).success).toBe(false);
}

describe("graphSchema", () => {
  it("accepts a well-formed graph", () => {
    expect(graphSchema.safeParse(validGraph()).success).toBe(true);
  });

  it("rejects an id with the wrong prefix", () => {
    rejects((g) => {
      g.entities[0] = { ...g.entities[0], id: "company:holder" } as never;
    });
  });

  it("rejects an id with upper case or spaces", () => {
    rejects((g) => {
      g.brands[0] = { ...g.brands[0], id: "brand:Fizz Pop" } as never;
    });
  });

  it("rejects an unknown or lower-case country code", () => {
    rejects((g) => {
      g.relationships[0] = { ...g.relationships[0], scope: { include: ["XX"] } } as never;
    });
    rejects((g) => {
      g.relationships[0] = { ...g.relationships[0], scope: { include: ["gb"] } } as never;
    });
  });

  it("rejects an empty country list", () => {
    rejects((g) => {
      g.relationships[0] = { ...g.relationships[0], scope: { include: [] } } as never;
    });
  });

  it("rejects a source URL that is not https", () => {
    rejects((g) => {
      g.sources[0] = { ...g.sources[0], url: "http://example.org/report.pdf" } as never;
    });
  });

  it("rejects a malformed partial date", () => {
    rejects((g) => {
      g.relationships[0] = { ...g.relationships[0], validFrom: "June 2015" } as never;
    });
  });

  it("rejects a retrieval date without a day", () => {
    rejects((g) => {
      g.sources[0] = { ...g.sources[0], retrieved: "2026-11" } as never;
    });
  });

  it("rejects an unknown relationship type", () => {
    rejects((g) => {
      g.relationships[0] = { ...g.relationships[0], type: "subsidiary_of" } as never;
    });
  });

  it("rejects an unknown evidence status", () => {
    rejects((g) => {
      const listing = g.listings[0];
      if (listing === undefined) throw new Error("fixture");
      listing.evidence[0] = { ...listing.evidence[0], status: "proven" } as never;
    });
  });

  it("rejects fields the model does not define", () => {
    rejects((g) => {
      g.entities[1] = { ...g.entities[1], owner: "entity:holder" } as never;
    });
  });
});

describe("country codes", () => {
  it("are the 249 assigned ISO 3166-1 alpha-2 codes, each known to Unicode CLDR", () => {
    const names = new Intl.DisplayNames(["en"], { type: "region", fallback: "none" });
    expect(new Set(COUNTRY_CODES).size).toBe(249);
    for (const code of COUNTRY_CODES) {
      expect(names.of(code), code).toBeDefined();
    }
  });

  it("recognise real codes only", () => {
    expect(isCountryCode("GB")).toBe(true);
    expect(isCountryCode("UK")).toBe(false);
    expect(isCountryCode("EU")).toBe(false);
  });
});
