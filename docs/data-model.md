# Data model

This document specifies the relationship graph behind every lookup: what
is stored, the rules a valid graph obeys, and how a lookup is answered.
The decision to model ownership this way is recorded in
[ADR 10](adr/0010-relationship-graph-data-model.md). The code lives in
`packages/model`.

## Principles

- **A dated, scoped graph, not a tree.** A brand can be owned by one
  company, licensed to another and distributed by a third, and the
  answer changes with the date and the country asked about.
- **Every link has a source.** A relationship or piece of evidence with
  no source is invalid and is never stored.
- **Three honest outcomes.** A lookup is _linked_ to a listed company,
  _known with no link_, or _unknown_. The service never says a brand is
  "clean": a missing link may only be missing data.
- **One resolver.** The same TypeScript resolver answers lookups in
  tests, in the data build and in the API. SQL may fetch candidate
  records, but it never decides the answer.

## Records

A graph holds six kinds of record:
`{ entities, brands, relationships, sources, criteria, listings }`. Every
record has an `id` that is unique across the whole graph and starts with
its kind:

| Kind         | Prefix          | Example                           |
| ------------ | --------------- | --------------------------------- |
| Entity       | `entity:`       | `entity:nestle`                   |
| Brand        | `brand:`        | `brand:persil`                    |
| Relationship | `relationship:` | `relationship:nestle-loreal-2025` |
| Source       | `source:`       | `source:loreal-urd-2025`          |
| Criterion    | `criterion:`    | `criterion:example`               |

After the prefix an id is lower-case ASCII letters, digits and hyphens.
Listings are keyed by the entity they list.

### Entity

A legal company or other organisation.

| Field         | Required | Meaning                                                                                                       |
| ------------- | -------- | ------------------------------------------------------------------------------------------------------------- |
| `id`          | yes      | `entity:` id.                                                                                                 |
| `name`        | yes      | Current legal or best-known name.                                                                             |
| `identifiers` | no       | Any of `lei`, `wikidata` (`Q123`), `companiesHouse`, `secCik`, `openCorporates`. Used to match ingested data. |

### Brand

A name products are sold under. A brand is not a company: it is owned,
licensed and distributed by companies.

| Field     | Required | Meaning                      |
| --------- | -------- | ---------------------------- |
| `id`      | yes      | `brand:` id.                 |
| `name`    | yes      | Display name.                |
| `aliases` | no       | Other spellings, for search. |

### Relationship

A directed link from the **holder** (`from`, always an entity) to what it
holds (`to`).

| Type             | `to`   | Meaning                                                                             | `stakePct`                    |
| ---------------- | ------ | ----------------------------------------------------------------------------------- | ----------------------------- |
| `owns`           | entity | Controlling ownership.                                                              | optional, above 50            |
| `holds_stake`    | entity | A non-controlling shareholding.                                                     | required, above 0, at most 50 |
| `controls_board` | entity | Can appoint or control the board without majority ownership.                        | not allowed                   |
| `owns_brand`     | brand  | Owns the brand (the trade mark).                                                    | not allowed                   |
| `licenses_brand` | brand  | Makes or sells under the brand by licence; `coverage` says what the licence covers. | not allowed                   |
| `distributes`    | brand  | Distributes the brand's products.                                                   | not allowed                   |

Every relationship also has:

| Field       | Required | Meaning                                                                                                     |
| ----------- | -------- | ----------------------------------------------------------------------------------------------------------- |
| `id`        | yes      | `relationship:` id.                                                                                         |
| `validFrom` | yes      | Partial date the relationship began.                                                                        |
| `validTo`   | no       | Partial date it ended; absent means still in force. The relationship holds up to, not including, this date. |
| `scope`     | yes      | Where it applies (below).                                                                                   |
| `sources`   | yes      | One or more source ids.                                                                                     |
| `passive`   | no       | `holds_stake` only: an index-fund or similar holding with no influence. Default `false`.                    |
| `coverage`  | no       | Plain-language limits, for example which products a licence covers. Shown to the user, never parsed.        |
| `note`      | no       | Curator's note, for example that a percentage is a lower bound.                                             |

**Partial dates** are `YYYY`, `YYYY-MM` or `YYYY-MM-DD`, and the
precision is kept. A partial date stands for the first day of its period
when comparing; a query date that falls inside an imprecise boundary's
period gives an _approximate_ result (see Lookups).

