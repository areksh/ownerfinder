# Architecture

The service answers one question: is this brand, product or company
owned, part-owned, licensed or controlled, at any level of the chain, by a
company on the curated list? Every link in the answer carries a source,
and the answer depends on the date and country it is asked for.

The graph is built top-down: curators start from each listed company and
record its subsidiaries, stakes and brands. A lookup succeeds by reaching
something already in the graph; a brand that is not in the graph is
reported as unknown, never as "clean".

## Components

```mermaid
flowchart LR
  data["Curated data files<br/>(planned)"] -->|CI: validate and build| d1[("D1 database")]
  ingest["Ingestion helpers<br/>(planned)"] -->|proposals for review| data
  d1 --> api["API Worker<br/>apps/api"]
  api --> web["Website<br/>apps/web"]
  api --> mobile["Mobile apps<br/>(planned)"]
  data -->|ODbL dump| dump["Published data<br/>(planned)"]
```

| Component               | State                           | Decided in                                       |
| ----------------------- | ------------------------------- | ------------------------------------------------ |
| Website (`apps/web`)    | Placeholder page                | [ADR 5](adr/0005-react-router-on-workers.md)     |
| API Worker (`apps/api`) | Health check against D1         | [ADR 3](adr/0003-cloudflare-workers-and-d1.md)   |
| D1 database             | Bound to the API, no schema yet | [ADR 3](adr/0003-cloudflare-workers-and-d1.md)   |
| Curated data files      | Planned                         | [ADR 4](adr/0004-curated-data-in-git.md)         |
| Data model package      | Planned                         | [ADR 2](adr/0002-typescript-monorepo.md)         |
| Ingestion helpers       | Planned                         | [ADR 4](adr/0004-curated-data-in-git.md)         |
| Mobile apps             | Planned                         | [ADR 6](adr/0006-expo-for-mobile.md)             |
| Published data dump     | Planned                         | [ADR 9](adr/0009-licence-code-agpl-data-odbl.md) |

The website does not yet call the API; it will once there is data to
show.

## Hosting

Both Workers run on Cloudflare (ADR 3) and are deployed by GitHub Actions
from `master` (ADR 8).
