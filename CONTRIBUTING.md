# Contributing

Thank you for helping. This project is maintained by a single curator at
the moment, so please be patient with reviews.

## Requesting a company or a correction

Open a GitHub issue with:

- the company, brand or product concerned;
- what you think should be added or changed;
- at least one source (annual report, company register, regulator
  finding, reputable news report). Claims without a source cannot be
  accepted.

Requests are reviewed by the curator. Being requested does not mean a
company will be listed; listing criteria and evidence are published with
each company.

## Setting up

Follow the [quick start in the README](README.md#quick-start).

## Tests

- Every change in behaviour comes with tests, written first. See
  [ADR 7](docs/adr/0007-testing-approach.md) for the approach.
- Run everything: `pnpm test`
- Run one test file, or one test by name:

  ```sh
  pnpm --filter api exec vitest run test/health.test.ts -t "reports ok"
  ```

- Coverage for the API: `pnpm --filter api test:coverage`. Coverage is a
  diagnostic, not a target.
- Tests never call live external services; external data sources are
  exercised through recorded responses checked in as fixtures.

Before opening a pull request, run `pnpm lint`, `pnpm typecheck`,
`pnpm test` and `pnpm build`. CI runs the same checks.

## Commits

Commits follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(optional-scope): imperative subject, lower case, no full stop

Body explaining why the change was made.
```

Types: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `build`, `ci`,
`chore`, `style`, `revert`. Mark breaking changes with `!` or a
`BREAKING CHANGE:` footer. Keep each commit to one logical change.

## Style

- British English in code, comments and documentation, except where an
  API uses American spelling.
- Formatting and linting are handled by Biome: run `pnpm format`.

## Decisions

Significant technical decisions are recorded in
[`docs/adr/`](docs/adr/README.md). If a change needs to depart from an
accepted decision, propose a new record that supersedes it.

## Licensing of contributions

Code contributions are accepted under the AGPL-3.0, and data
contributions under the ODbL 1.0 (see
[ADR 9](docs/adr/0009-licence-code-agpl-data-odbl.md)).
