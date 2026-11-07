# 7. Testing approach

- Status: Accepted
- Date: 2026-11-07

## Context

The service's value depends on its answers being right: who owns what,
when and where. The data comes from many external sources whose formats
change, and the code runs in the Workers runtime rather than plain
Node.js.

## Decision

- Vitest is the test runner across the workspace.
- Worker code is tested inside the Workers runtime (workerd) through
  `@cloudflare/vitest-plugin`, with real local bindings such as D1.
- Branch coverage is collected with istanbul (V8 coverage does not work
  inside workerd). Coverage is a diagnostic, not a target.
- External data sources are exercised only through recorded real
  responses checked in as fixtures. Tests never call live services.
- Behaviour is tested through public interfaces; only true external
  boundaries are replaced in tests.
- Integration tests cover the seams: source parsers against recorded
  responses, the database schema, API routes through to serialised
  output.
- Playwright covers a small number of end-to-end journeys once the website
  has them.

## Consequences

- Tests run offline, deterministically and fast.
- Recorded fixtures have to be refreshed deliberately when a source
  changes format, and the refresh is reviewed.
- Running tests in workerd catches runtime differences that Node.js-based
  tests would miss.

## Alternatives considered

- **Testing Workers code under Node.js**: simpler set-up, but misses
  runtime differences.
- **Live calls to sources in tests**: always current, but slow, flaky,
  rate-limited and sometimes paid.
