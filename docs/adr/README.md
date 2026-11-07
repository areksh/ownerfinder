# Architecture decision records

Each significant decision is recorded here as a short, numbered record:
context, decision, consequences and the alternatives considered. A record
is immutable once accepted; a changed decision gets a new record that
supersedes the old one. See [ADR 1](0001-record-architecture-decisions.md).

| No.                                         | Decision                                      | Status   |
| ------------------------------------------- | --------------------------------------------- | -------- |
| [1](0001-record-architecture-decisions.md)  | Record architecture decisions                 | Accepted |
| [2](0002-typescript-monorepo.md)            | TypeScript in a single pnpm workspace         | Accepted |
| [3](0003-cloudflare-workers-and-d1.md)      | Host on Cloudflare Workers with D1            | Accepted |
| [4](0004-curated-data-in-git.md)            | Curated data lives as files in the repository | Accepted |
| [5](0005-react-router-on-workers.md)        | React Router framework mode for the website   | Accepted |
| [6](0006-expo-for-mobile.md)                | Expo for the mobile apps                      | Accepted |
| [7](0007-testing-approach.md)               | Testing approach                              | Accepted |
| [8](0008-github-and-actions.md)             | GitHub for code hosting, CI and deployment    | Accepted |
| [9](0009-licence-code-agpl-data-odbl.md)    | Code under AGPL-3.0, data under ODbL 1.0      | Accepted |
| [10](0010-relationship-graph-data-model.md) | A dated, scoped relationship graph            | Accepted |
