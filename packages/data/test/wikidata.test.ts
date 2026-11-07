import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { parseProposal, proposalYaml, slugify } from "../src/wikidata.ts";
import { proposalQuery } from "../src/wikidata-query.ts";

/** Recorded on 2026-11-07 from query.wikidata.org with proposalQuery("Q160746"). */
const RESPONSE: unknown = JSON.parse(
  await readFile(join(import.meta.dirname, "fixtures/wikidata/Q160746.json"), "utf8"),
);

const proposal = parseProposal("Q160746", RESPONSE, "2026-11-07");

function relationshipsTo(id: string) {
  return proposal.relationships.filter((r) => r.to === id);
}

describe("proposalQuery", () => {
  it("refuses anything but an item id", () => {
    expect(() => proposalQuery("Q1 } DROP")).toThrow(RangeError);
    expect(proposalQuery("Q160746")).toContain("wd:Q160746");
  });
});

describe("slugify", () => {
  it("folds accents and punctuation into a lower-case slug", () => {
    expect(slugify("Nestlé")).toBe("nestle");
    expect(slugify("Café El Águila")).toBe("cafe-el-aguila");
    expect(slugify("L'Oréal")).toBe("l-oreal");
    expect(slugify("Ben & Jerry's")).toBe("ben-jerry-s");
    expect(slugify("  ")).toBe("");
  });
});

describe("parseProposal on Nestle", () => {
  it("proposes the organisation itself with its Wikidata id", () => {
    expect(proposal.entities[0]).toEqual({
      id: "entity:nestle",
      name: "Nestlé",
      identifiers: { wikidata: "Q160746" },
    });
  });

  it("leaves out patents", () => {
    expect(proposal.skipped.patents).toBe(138);
    expect(proposal.entities.some((e) => /patent/i.test(e.name))).toBe(false);
  });

  it("keeps each stated L'Oreal share as its own stake, as a percentage", () => {
    const stakes = relationshipsTo("entity:l-oreal").map((r) => [r.type, r.stakePct, r.validFrom]);
    expect(stakes).toEqual(
      expect.arrayContaining([
        ["holds_stake", 26.38, "2004"],
        ["holds_stake", 23.29, "2014"],
        ["holds_stake", 20.08, undefined],
      ]),
    );
    expect(stakes).toHaveLength(3);
  });

  it("reads a share given as 100 and one given as 1 both as outright ownership", () => {
    const czech = relationshipsTo("entity:nestle-cesko").find((r) => r.validFrom === "2009");
    expect(czech).toMatchObject({ type: "owns", stakePct: 100, validTo: "2020" });
    const wagner = relationshipsTo("entity:wagner-pizza")[0];
    expect(wagner).toMatchObject({ type: "owns", stakePct: 100, validFrom: "2012" });
  });

  it("treats a parent statement with a half share as a stake", () => {
    expect(relationshipsTo("entity:froneri")).toContainEqual(
      expect.objectContaining({ type: "holds_stake", stakePct: 50 }),
    );
  });

  it("proposes holders of the organisation, keeping month precision", () => {
    const blackrock = proposal.relationships.find((r) => r.from === "entity:blackrock");
    expect(blackrock).toMatchObject({
      type: "holds_stake",
      to: "entity:nestle",
      stakePct: 3.7,
      validFrom: "2009-12",
    });
  });

  it("proposes brands as brand ownership", () => {
    expect(proposal.brands).toContainEqual({ id: "brand:cafe-el-aguila", name: "Café El Águila" });
    expect(relationshipsTo("brand:cafe-el-aguila")[0]).toMatchObject({
      type: "owns_brand",
      from: "entity:nestle",
    });
  });

  it("cites Wikidata on every record and asks for a primary source", () => {
    expect(proposal.sources).toEqual([
      {
        id: "source:wikidata-q160746",
        url: "https://www.wikidata.org/wiki/Q160746",
        title: "Nestlé",
        publisher: "Wikidata",
        retrieved: "2026-11-07",
        licence: "CC0-1.0",
      },
    ]);
    for (const r of proposal.relationships) {
      expect(r.sources).toEqual(["source:wikidata-q160746"]);
      expect(r.note).toMatch(/verify against a primary source/i);
    }
  });

  it("gives every record a unique id", () => {
    const ids = [...proposal.entities, ...proposal.brands, ...proposal.relationships].map(
      (r) => r.id,
    );
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("names an item with no English label by its Wikidata id", () => {
    expect(proposal.entities).toContainEqual({
      id: "entity:q12009778",
      name: "Q12009778",
      identifiers: { wikidata: "Q12009778" },
    });
  });
});

describe("proposalYaml", () => {
  it("writes YAML that reads back as the proposal, under a warning", () => {
    const text = proposalYaml(proposal);
    expect(text.startsWith("# Proposal from Wikidata for Q160746 (Nestlé).")).toBe(true);
    const { entities, brands, relationships, sources } = proposal;
    expect(parse(text)).toEqual(
      JSON.parse(JSON.stringify({ entities, brands, relationships, sources })),
    );
  });
});
