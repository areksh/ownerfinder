# 12. Affiliation links for companies under common ownership

- Status: Accepted
- Date: 2026-11-08
- Extends: [ADR 10](0010-relationship-graph-data-model.md)

## Context

Some brands belong to companies that sit beside a listed company rather
than under it. Ferrero's own pages divide its brands into Ferrero Group
brands and "affiliated" brands, and say the affiliated companies are not
in Ferrero International's consolidated accounts and do not fall under
Ferrero Group governance. The graph of ADR 10 can only say that one
company owns, holds a stake in, controls the board of, licenses or
distributes another's brand, so these brands could be recorded only
under an owner with no link to Ferrero, and a lookup never reached
Ferrero's listing. Recording them as Ferrero's would contradict the
source.

## Decision

- Add the relationship type `affiliated_with`: from a company to another
  company under common ownership with it, where neither owns the other,
  as a source states. It points at an entity, carries no percentage, and
  is dated, scoped and sourced like every relationship.
- It has its own grade, `related`, weaker than `distributed`, so a path
  through it is always graded `related` and is never described as
  ownership. A path through it has no effective share.
- The website calls the grade "Related company" and describes the link
  as "related to ..., but not owned by it".
- It is used only where a source states the relationship; a shared name
  or shared shareholders known from elsewhere are not enough.

## Consequences

- Brands of affiliated companies reach the listed company with the
  relationship spelt out, and readers see why it is on the list.
- Readers must read the grade: a related company is not owned by the
  listed one, and the answer says so.
- The other types and grades of ADR 10 are unchanged.
