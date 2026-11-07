/**
 * A small graph for the acceptance cases in docs/data-model.md. Every
 * relationship cites the document its figures and dates come from, read
 * on the retrieval date. Where a document states a figure at a date
 * rather than over a period, the relationship starts at that date and
 * its note says so. The listings exist only to make the paths visible:
 * their evidence is a placeholder, not a claim about any company.
 */
import type { Graph, Relationship } from "../../src/schema.ts";

const RETRIEVED = "2026-11-07";
const EXAMPLE = "criterion:example";

const sources: Graph["sources"] = [
  {
    id: "source:loreal-urd-2025",
    url: "https://www.loreal-finance.com/eng/2025-universal-registration-document/en/article/9/",
    title: "2025 Universal Registration Document",
    publisher: "L'Oreal",
    published: "2026",
    retrieved: RETRIEVED,
  },
  {
    id: "source:starbucks-nestle-close-2018",
    url: "https://investor.starbucks.com/news/financial-releases/news-details/2018/Nestl-and-Starbucks-Close-Deal-for-the-Perpetual-Global-License-of-Starbucks-Consumer-Packaged-Goods-and-Foodservice-Products/default.aspx",
    title:
      "Nestle and Starbucks Close Deal for the Perpetual Global License of Starbucks Consumer Packaged Goods and Foodservice Products",
    publisher: "Starbucks Corporation",
    published: "2018-08-28",
    retrieved: RETRIEVED,
  },
  {
    id: "source:wikipedia-starbucks",
    url: "https://en.wikipedia.org/wiki/Starbucks",
    title: "Starbucks",
    publisher: "Wikipedia",
    retrieved: RETRIEVED,
    licence: "CC BY-SA 4.0",
  },
  {
    id: "source:monster-8k-2015",
    url: "https://www.sec.gov/Archives/edgar/data/0000865752/000110465915045160/a15-14058_1ex99d1.htm",
    title:
      "The Coca-Cola Company and Monster Beverage Corporation Close on Previously Announced Strategic Partnership (Form 8-K, Exhibit 99.1)",
    publisher: "Monster Beverage Corporation",
    published: "2015-06-12",
    retrieved: RETRIEVED,
  },
  {
    id: "source:coca-cola-10k-2025",
    url: "https://www.sec.gov/Archives/edgar/data/21344/000162828026010047/ko-20251231.htm",
    title: "Form 10-K for the fiscal year ended December 31, 2025 (equity method investments)",
    publisher: "The Coca-Cola Company",
    published: "2026-02",
    retrieved: RETRIEVED,
  },
  {
    id: "source:coca-cola-costa-2019",
    url: "https://investors.coca-colacompany.com/news-events/press-releases/detail/958/the-coca-cola-company-completes-acquisition-of-costa-from-whitbread-plc",
    title: "The Coca-Cola Company Completes Acquisition of Costa from Whitbread PLC",
    publisher: "The Coca-Cola Company",
    published: "2019-01-03",
    retrieved: RETRIEVED,
  },
  {
    id: "source:marketing-week-innocent-2010",
    url: "https://www.marketingweek.com/coca-cola-becomes-majority-shareholder-in-innocent/",
    title: "Coca-Cola becomes majority shareholder in Innocent",
    publisher: "Marketing Week",
    published: "2010-04",
    retrieved: RETRIEVED,
  },
  {
    id: "source:marketing-week-innocent-2013",
    url: "https://www.marketingweek.com/coke-increases-stake-in-innocent-to-near-100/",
    title: "Coke increases stake in Innocent to near 100%",
    publisher: "Marketing Week",
    published: "2013-02",
    retrieved: RETRIEVED,
  },
  {
    id: "source:wikipedia-tropicana",
    url: "https://en.wikipedia.org/wiki/Tropicana_Products",
    title: "Tropicana Products",
    publisher: "Wikipedia",
    retrieved: RETRIEVED,
    licence: "CC BY-SA 4.0",
  },
  {
    id: "source:pai-tropicana-2021",
    url: "https://paipartners.com/wp-content/uploads/2021/08/press-release-pai-partners-tropicana-pepsi-3-august-2021.pdf",
    title: "PAI Partners to acquire Tropicana, Naked and other select juice brands from PepsiCo",
    publisher: "PAI Partners",
    published: "2021-08-03",
    retrieved: RETRIEVED,
  },
  {
    id: "source:tropicana-brands-group-2022",
    url: "https://www.businesswire.com/news/home/20220203005926/en",
    title: "Tropicana Brands Group launches following PAI Partners' acquisition of juice brands",
    publisher: "Business Wire",
    published: "2022-02-03",
    retrieved: RETRIEVED,
  },
  {
    id: "source:wikipedia-persil",
    url: "https://en.wikipedia.org/wiki/Persil",
    title: "Persil",
    publisher: "Wikipedia",
    retrieved: RETRIEVED,
    licence: "CC BY-SA 4.0",
  },
  {
    id: "source:persil-uk-about",
    url: "https://www.persil.com/uk/about-persil.html",
    title: "About Persil",
    publisher: "Unilever",
    retrieved: RETRIEVED,
  },
  {
    id: "source:wikipedia-ben-and-jerrys",
    url: "https://en.wikipedia.org/wiki/Ben_%26_Jerry%27s",
    title: "Ben & Jerry's",
    publisher: "Wikipedia",
    retrieved: RETRIEVED,
    licence: "CC BY-SA 4.0",
  },
  {
    id: "source:tmicc-investor-faq",
    url: "https://corporate.magnumicecream.com/en/investors/faq.html",
    title: "Investor FAQ",
    publisher: "The Magnum Ice Cream Company",
    retrieved: RETRIEVED,
  },
  {
    id: "source:kellogg-brand-agreement-2023",
    url: "https://www.sec.gov/Archives/edgar/data/55067/000119312523249062/d517693dex104.htm",
    title:
      "Master Ownership and License Agreement Regarding Trademarks and Certain Related Intellectual Property (Exhibit 10.4)",
    publisher: "Kellogg Company",
    published: "2023-09-29",
    retrieved: RETRIEVED,
  },
  {
    id: "source:ferrero-wk-kellogg-2025",
    url: "https://newsroom.wkkellogg.com/2025-09-26-FERRERO-COMPLETES-ACQUISITION-OF-WK-KELLOGG-CO",
    title: "Ferrero Completes Acquisition of WK Kellogg Co",
    publisher: "WK Kellogg Co",
    published: "2025-09-26",
    retrieved: RETRIEVED,
  },
  {
    id: "source:mars-kellanova-2025",
    url: "https://supermarketnews.co.nz/global/mars-completes-acquisition-of-kellanova/",
    title: "Mars Completes Acquisition of Kellanova",
    publisher: "Supermarket News",
    published: "2025-12-12",
    retrieved: RETRIEVED,
  },
];

