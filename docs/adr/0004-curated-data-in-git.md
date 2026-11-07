# 4. Curated data lives as files in the repository

- Status: Accepted
- Date: 2026-11-07

## Context

The ownership graph and the evidence for listing each company are
curated by hand, drawing on many sources. Every claim must carry a source,
changes must be reviewable, mistakes must be traceable and reversible, and
outside contributors should be able to propose corrections. The dataset
is to be published under an open licence (ADR 9).

## Decision

- The source of truth for curated data is a set of plain data files in
  the repository, one record per entity, brand, relationship, source and
  piece of evidence.
- Changes arrive as pull requests and are reviewed like code.
- CI validates every file against the data model. A relationship without
  at least one source fails the build.
- At deploy time a build step loads the files into D1 (ADR 3). The
  published data dump is generated from the same files.
- Automated ingestion produces proposals for a curator to review; it never
  writes to the data files unattended.

## Consequences

- Full history, blame and revert come from git.
- Contributors need a GitHub account and some comfort with pull requests;
  a request form on the site can lower that bar later.
- The database is a disposable build artefact, so there is no live state
  to back up or migrate.
- Large numbers of files may need tooling to edit comfortably; that
  tooling is built as the need appears.

## Alternatives considered

- **A database with an admin interface**: friendlier for non-developers,
  but authentication, history, review and auditing would all have to be
  built and secured by us.
- **A spreadsheet**: easy to start, but poor at relationships, history and
  validation.
