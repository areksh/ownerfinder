# 5. React Router framework mode for the website

- Status: Accepted
- Date: 2026-11-07

## Context

The website's main pages (search results, company profiles, ownership
chains) depend on data and on the visitor's chosen date and country.
They should be fast on cheap phones and indexable by search engines,
since many visitors will arrive by searching "who owns" a brand. The
mobile apps will be built with React Native (ADR 6).

## Decision

The website uses React Router (version 8) in framework mode, rendered on
the server on Cloudflare Workers through the Cloudflare Vite plugin.

## Consequences

- Pages arrive as HTML, which suits search engines and slow devices;
  interactivity is added where needed.
- React skills carry over to the mobile apps, though UI components do not
  (the web uses the DOM, the apps native views).
- We follow React Router's release cadence for major upgrades.

## Alternatives considered

- **Astro**: excellent for mostly static content, but the core pages are
  dynamic per request.
- **SvelteKit**: a strong framework, but a different component model from
  the mobile apps.
- **Next.js through OpenNext**: popular, but a heavier adapter layer on
  Workers.
