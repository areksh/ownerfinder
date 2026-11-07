# 1. Record architecture decisions

- Status: Accepted
- Date: 2026-11-07

## Context

The project is meant to outlive any one contributor. Outside contributors
need to know why the system looks the way it does before they change it,
and the reasons are easily lost once they live only in chat or memory.

## Decision

Significant decisions are recorded as short Architecture Decision Records
in `docs/adr/`, numbered in sequence (`NNNN-short-title.md`). Each record
states its status, date, context, decision, consequences and the
alternatives considered.

A record is immutable once accepted. A changed decision gets a new record
that supersedes the old one; the old record's status is updated to point
at its replacement, and nothing else in it changes.

## Consequences

- There is one place to look for the reasoning behind the stack, the data
  model and the licences.
- Writing a record costs a few minutes per decision.

## Alternatives considered

- **Decisions in a wiki or issue threads**: harder to find, not versioned
  with the code.
- **No formal record**: cheapest now, most expensive when someone asks
  "why" a year later.
