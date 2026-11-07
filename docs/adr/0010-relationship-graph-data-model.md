# 10. A dated, scoped relationship graph

- Status: Accepted
- Date: 2026-11-07

## Context

The service has to answer "is this brand connected to a listed company?"
correctly, and the real answers are not a simple tree:

- Nestle holds about a fifth of L'Oreal: a stake, not ownership.
- Nestle sells Starbucks coffee in supermarkets under a perpetual
  licence, while Starbucks owns the brand and runs the shops.
- PepsiCo sold Tropicana in 2022, kept 39% of the buyer's company and
  still distributes some of its products in the United States.
- Persil belongs to Unilever in the UK, Ireland and France and to Henkel
  elsewhere.
- Ben & Jerry's moved to The Magnum Ice Cream Company in December 2025,
  in which Unilever kept a 19.9% stake.
- The Kellogg's mark belongs to Kellanova (now Mars) worldwide, but WK
  Kellogg Co (now Ferrero) holds an exclusive perpetual licence in North
  America.

So the answer depends on the kind of relationship, the date and the
country, and every link must be traceable to a source.

## Decision

- Model the data as a graph of entities (companies) and brands joined by
  typed relationships: `owns`, `holds_stake`, `controls_board`,
  `owns_brand`, `licenses_brand` and `distributes`.
- Every relationship carries a validity period (partial dates whose
  precision is kept), a country scope, and at least one source. A
  relationship without a source is invalid.
- Reasons for listing a company are evidence items, each with a
  criterion, a status (alleged, found, settled, admitted) and sources.
  Criteria are data.
- A lookup walks relationships from the brand or company towards its
  holders, filtered by date, country, stake threshold (5% by default) and
  passive holdings, and returns every path, graded by its weakest link.
  The outcome is `linked`, `no-link` or `unknown`; never "clean".
- The model, validator and resolver are one pure TypeScript package,
  `packages/model`, with no I/O. Zod 4 checks the shape of untrusted
  input (data files, API queries); the cross-record rules are plain code.
- The API fetches the candidate part of the graph from D1 and runs the
  same resolver on it. SQL fetches; TypeScript decides.

The full specification is in [the data model](../data-model.md).

## Consequences

- The acceptance cases above are expressible and are frozen as tests.
- The package has no Workers APIs, so it is tested under Node.js rather
  than workerd; ADR 7's rule for Worker code does not apply to it.
- Curators record more per link (dates, scope, sources), and the
  validator rejects incomplete records.
- Answers carry paths, grades and caveats, so the interface must explain
  them plainly.
- Effective shares through several stakes are shown as indicative only.
- Interlocking directors (one person on two boards) are not modelled
  yet; they need people as records and their own privacy design.

## Alternatives considered

- **A single "owned by" tree**: simple, but cannot express stakes,
  licences, distribution, or country differences, which are the cases
  that matter most.
- **A graph database or graph library**: unnecessary at the expected
  size (thousands of records) and another moving part to host.
- **Resolving in SQL alone** (a recursive query): fast, but it would put
  the rules for dates, scope, thresholds and grading in a second place,
  where they would drift from the TypeScript used in the build and tests.
- **Hand-written type guards instead of Zod**: no dependency, but more
  code to keep in step with the types, with worse error messages.
