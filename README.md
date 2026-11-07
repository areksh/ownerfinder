# Ownership lookup (working title)

A non-profit, open-source service for finding out who owns the brands and
products you buy. Look up a brand, product or company and see whether it
is owned, part-owned, licensed or controlled, at any level of the chain,
by a company on a curated list, with a source for every link and the
cited reasons each company is listed.

**Status:** in development. Nothing here is ready for public use yet.

## Quick start

Prerequisites: Node.js 22 (see `.nvmrc`) and corepack, which ships with
Node.js.

```sh
corepack enable pnpm
pnpm install
```

Run locally:

```sh
pnpm --filter api dev   # API Worker on http://localhost:8787 (try /health)
pnpm --filter web dev   # website on http://localhost:5173
```

Checks:

```sh
pnpm test        # all tests
pnpm lint        # lint and formatting check (Biome)
pnpm format      # apply formatting and safe lint fixes
pnpm typecheck   # TypeScript, after regenerating Worker and route types
pnpm build       # production builds
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for running single tests,
coverage and how to propose changes.

## Repository map

| Path        | What it is                                                                  |
| ----------- | --------------------------------------------------------------------------- |
| `apps/api`  | API Worker on Cloudflare, backed by a D1 database                           |
| `apps/web`  | Website: React Router, server-rendered on Cloudflare Workers                |
| `docs/`     | Architecture, decisions and project documentation ([index](docs/README.md)) |
| `docs/adr/` | Architecture decision records                                               |

## Licences

- **Code:** GNU Affero General Public License v3.0, see [LICENSE](LICENSE).
- **Data:** the curated database will be published under the Open
  Database Licence 1.0 (ODbL), with attribution to its sources. See
  [ADR 9](docs/adr/0009-licence-code-agpl-data-odbl.md).
