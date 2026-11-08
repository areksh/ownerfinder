# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Placeholder website.
- API health check.
- Data model: a dated, scoped relationship graph with validation and a
  lookup resolver, pinned by cited acceptance cases.
- Curated ownership data for 21 corporate groups, with country-scoped
  brands, stakes and licences, checked in CI.
- Data tools: `pnpm data:check`, `pnpm data:build` (the ODbL dump) and
  `pnpm data:propose wikidata <Q-id>`.
- Website: search, answers for any country and date with every link and
  source, company and brand profiles, how it works, data download, and a
  request form that opens GitHub issues once its keys are set.
- Public JSON API: `/search`, `/lookup/<id>`, `/nodes/<id>` and `/criteria`,
  answering by date and country with a source for every link.
- The list: twelve criteria and listings for 30 companies, each piece of
  evidence cited and worded to how established it is (found, settled,
  admitted or alleged). Linked answers say why each listed company is on
  the list, and readers choose which criteria count.
- Ownership data for 19 more groups: Philip Morris
  International, British American Tobacco, Japan Tobacco, JBS, Tyson Foods, Amazon, Meta,
  Alphabet, PDD, Booking, Shein, Shell, ExxonMobil, BP, Chevron, Barclays and 3M,
  with Altria and Keurig Dr Pepper as US owners of Marlboro and 7UP.