function r(
  id: string,
  type: Relationship["type"],
  from: string,
  to: string,
  validFrom: string,
  sourceIds: string[],
  extra: Partial<Relationship> = {},
): Relationship {
  return {
    id: `relationship:${id}`,
    type,
    from: `entity:${from}`,
    to,
    validFrom,
    scope: { include: "world" },
    sources: sourceIds.map((s) => `source:${s}`),
    ...extra,
  };
}

const relationships: Relationship[] = [
  // Nestle and L'Oreal: a stake, not ownership.
  r("nestle-loreal", "holds_stake", "nestle", "entity:loreal", "2025-12-31", ["loreal-urd-2025"], {
    stakePct: 20.16,
    note: "Stated at 31 December 2025. Nestle has held a stake since long before; earlier percentages are not recorded here.",
  }),

  // Starbucks at home: Nestle sells it under licence; Starbucks owns the brand.
  r("starbucks-brand", "owns_brand", "starbucks", "brand:starbucks", "1971", [
    "wikipedia-starbucks",
  ]),
  r(
    "nestle-starbucks-licence",
    "licenses_brand",
    "nestle",
    "brand:starbucks",
    "2018-08-28",
    ["starbucks-nestle-close-2018"],
    {
      coverage:
        "Starbucks packaged coffee, tea and foodservice products; not ready-to-drink drinks or anything sold in Starbucks shops.",
    },
  ),

  // Coca-Cola and Monster: successive stakes.
  r(
    "coca-cola-monster-2015",
    "holds_stake",
    "coca-cola",
    "entity:monster",
    "2015-06-12",
    ["monster-8k-2015"],
    {
      stakePct: 16.7,
      validTo: "2025-12-31",
      note: "16.7% at completion. The stake rose over time as Monster bought back shares; intermediate figures are not recorded here.",
    },
  ),
  r(
    "coca-cola-monster-2025",
    "holds_stake",
    "coca-cola",
    "entity:monster",
    "2025-12-31",
    ["coca-cola-10k-2025"],
    {
      stakePct: 21,
      note: "Stated at 31 December 2025.",
    },
  ),

  // Coca-Cola, Costa and Innocent: ownership.
  r(
    "coca-cola-costa",
    "owns",
    "coca-cola",
    "entity:costa",
    "2019-01-03",
    ["coca-cola-costa-2019"],
    {
      stakePct: 100,
    },
  ),
  r(
    "coca-cola-innocent-2010",
    "owns",
    "coca-cola",
    "entity:innocent",
    "2010-04",
    ["marketing-week-innocent-2010"],
    {
      stakePct: 58,
      validTo: "2013-02",
    },
  ),
  r(
    "coca-cola-innocent-2013",
    "owns",
    "coca-cola",
    "entity:innocent",
    "2013-02",
    ["marketing-week-innocent-2013"],
    {
      note: "More than 90 per cent; the report gives 90 to 99 per cent, with the founders keeping a minority.",
    },
  ),

  // PepsiCo and Tropicana: sold, with a stake and US distribution kept.
  r(
    "pepsico-tropicana-brand",
    "owns_brand",
    "pepsico",
    "brand:tropicana",
    "1998",
    ["wikipedia-tropicana"],
    {
      validTo: "2022-01",
    },
  ),
  r(
    "tbg-tropicana-brand",
    "owns_brand",
    "tropicana-brands-group",
    "brand:tropicana",
    "2022-01",
    ["tropicana-brands-group-2022"],
    {
      note: "The sale closed at the end of January 2022.",
    },
  ),
  r(
    "pai-tbg",
    "owns",
    "pai-partners",
    "entity:tropicana-brands-group",
    "2022-01",
    ["pai-tropicana-2021", "tropicana-brands-group-2022"],
    {
      stakePct: 61,
    },
  ),
  r(
    "pepsico-tbg",
    "holds_stake",
    "pepsico",
    "entity:tropicana-brands-group",
    "2022-01",
    ["pai-tropicana-2021", "tropicana-brands-group-2022"],
    {
      stakePct: 39,
    },
  ),
  r(
    "pepsico-tropicana-distribution",
    "distributes",
    "pepsico",
    "brand:tropicana",
    "2022-01",
    ["pai-tropicana-2021"],
    {
      scope: { include: ["US"] },
      coverage:
        "Exclusive US distribution of small-format and foodservice chilled products through PepsiCo's direct-store-delivery system.",
    },
  ),

  // Persil: a different owner by country.
  r(
    "unilever-persil",
    "owns_brand",
    "unilever",
    "brand:persil",
    "1931",
    ["wikipedia-persil", "persil-uk-about"],
    {
      scope: { include: ["GB", "IE", "FR"] },
      note: "The source dates the French and British rights to 1927 and the British to 1931; the later year is used until a primary source settles it. Unilever's other Persil markets are not recorded here.",
    },
  ),
  r("henkel-persil", "owns_brand", "henkel", "brand:persil", "1907-06-06", ["wikipedia-persil"], {
    scope: { include: ["DE"] },
    note: "Recorded for Germany only until Henkel's other markets are confirmed.",
  }),

  // Ben & Jerry's: from Unilever to The Magnum Ice Cream Company.
  r(
    "ben-and-jerrys-brand",
    "owns_brand",
    "ben-and-jerrys-homemade",
    "brand:ben-and-jerrys",
    "1978",
    ["wikipedia-ben-and-jerrys"],
  ),
  r(
    "unilever-ben-and-jerrys",
    "owns",
    "unilever",
    "entity:ben-and-jerrys-homemade",
    "2000-04",
    ["wikipedia-ben-and-jerrys"],
    {
      validTo: "2025-12-06",
    },
  ),
  r(
    "tmicc-ben-and-jerrys",
    "owns",
    "magnum-ice-cream-company",
    "entity:ben-and-jerrys-homemade",
    "2025-12-06",
    ["tmicc-investor-faq"],
  ),
  r(
    "unilever-tmicc",
    "holds_stake",
    "unilever",
    "entity:magnum-ice-cream-company",
    "2025-12-06",
    ["tmicc-investor-faq"],
    {
      stakePct: 19.9,
      note: "Retained at the demerger; Unilever intends to sell it down.",
    },
  ),

  // Kellogg's: Mars's brand everywhere, Ferrero's licence in North America.
  r(
    "kellanova-kelloggs",
    "owns_brand",
    "kellanova",
    "brand:kelloggs",
    "2023-09-29",
    ["kellogg-brand-agreement-2023"],
    {
      note: "Ownership stated by the agreement; earlier history is not recorded here.",
    },
  ),
  r(
    "wk-kellogg-kelloggs",
    "licenses_brand",
    "wk-kellogg-co",
    "brand:kelloggs",
    "2023-10",
    ["kellogg-brand-agreement-2023"],
    {
      scope: { include: ["US", "CA"] },
      coverage:
        "Exclusive, perpetual licence of the KELLOGG'S house mark in North America for the food categories set out in the agreement. Caribbean territories are not recorded here.",
    },
  ),
  r("mars-kellanova", "owns", "mars", "entity:kellanova", "2025-12", ["mars-kellanova-2025"], {
    note: "Approvals were complete on 8 December 2025 and completion was announced days later.",
  }),
  r(
    "ferrero-wk-kellogg",
    "owns",
    "ferrero",
    "entity:wk-kellogg-co",
    "2025-09-26",
    ["ferrero-wk-kellogg-2025"],
    {
      stakePct: 100,
    },
  ),
];

