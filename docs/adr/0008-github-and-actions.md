# 8. GitHub for code hosting, CI and deployment

- Status: Accepted
- Date: 2026-11-07

## Context

The project is open source and expects outside contributors, including
people proposing data corrections (ADR 4). It needs code hosting, review,
an issue tracker, continuous integration and automated deployment to
Cloudflare (ADR 3).

## Decision

- The repository is hosted on GitHub.
- GitHub Actions runs lint, type checks, tests and builds on every pull
  request and every push to `master`.
- Pushes to `master` that pass those checks are deployed to Cloudflare by
  GitHub Actions.
- Cloudflare credentials exist only as repository secrets, scoped to the
  minimum permissions deployment needs. Third-party actions are pinned to
  full commit hashes.

## Consequences

- Contributors use a familiar platform; corrections can be proposed as
  issues or pull requests.
- The project depends on GitHub's free tier for public repositories.
- Anyone with write access to the repository can trigger a deploy, so
  write access is granted sparingly.

## Alternatives considered

- **GitLab or Codeberg**: viable, with smaller contributor audiences.
- **Cloudflare's own Git-connected builds**: simpler deploys, but a split
  between where checks run and where deploys run.
