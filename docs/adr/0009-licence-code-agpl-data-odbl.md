# 9. Code under AGPL-3.0, data under ODbL 1.0

- Status: Accepted
- Date: 2026-11-07

## Context

The project is non-profit and open source, runs as a public web service,
and builds on open datasets. Open Food Facts and OpenCorporates publish
their data under the Open Database Licence (ODbL), which requires
derived databases that are made public to be shared under the same
licence. Other sources have their own terms.

## Decision

- **Code** is licensed under the GNU Affero General Public License,
  version 3 (AGPL-3.0). Anyone who runs a modified version as a network
  service must offer its source to that service's users.
- **Data**, meaning the curated database and its published dumps, is
  licensed under the Open Database Licence 1.0 (ODbL), with attribution to
  the upstream sources.
- Every source's licence is recorded alongside the data it contributes.
  Data from a source whose terms are incompatible with ODbL republishing
  is not ingested.

## Consequences

- Improvements to hosted forks come back to the commons.
- Some companies avoid AGPL code; that matters little for a public-interest
  service.
- ODbL share-alike keeps the dataset compatible with Open Food Facts and
  OpenCorporates, and keeps derived databases open.
- Each new data source needs its terms checked before ingestion.

## Alternatives considered

- **MIT or Apache-2.0 for code**: widest reuse, including closed hosted
  forks.
- **CC BY 4.0 or CC0 for data**: simpler for reusers, but incompatible
  with ingesting ODbL sources.
