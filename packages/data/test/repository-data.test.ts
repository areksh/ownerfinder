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

function chains(node: string, country: string, date = "2026-11-07") {
  if (graph === undefined) throw new Error("data/ is invalid");
  return resolve(graph, { node, date, country }).paths.map(
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

  it("Camel is Japan Tobacco's outside the US, and BAT's inside it, made by R.J. Reynolds", () => {
    expect(chains("brand:camel", "GB", "2026-11-08")).toEqual(["owned: entity:japan-tobacco"]);
    expect(chains("brand:camel", "US", "2026-11-08")).toEqual([
      "owned: entity:british-american-tobacco",
      "distributed: entity:rj-reynolds-tobacco > entity:reynolds-american > entity:british-american-tobacco",
    ]);
  });

  it("DiGiorno shows Nestle's ownership and every company it is sold through in the US", () => {
    expect(chains("brand:digiorno", "US")).toEqual([
      "owned: entity:nestle",
      "distributed: entity:nestle-usa > entity:nestle-holdings > entity:nimco-us > entity:nestle",
    ]);
  });

  it("Cheerios is General Mills', made by Nestle's joint venture outside North America", () => {
    expect(chains("brand:cheerios", "GB")).toEqual([
      "owned: entity:general-mills",
      "licensed: entity:cereal-partners-worldwide > entity:nestle",
    ]);
    expect(chains("brand:cheerios", "US")).toEqual(["owned: entity:general-mills"]);
  });

  it("Haagen-Dazs is General Mills', under licence to Nestle and made by Froneri in the US", () => {
    // Froneri's brand page was read on 8 November 2026, so its link is known from then.
    expect(chains("brand:haagen-dazs", "US", "2026-11-08")).toEqual([
      "owned: entity:general-mills",
      "licensed: entity:nestle",
      "distributed: entity:froneri > entity:nestle",
    ]);
  });

  it("Rockstar is Celsius's in the US, distributed by PepsiCo, and PepsiCo's elsewhere", () => {
    expect(chains("brand:rockstar", "US")).toEqual([
      "owned: entity:celsius-holdings",
      "distributed: entity:pepsico",
    ]);
    expect(chains("brand:rockstar", "GB")).toEqual(["owned: entity:pepsico"]);
  });

  it("Black Magic is recorded as Nestle's only in the UK and Ireland, where its pages list it", () => {
    expect(chains("brand:black-magic", "IE", "2026-11-08")).toEqual(["owned: entity:nestle"]);
    expect(chains("brand:black-magic", "FR", "2026-11-08")).toEqual([]);
  });

  it("Monsanto is Bayer's from the merger on 7 June 2018", () => {
    expect(chains("entity:monsanto", "US", "2018-06-06")).toEqual(["undefined: entity:monsanto"]);
    expect(chains("entity:monsanto", "US", "2018-06-07")).toEqual([
      "owned: entity:monsanto > entity:bayer",
    ]);
  });

  it("Horlicks is Unilever's in the Asian markets it bought in 2020, not everywhere", () => {
    expect(chains("brand:horlicks", "IN", "2026-11-08")).toEqual([
      "owned: entity:unilever",
      "distributed: entity:hindustan-unilever > entity:unilever",
    ]);
    expect(chains("brand:horlicks", "IN", "2020-03-31")).toEqual([]);
    expect(chains("brand:horlicks", "GB", "2026-11-08")).toEqual([]);
  });

  it("Aashirvaad is ITC's in India, in which BAT holds a stake", () => {
    expect(chains("brand:aashirvaad", "IN", "2026-11-08")).toEqual([
      "stake: entity:itc > entity:british-american-tobacco",
    ]);
  });

  it("Marmite is recorded as Unilever's only in the UK, where its brand page lists it", () => {
    expect(chains("brand:marmite", "GB", "2026-11-08")).toEqual(["owned: entity:unilever"]);
    expect(chains("brand:marmite", "US", "2026-11-08")).toEqual([]);
  });

  it("Lipton in India is Unilever's, sold by Hindustan Unilever, and unrecorded elsewhere", () => {
    expect(chains("brand:lipton", "IN", "2026-11-08")).toEqual([
      "owned: entity:unilever",
      "distributed: entity:hindustan-unilever > entity:unilever",
    ]);
    expect(chains("brand:lipton", "GB", "2026-11-08")).toEqual([]);
  });

  it("Minimalist is Hindustan Unilever's, which Unilever controls with 61.9%", () => {
    expect(chains("brand:minimalist", "IN")).toEqual([
      "owned: entity:hindustan-unilever > entity:unilever",
    ]);
  });

  it("Persil is Unilever's in France and Henkel's in Germany", () => {
    expect(chains("brand:persil", "FR")).toEqual(["owned: entity:unilever"]);
    expect(chains("brand:persil", "DE")).toEqual(["owned: entity:henkel"]);
  });

  it("Persil is Henkel's in the other markets Henkel runs Persil sites for", () => {
    expect(chains("brand:persil", "PL", "2026-11-08")).toEqual(["owned: entity:henkel"]);
    expect(chains("brand:persil", "US", "2026-11-08")).toEqual(["owned: entity:henkel"]);
    expect(chains("brand:persil", "GB", "2026-11-08")).toEqual(["owned: entity:unilever"]);
  });
});
