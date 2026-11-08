/**
 * The repository's own data/: it must be valid, and a few answers that
 * depend on country scope are pinned so a careless edit shows up here.
 * When curation changes one of these answers on purpose, update the test
 * in the same change.
 */
import { join } from "node:path";
import { resolve } from "@ecf/model";
import { describe, expect, it } from "vitest";
import { checkData } from "../src/check.ts";

const { graph, problems } = await checkData(join(import.meta.dirname, "../../../data"));

function chains(node: string, country: string) {
  if (graph === undefined) throw new Error("data/ is invalid");
  return resolve(graph, { node, date: "2026-11-07", country }).paths.map(
    (p) => `${p.grade}: ${p.entities.join(" > ")}`,
  );
}

it("data/ is valid", () => {
  expect(problems).toEqual([]);
});

describe("answers that depend on the country", () => {
  it("KitKat is Nestle's, and made under licence by Hershey in the US", () => {
    expect(chains("brand:kitkat", "GB")).toEqual(["owned: entity:nestle"]);
    expect(chains("brand:kitkat", "US")).toEqual([
      "owned: entity:nestle",
      "licensed: entity:hershey",
    ]);
  });

  it("7UP is PepsiCo's outside the US, and Keurig Dr Pepper's inside it", () => {
    expect(chains("brand:7up", "GB")).toEqual(["owned: entity:pepsico"]);
    expect(chains("brand:7up", "US")).toEqual(["owned: entity:keurig-dr-pepper"]);
  });

  it("Kellogg's is Mars's through Kellanova, and Ferrero's licence in the US", () => {
    expect(chains("brand:kelloggs", "GB")).toEqual(["owned: entity:kellanova > entity:mars"]);
    expect(chains("brand:kelloggs", "US")).toEqual([
      "owned: entity:kellanova > entity:mars",
      "licensed: entity:wk-kellogg-co > entity:ferrero",
    ]);
  });

  it("Marlboro is Philip Morris International's outside the US, and Altria's inside it", () => {
    expect(chains("brand:marlboro", "GB")).toEqual(["owned: entity:philip-morris-international"]);
    expect(chains("brand:marlboro", "US")).toEqual([
      "owned: entity:philip-morris-usa > entity:altria",
    ]);
  });

  it("Persil is Unilever's in France and Henkel's in Germany", () => {
    expect(chains("brand:persil", "FR")).toEqual(["owned: entity:unilever"]);
    expect(chains("brand:persil", "DE")).toEqual(["owned: entity:henkel"]);
  });
});
