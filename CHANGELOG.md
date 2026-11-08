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
- The list: twelve criteria and listings for 31 companies, each piece of
  evidence cited and worded to how established it is (found, settled,
  admitted or alleged). Linked answers say why each listed company is on
  the list, and readers choose which criteria count.
- Ownership data for 20 more groups: Philip Morris
  International, British American Tobacco, Japan Tobacco, JBS, Tyson Foods, Amazon, Meta,
  Alphabet, PDD, Booking, Shein, Bayer, Shell, ExxonMobil, BP, Chevron, Barclays and 3M,
  with Altria and Keurig Dr Pepper as US owners of Marlboro and 7UP.
- Answers say "since" a date only when a source gives the start; other
  dates read "known from", and a question about an earlier date points
  to the earliest later record.
- Nestle in depth: its US holding chain, its trademark company, about 100
  more brands, and its joint ventures, Cereal Partners Worldwide and
  Froneri, with General Mills as owner of the brands they make under
  licence.
- More brands from Coca-Cola's, PepsiCo's, P&G's, Colgate's and
  Mondelez's annual reports, with their territory limits, and Unilever
  in depth: its Power Brands, its 2025 purchases, its main subsidiaries
  and the brands on its UK, US and Hindustan Unilever pages, each scoped
  to the market its page covers.
- BAT in depth: its US chain through Reynolds American and the
  operating companies that make Camel, Newport, Natural American
  Spirit, Grizzly, Vuse and Velo, and its 22.91% stake in ITC, with
  about 50 of ITC's Indian brands such as Aashirvaad, Sunfeast,
  Bingo!, Classmate and Gold Flake.
- L'Oréal in depth: about 35 more brands with the year each was
  acquired, the fashion houses whose beauty lines it makes under
  licence (Armani, Prada, Valentino, Miu Miu, Jacquemus, and Balenciaga
  and Bottega Veneta through Kering Beauté, bought in April 2026), its
  stakes in Galderma, Sanofi, Amouage and Jacquemus, and the Nestlé
  companies that hold Nestlé's 20.16% of L'Oréal.
- Danone, Reckitt and Mars in depth: Danone's brands with its recent
  purchases and sales (Kate Farms, Horizon Organic, its Russian
  business); Reckitt's Powerbrands and the Essential Home sale, which
  moved Air Wick, Calgon, Cillit Bang and others to an Advent company
  on 31 December 2025; and Kellanova's trademarks, with the cereal
  brands WK Kellogg Co makes under licence in North America.
- Mars's A-Z brand list (80 more brands, including its pet care and
  veterinary businesses); PMI's and Altria's other brands, split at the
  US border; and Anheuser-Busch InBev, with its controlling shareholder,
  main subsidiaries, brands, Constellation Brands' US rights to Corona
  and Altria's 8.2% stake.
