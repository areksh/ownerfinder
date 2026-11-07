# 6. Expo for the mobile apps

- Status: Accepted
- Date: 2026-11-07

## Context

Mobile apps come after the website. They should stay simple: scan a
barcode or search, see the result, browse company pages, and set
preferences. They must ship to both Android and iOS without maintaining
two codebases, and the project has no Mac-based build machine.

## Decision

- The apps are built with Expo (React Native) from a single TypeScript
  codebase in this repository.
- Barcode scanning uses `expo-camera`.
- Builds and store submissions use Expo's cloud build service (EAS), so
  iOS builds do not need a local Mac.
- The apps call the same public API as the website; there is no separate
  backend.

Work starts in a later phase; this record fixes the direction so earlier
choices (TypeScript, a shared model package, a JSON API) stay compatible.

## Consequences

- One codebase and one language for both platforms.
- The cloud build service has free-tier limits; heavy use may cost money.
- Native modules outside Expo's ecosystem need extra configuration.

## Alternatives considered

- **Capacitor wrapping the website**: maximum UI reuse, but native
  scanning and app-store polish are harder.
- **Flutter**: capable, but adds a second language (Dart).
- **Two native apps**: best platform fit, at roughly double the work.