**Scope** is `{ include, exclude? }`. `include` is `"world"` or a list of
ISO 3166-1 alpha-2 country codes (upper case). `exclude` is an optional
list of codes removed from `include`. A relationship applies in a country
when the country is included and not excluded.

### Source

| Field        | Required | Meaning                                                    |
| ------------ | -------- | ---------------------------------------------------------- |
| `id`         | yes      | `source:` id.                                              |
| `url`        | yes      | `https` URL of the document.                               |
| `title`      | yes      | Document title.                                            |
| `publisher`  | yes      | Who published it.                                          |
| `published`  | no       | Partial date of publication.                               |
| `retrieved`  | yes      | Full date (`YYYY-MM-DD`) the curator read it.              |
| `archiveUrl` | no       | `https` URL of an archived copy.                           |
| `licence`    | no       | Licence of the source's data, when data is reused from it. |

### Criterion

A reason a company may be listed. Criteria are data, so that users can
choose which ones they care about.

| Field         | Required | Meaning                   |
| ------------- | -------- | ------------------------- |
| `id`          | yes      | `criterion:` id.          |
| `name`        | yes      | Short name.               |
| `description` | yes      | What meets the criterion. |

### Listing

Puts an entity on the list, with the evidence for each criterion it
meets.

| Field      | Required | Meaning                     |
| ---------- | -------- | --------------------------- |
| `entity`   | yes      | The listed entity's id.     |
| `evidence` | yes      | One or more evidence items. |

Each evidence item has a `criterion` id, a `summary`, a `status`, a
partial `date` and one or more `sources`. The status says how established
the claim is, and the summary is worded to match:

| Status     | Meaning                                          |
| ---------- | ------------------------------------------------ |
| `alleged`  | Claimed by a credible party; not established.    |
| `found`    | Found by a court, regulator or official inquiry. |
| `settled`  | Settled without admission.                       |
| `admitted` | Admitted by the company.                         |

## Validation

`validateGraph(graph)` returns a list of issues, each with a `code`, the
offending record's id and a message. An empty list means the graph is
valid. The data build fails on any issue. The rules:

| Code                    | Rule                                                                                            |
| ----------------------- | ----------------------------------------------------------------------------------------------- |
| `shape`                 | A record has the fields and formats above (ids, dates, URLs, country codes).                    |
| `duplicate-id`          | Ids are unique across the graph; at most one listing per entity.                                |
| `dangling-reference`    | Every referenced id exists and has the expected kind.                                           |
| `wrong-target-kind`     | A relationship's `to` is an entity or a brand as its type requires.                             |
| `self-reference`        | A relationship does not point at its own holder.                                                |
| `stake-out-of-range`    | `stakePct` is present, absent or in range as the type table requires.                           |
| `passive-not-allowed`   | `passive` appears only on `holds_stake`.                                                        |
| `date-order`            | `validTo` is later than `validFrom`.                                                            |
| `missing-source`        | Every relationship and evidence item has at least one source.                                   |
| `overlapping-duplicate` | Two relationships of the same type between the same pair do not overlap in both time and scope. |

Successive stakes are recorded as successive relationships, each closed
when the next begins, so a stake's history stays visible.

## Lookups

`resolve(graph, query)` answers one question: how does this brand or
entity connect, on this date and in this country, to a listed company?

```ts
resolve(graph, {
  node: "brand:persil",
  date: "2026-11-07", // full date
  country: "GB", // ISO 3166-1 alpha-2
  criteria: undefined, // optional list of criterion ids; absent means all
  minStakePct: 5, // stakes below this are ignored
  includePassive: false, // passive stakes are ignored unless true
});
```

**Walking the graph.** Starting at `node`, the resolver follows
relationships backwards (from what is held to its holder) and keeps a
relationship only when it is in force on the date, applies in the
country, and, for a stake, is at least `minStakePct` and is not passive
unless `includePassive` is set. From a brand only brand relationships
apply; from an entity only entity relationships apply. The walk stops at
an entity with no further holders (an _ultimate holder_), guards against
cycles, and does not stop at a listed company, because a listed company
can itself be held by another.

**Paths.** The result lists every path from `node` to an ultimate holder.
Each path is the ordered list of relationships walked and the entities
on it (starting with the node itself when it is an entity), with the
listed ones marked. An entity counts as listed when its
listing has evidence for at least one of the chosen criteria. Each
relationship type has a strength, strongest first:

