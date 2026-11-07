# 3. Host on Cloudflare Workers with D1

- Status: Accepted
- Date: 2026-11-07

## Context

The service is non-profit and must be cheap to run, quick for visitors
worldwide, and resilient to traffic spikes and attacks (boycott-related
sites do get attacked). It needs somewhere to store the ownership graph
and answer lookups against it.

The graph is curated from a fixed list of companies downwards, so it stays
small: tens of thousands of nodes and edges even with hundreds of listed
companies. Lookups walk upwards from a brand to its owners, filtered by
date and country.

## Decision

- The API and the website run on Cloudflare Workers.
- The graph is stored in Cloudflare D1 (SQLite). The upward walk uses
  recursive common table expressions; name search uses SQLite full-text
  search.
- Other Cloudflare services are used as needs arise: R2 for published data
  dumps, KV or the Cache API for cached third-party responses, Turnstile
  for spam protection, Access for curator-only endpoints, Cron Triggers or
  Workflows for scheduled jobs.

## Consequences

- Running costs start at the free tier, with a low fixed price beyond it.
- D1 has per-database size and query limits; the curated graph is far
  below them.
- If the graph or query load outgrows D1, the escape hatch is Postgres
  reached through Hyperdrive. The data lives in plain files (ADR 4), so a
  move is a rebuild, not a migration of live state.
- Code must suit the Workers runtime (no long-running processes, no
  arbitrary Node.js APIs).

## Alternatives considered

- **A graph database** (for example Neo4j): natural for traversals, but an
  extra service to run and pay for, and unnecessary at this size.
- **Managed Postgres from day one**: more headroom, but a separate
  provider, a monthly cost and connection management, for capacity we do
  not need yet.
- **A traditional VPS**: full control, but patching, scaling and DDoS
  protection become our job.
