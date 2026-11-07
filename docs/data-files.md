# Data files

The curated graph is kept as YAML files under `data/`, reviewed through
pull requests (ADR 4) and checked against the [data model](data-model.md).
This document says how the files are laid out, how they are checked and
built, and how new data is proposed.

## Layout

```
data/
  groups/<group>.yaml     entities, brands and relationships of one corporate group
  sources/<group>.yaml    the sources that group's records cite
  criteria.yaml           listing criteria (optional)
  listings/<entity>.yaml  one listed entity's evidence (optional)
```

ADR 4 asks for one record per entity, brand, relationship, source and
piece of evidence; each record is one entry in a file, not one file. A
file groups the records a curator works on together.

- A **group file** holds `entities`, `brands` and `relationships`, each a
  list. All three keys are optional.
- A **source file** holds `sources`, a list.
- `criteria.yaml` holds `criteria`, a list.
- A **listing file** holds a single listing: `entity` and `evidence`.

The file name is for people; it carries no meaning. Ids are global, so a
relationship in one group's file may point at a record in another's. A
file may not contain keys the model does not define, and YAML anchors,
aliases and custom tags are refused, so what a reviewer reads in a diff
is the data.

Comments are encouraged wherever a source is ambiguous or two sources
disagree; they are for curators and are not published.

```yaml
# data/groups/unilever.yaml
entities:
  - id: entity:unilever
    name: Unilever PLC

brands:
  - id: brand:persil
    name: Persil

relationships:
  - id: relationship:unilever-persil
    type: owns_brand
    from: entity:unilever
    to: brand:persil
    validFrom: "1931" # quote a bare year, or YAML reads it as a number
    scope: { include: [GB, IE, FR] }
    sources: [source:persil-uk-about]
```

## Checking

`pnpm data:check` loads every file, merges the records into one graph and
runs `validateGraph`. Each problem is reported with the file and record it
concerns. It exits non-zero on any problem, and CI runs it on every push
and pull request, so an unsourced relationship never reaches the database.

## Building

`pnpm data:build` checks the data, then writes `build/graph.json`: the
merged graph, with records sorted by id so the output is reproducible,
and the data licence (ODbL 1.0) stated at the top. The file is both the
published data dump and the input the API loads. Loading it into D1 is
designed together with the API's queries.

## Proposing from Wikidata

`pnpm data:propose wikidata <Q-id>` asks Wikidata for the organisation's
parent organisations and owners, its subsidiaries, and the brands it
owns, with any start and end dates and shares recorded there. It writes
`proposals/<Q-id>.yaml`, which is not committed.

The proposal is a starting point only. Wikidata's ownership data is often
incomplete or out of date, so:

- every proposed record cites Wikidata and carries a note asking for a
  primary source;
- patents, products that are not brands and other noise are left out;
- shares are converted to percentages whether Wikidata records them as
  fractions or percentages;
- the curator verifies each record against an annual report, filing or
  register, replaces or adds the source, and moves it into `data/` by
  hand. The helper never writes to `data/`.

Wikidata is CC0, so proposals carry no licence obligations; the sources
that replace it carry their own.