1. `owned`: `owns_brand` and `owns`.
2. `controlled`: `controls_board`.
3. `stake`: `holds_stake`.
4. `licensed`: `licenses_brand`.
5. `distributed`: `distributes`.

A path is graded by its weakest link. A brand licensed to a company that
is wholly owned by a listed group is `licensed`; a brand owned by a
company in which a listed group holds a stake is `stake`.

A path that includes a stake also carries an **indicative effective
share**: the product of the percentages along it, treating an `owns` link
with no percentage as 100. Brand links do not count, and a path through
board control has no share, since control carries none. It is labelled
indicative because it ignores voting rights and share classes.

A path is **approximate** when the query date falls inside the period of
an imprecise `validFrom` or `validTo` on one of its links, for example
asking about `2025-12-15` of a relationship that began in `2025-12`. The
whole result is also approximate when a relationship was left out only
because of a date boundary whose period contains the query date, since
the answer could be either way.

**Outcome.**

| Outcome   | When                                                                                                              |
| --------- | ----------------------------------------------------------------------------------------------------------------- |
| `linked`  | At least one path reaches a listed entity.                                                                        |
| `no-link` | The node has at least one path, but none reaches a listed entity. An entity with no holders is a path of its own. |
| `unknown` | The node is not in the graph, or it is a brand that nothing holds on that date and in that country.               |

A lookup on a node that is not in the graph returns `unknown`; it is not
an error. A malformed query (bad date or country code, negative
`minStakePct`) is an error.

## Acceptance cases

These cases are frozen as tests in `packages/model/test/acceptance/`,
each on a small fixture graph whose relationships cite the real
documents. They pin the behaviour the model exists for. The fixtures
list the groups the cases are about (Nestle, Coca-Cola, PepsiCo,
Unilever, Mars and Ferrero) under one example criterion; the companies
they hold, and the other holders, are not listed.

| Case                       | Query                                  | Expected                                                                                                                                                |
| -------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nestle and L'Oreal         | L'Oreal, 2026                          | `linked` to Nestle through a 20.16% stake.                                                                                                              |
| Starbucks at home          | Starbucks brand, 2026, GB              | `linked` to Nestle by licence (packaged coffee and foodservice; not shops or ready-to-drink); owned by Starbucks.                                       |
| Starbucks before the deal  | Starbucks brand, 2018-01, GB           | Owned by Starbucks, `no-link`.                                                                                                                          |
| Coca-Cola and Monster      | Monster, 2020 and 2026                 | `linked` to Coca-Cola through a stake: 16.7% from June 2015, 21% at the end of 2025.                                                                    |
| Coca-Cola, Costa, Innocent | Costa, Innocent, 2026                  | `owned` by Coca-Cola. Costa not linked before January 2019.                                                                                             |
| PepsiCo and Tropicana      | Tropicana, 2026, US and GB             | Owned by PAI Partners' company; `linked` to PepsiCo through a 39% stake; in the US also distributed by PepsiCo. Owned by PepsiCo in 2021.               |
| Persil                     | Persil, 2026, GB, IE, FR and DE        | `linked` to Unilever in GB, IE and FR; owned by Henkel in DE, `no-link`.                                                                                |
| Ben & Jerry's              | Ben & Jerry's, 2025-11 and 2026        | Owned by Unilever before the demerger of 6 December 2025; afterwards owned by The Magnum Ice Cream Company, `linked` to Unilever through a 19.9% stake. |
| Kellogg's                  | Kellogg's, 2026, GB and US             | GB: `linked` to Mars, which owns Kellanova, the brand owner. US: also `linked` to Ferrero by licence, through WK Kellogg Co.                            |
| Kellogg's before Mars      | Kellogg's, 2025-06, GB                 | Owned by Kellanova, `no-link`. Approximate during December 2025, the month Mars completed.                                                              |
| Thresholds                 | L'Oreal, 2026, with `minStakePct` 25   | `no-link`: the 20.16% stake is below the threshold. Passive holdings are pinned by the resolver's own tests.                                            |
| Unknown                    | A brand not in the graph; Persil in ES | `unknown`: no record, or no recorded owner in that country.                                                                                             |

Figures are as stated in the cited documents and were verified against
them before they were frozen. Where sources disagree or are incomplete
(Persil's markets, the year Unilever's Persil rights began), the fixture
records only what is settled and says so in a `note`. Where a source gives a figure at a date
rather than a range (Monster's stake rose over time through share
buy-backs), the fixture records the stated figures and says so in the
relationship's `note`.