const entities: Array<[string, string]> = [
  ["nestle", "Nestle S.A."],
  ["loreal", "L'Oreal S.A."],
  ["starbucks", "Starbucks Corporation"],
  ["coca-cola", "The Coca-Cola Company"],
  ["monster", "Monster Beverage Corporation"],
  ["costa", "Costa Limited"],
  ["innocent", "Fresh Trading Ltd (innocent)"],
  ["pepsico", "PepsiCo, Inc."],
  ["pai-partners", "PAI Partners"],
  ["tropicana-brands-group", "Tropicana Brands Group"],
  ["unilever", "Unilever PLC"],
  ["henkel", "Henkel AG & Co. KGaA"],
  ["ben-and-jerrys-homemade", "Ben & Jerry's Homemade, Inc."],
  ["magnum-ice-cream-company", "The Magnum Ice Cream Company N.V."],
  ["kellanova", "Kellanova"],
  ["wk-kellogg-co", "WK Kellogg Co"],
  ["mars", "Mars, Incorporated"],
  ["ferrero", "Ferrero International S.A."],
];

const brands: Array<[string, string]> = [
  ["starbucks", "Starbucks"],
  ["tropicana", "Tropicana"],
  ["persil", "Persil"],
  ["ben-and-jerrys", "Ben & Jerry's"],
  ["kelloggs", "Kellogg's"],
];

/** The groups the cases are about, each with the source its case cites. */
const listed: Array<[string, string]> = [
  ["nestle", "loreal-urd-2025"],
  ["coca-cola", "coca-cola-10k-2025"],
  ["pepsico", "pai-tropicana-2021"],
  ["unilever", "tmicc-investor-faq"],
  ["mars", "mars-kellanova-2025"],
  ["ferrero", "ferrero-wk-kellogg-2025"],
];

export const fixture: Graph = {
  entities: entities.map(([id, name]) => ({ id: `entity:${id}`, name })),
  brands: brands.map(([id, name]) => ({ id: `brand:${id}`, name })),
  relationships,
  sources,
  criteria: [
    {
      id: EXAMPLE,
      name: "Example",
      description: "A placeholder criterion for the acceptance tests.",
    },
  ],
  listings: listed.map(([id, source]) => ({
    entity: `entity:${id}`,
    evidence: [
      {
        criterion: EXAMPLE,
        summary: "Placeholder evidence for the acceptance tests; not a claim about the company.",
        status: "alleged",
        date: "2026",
        sources: [`source:${source}`],
      },
    ],
  })),
};
