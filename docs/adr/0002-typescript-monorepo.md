# 2. TypeScript in a single pnpm workspace

- Status: Accepted
- Date: 2026-11-07

## Context

The system has several parts: data tooling and ingestion, an API, a
website and, later, mobile apps. All of them handle the same core
concepts (companies, brands, dated and scoped ownership relationships,
sources). Inconsistent definitions of those concepts across components
would produce wrong answers, and the project is maintained by a single
curator at first, so every extra toolchain is a real cost.

## Decision

- TypeScript for every component, in strict mode, with the TypeScript 7
  compiler.
- One repository and one pnpm workspace: deployable apps in `apps/*`,
  shared libraries (starting with the data model) in `packages/*`.
- Node.js 22 for tooling.
- Biome for both linting and formatting.
- Exact dependency versions, and pnpm's default supply-chain checks
  (minimum release age, blocked install scripts unless allowed) left on.

## Consequences

- The data-model types and validation are written once and used by the
  build, the API, the website and the apps.
- A change that spans components lands in one commit and one review.
- Biome has fewer rules than the ESLint ecosystem; if a needed check is
  missing we can add a targeted tool later.

## Alternatives considered

- **Python for ingestion, TypeScript elsewhere**: Python has strong data
  libraries, but two toolchains and duplicated model definitions.
- **ESLint plus Prettier**: more rules and plugins, at the cost of more
  dependencies and configuration.
- **Separate repositories per component**: clearer boundaries, but
  cross-cutting changes become several coordinated releases.
