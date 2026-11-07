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

## Deployment

Both apps run on Cloudflare Workers:

- Website: <https://ecf-web.gloaming-worker.workers.dev>
- API: <https://ecf-api.gloaming-worker.workers.dev/health>

GitHub Actions deploys every push to `master` once lint, type checks,
tests and builds pass. The deploy job runs in the `production` environment,
restricted to the `master` branch, which holds two secrets:
`CLOUDFLARE_API_TOKEN` (a token limited to Workers Scripts: Edit and D1:
Edit) and `CLOUDFLARE_ACCOUNT_ID`.

To deploy by hand after `pnpm exec wrangler login`:

```sh
pnpm --filter api run deploy
pnpm --filter web run deploy
```

## Repository map

| Path             | What it is                                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| `apps/api`       | API Worker on Cloudflare, backed by a D1 database                                              |
| `apps/web`       | Website: React Router, server-rendered on Cloudflare Workers                                   |
| `packages/model` | The data model: record shapes, validation and the lookup resolver ([spec](docs/data-model.md)) |
| `docs/`          | Architecture, decisions and project documentation ([index](docs/README.md))                    |
| `docs/adr/`      | Architecture decision records                                                                  |

## Licences

- **Code:** GNU Affero General Public License v3.0, see [LICENSE](LICENSE).
- **Data:** the curated database will be published under the Open
  Database License 1.0 (ODbL), with attribution to its sources. See
  [ADR 9](docs/adr/0009-licence-code-agpl-data-odbl.md).
