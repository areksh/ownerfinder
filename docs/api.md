# API

The API Worker (`apps/api`) serves the curated graph as JSON. It is a
public, read-only API: every data endpoint answers `GET` (and `HEAD`),
allows any origin, and may be cached for five minutes. The data behind it
is published under the ODbL 1.0 ([ADR 9](adr/0009-licence-code-agpl-data-odbl.md)).

Ids are the data model's ids, such as `brand:persil` or `entity:nestle`;
in a path the colon may be written as is or as `%3A`.

## `GET /search?q=<text>`

Finds entities and brands by name or alias. Matching ignores case and
accents, so `nestle` finds Nestle with its accent. `q` must be 2 to 100
characters after trimming.

```json
{
  "query": "pers",
  "results": [{ "id": "brand:persil", "kind": "brand", "name": "Persil", "matched": "Persil" }]
}
```

Results are ordered exact match first, then names starting with the text,
then the rest, then alphabetically; at most 20 are returned.

## `GET /lookup/<id>?country=<CC>&date=<YYYY-MM-DD>`

Answers the question the service exists for: how does this brand or
company connect to a listed company, on this date and in this country?
The answer is produced by the data model's resolver
([data model](data-model.md#lookups)); this endpoint only fetches the
records it needs and serialises the result.

| Parameter        | Required | Meaning                                                   |
| ---------------- | -------- | --------------------------------------------------------- |
| `country`        | yes      | ISO 3166-1 alpha-2 code, upper case.                      |
| `date`           | no       | `YYYY-MM-DD`; defaults to today (UTC).                    |
| `minStakePct`    | no       | Stakes below this are ignored; default 5, from 0 to 100.  |
| `includePassive` | no       | `true` to include passive holdings.                       |
| `criteria`       | no       | Comma-separated criterion ids; absent means all criteria. |

```json
{
  "query": {
    "node": "brand:kelloggs",
    "date": "2026-11-07",
    "country": "US",
    "minStakePct": 5,
    "includePassive": false
  },
  "node": { "id": "brand:kelloggs", "kind": "brand", "name": "Kellogg's" },
  "outcome": "linked",
  "approximate": false,
  "paths": [
    {
      "grade": "owned",
      "approximate": false,
      "entities": [
        { "id": "entity:kellanova", "name": "Kellanova", "listed": false },
        { "id": "entity:mars", "name": "Mars, Incorporated", "listed": true }
      ],
      "links": [
        {
          "id": "relationship:kellanova-kelloggs",
          "type": "owns_brand",
          "from": { "id": "entity:kellanova", "name": "Kellanova" },
          "to": { "id": "brand:kelloggs", "name": "Kellogg's" },
          "validFrom": "2023-09-29",
          "scope": { "include": "world" },
          "sources": ["source:kellogg-brand-agreement-2023"]
        }
      ]
    }
  ],
  "listings": [
    {
      "entity": "entity:mars",
      "evidence": [
        { "criterion": "criterion:...", "summary": "...", "status": "found", "...": "..." }
      ]
    }
  ],
  "sources": {
    "source:kellogg-brand-agreement-2023": {
      "id": "source:kellogg-brand-agreement-2023",
      "url": "https://www.sec.gov/...",
      "title": "...",
      "publisher": "Kellogg Company",
      "retrieved": "2026-11-07"
    }
  }
}
```

Each link carries the relationship's own fields (type, dates, scope,
percentage, coverage, note and source ids) with the names of both ends.
`listings` gives the listing of each listed company the paths reach, with
only the evidence for the chosen criteria, so the reasons can be shown
beside the company. `sources` holds every source the links and that
evidence cite. A path through a stake also
has `effectiveSharePct`. An id that is well formed but not in the graph
gives `200` with `"outcome": "unknown"` and `"node": null`: not being
recorded is an answer, not an error.

## `GET /nodes/<id>`

One entity or brand, with every relationship that touches it, whatever its
dates, so its history is visible.

```json
{
  "node": { "id": "entity:kellanova", "kind": "entity", "name": "Kellanova" },
  "listing": null,
  "heldBy": [
    {
      "id": "relationship:mars-kellanova",
      "type": "owns",
      "from": { "id": "entity:mars", "name": "Mars, Incorporated" },
      "to": { "id": "entity:kellanova", "name": "Kellanova" },
      "validFrom": "2025-12",
      "...": "..."
    }
  ],
  "holds": [{ "id": "relationship:kellanova-pringles", "type": "owns_brand", "...": "..." }],
  "sources": { "source:mars-kellanova-2025": { "...": "..." } }
}
```

`listing` is the entity's listing with its evidence, or `null`;
`sources` includes the sources its evidence cites. An id not
in the graph gives `404`.

## `GET /criteria`

```json
{ "criteria": [{ "id": "criterion:example", "name": "Example", "description": "..." }] }
```

## `GET /health`

Reports whether the Worker can reach the database: `200` with
`{"status":"ok","database":"ok"}`, or `503` with `degraded`. Never cached.

## Errors

| Status | Body                                                    | When                                              |
| ------ | ------------------------------------------------------- | ------------------------------------------------- |
| 400    | `{"error":"bad_request","message":"..."}`               | A missing or malformed parameter or id.           |
| 404    | `{"error":"not_found"}`                                 | No such path, or `/nodes/<id>` for an unknown id. |
| 405    | `{"error":"method_not_allowed"}` with an `allow` header | Anything but `GET` or `HEAD`.                     |
| 500    | `{"error":"internal_error"}`                            | An unexpected failure; the detail is logged only. |

## Data in D1

The database is a disposable copy of `build/graph.json` (ADR 4, ADR 11).
`apps/api/migrations/` defines the tables; each deploy applies new
migrations, then replaces every row in one atomic import of
`build/graph.sql`, written by `pnpm data:build`. Each table keeps a record
whole as JSON, next to the indexed columns that queries filter on, so the
Worker reads back exactly the data model's records.
