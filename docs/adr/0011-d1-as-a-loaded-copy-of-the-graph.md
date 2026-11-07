# 11. D1 holds a loaded copy of the graph

- Status: Accepted
- Date: 2026-11-07

## Context

The curated data lives in the repository (ADR 4) and is checked and built
into `build/graph.json`. The API runs on Workers with D1 (ADR 3) and must
answer lookups with the same rules the data model's resolver applies
(ADR 10). The data changes only when the repository changes, and it is
small: hundreds of records now, perhaps tens of thousands later.

## Decision

- D1 holds a copy of the built graph and nothing else. Every deploy
  applies any new schema migrations, then replaces all rows in one
  import of `build/graph.sql`, which D1 runs atomically: a failed import
  leaves the previous data in place.
- Each table stores a record whole as JSON beside the indexed columns
  queries filter on (`to_id` and `from_id` for relationships, folded
  search terms for names and aliases). The Worker reads records back in
  the data model's own shape, so there is no mapping layer to drift.
- A lookup fetches the part of the graph that can reach the node with a
  recursive query (relationships whose target is the node or any of its
  holders, transitively), then runs the data model's `resolve` on that
  subgraph. SQL selects candidates; TypeScript decides the answer.
- Name search matches folded names and aliases (lower case, accents
  removed) with `LIKE`, which is enough at this size; full-text search
  can replace it without changing the API.

## Consequences

- The database never holds state that is not in git, so it needs no
  backups, and a bad deploy is fixed by deploying again.
- A deploy with a schema change must apply the migration before loading
  data and before the new Worker goes live, in that order.
- Each lookup costs a few queries regardless of graph size, because the
  recursive query only follows links towards the node's holders.
- The recursive fetch ignores dates and countries, so it may return links
  the resolver then drops; at this data size that is cheaper than
  duplicating the date and scope rules in SQL.

## Alternatives considered

- **Bundling `graph.json` into the Worker**: no database at all, but the
  bundle grows with the data, and every data change becomes a code
  deploy of the API with its size limits.
- **Fully normalised tables** (a column per field, join tables for scopes
  and sources): conventional, but every model change would need matching
  SQL and mapping code, which is where the two would drift apart.
- **Filtering by date and country in SQL**: fewer rows fetched, but the
  rules would then live in two places, contrary to ADR 10.
