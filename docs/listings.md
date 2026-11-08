# The list

A company is on the list when it has a listing: one or more pieces of
evidence, each under a criterion, each with at least one source (the
[data model](data-model.md#listing) gives the fields). This document says
which companies are listed, what the criteria are, and how evidence is
worded. The records are in `data/criteria.yaml` and `data/listings/`.

## Who is listed

The list is curated. It starts with companies that campaigns, regulators
or courts regularly single out, and grows through requests. Being listed
says that there is cited evidence under at least one criterion, not that
the project has judged the company. Readers choose which criteria count
for them, and a company with no evidence under the chosen criteria is not
treated as listed.

The criteria cover concerns raised from across the political spectrum.
A criterion is added when a concern is widely raised and can be evidenced
from citable sources, whoever raises it.

## Criteria

| Id                              | Name                   | What meets it                                                                                                                                 |
| ------------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `criterion:labour-rights`       | Labour rights          | Child labour, forced labour, or unsafe or unlawful working conditions in the company's operations or supply chain.                            |
| `criterion:environment`         | Environment            | Deforestation, pollution or other environmental damage linked to the company's operations, products or supply chain.                          |
| `criterion:climate`             | Climate                | Producing or financing fossil fuels on a large scale, or lobbying against climate policy.                                                     |
| `criterion:public-health`       | Public health          | Selling products that harm health, or marketing them in breach of health law or codes, such as tobacco or breast-milk substitutes.            |
| `criterion:consumer-protection` | Consumer protection    | Misleading claims, unsafe products or unfair treatment of customers.                                                                          |
| `criterion:competition`         | Competition            | Cartels, price fixing, or abuse of a dominant market position.                                                                                |
| `criterion:bribery`             | Bribery and corruption | Bribery, corruption, or fraud against public bodies.                                                                                          |
| `criterion:privacy`             | Privacy                | Breaches of privacy or data protection law, or unlawful collection or use of personal data.                                                   |
| `criterion:tax`                 | Tax                    | Underpaying tax, as found or alleged by a tax authority, court or legislature.                                                                |
| `criterion:sanctions`           | Sanctions              | Trading in breach of international sanctions.                                                                                                 |
| `criterion:russia`              | Business in Russia     | Continuing to operate or sell in Russia after its full-scale invasion of Ukraine in February 2022.                                            |
| `criterion:israeli-settlements` | Israeli settlements    | Business activity in Israeli settlements in the occupied Palestinian territory, as listed by the UN human rights office or alleged by others. |

## Evidence

Each piece of evidence is one event or finding: a ruling, a fine, a
settlement, a report, a statement. It has a date (when it happened or was
published), a status and a summary, and cites the source that makes the
claim: the ruling or the regulator's notice rather than a report of it,
where one is published.

| Status     | Use it when                                                           | The summary says                                                                     |
| ---------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `found`    | A court, regulator or official inquiry has decided it.                | Which body decided what, and any penalty: "The European Commission fined ..."        |
| `settled`  | The company settled a claim without admitting it.                     | That it settled, for what, and that it did not admit liability.                      |
| `admitted` | The company says so itself, in a statement, filing or plea.           | What the company said or did: "Pleaded guilty to ...", "Said it would continue ...". |
| `alleged`  | A credible party claims it, and no court or regulator has decided it. | Who alleges what, as their claim: "Greenpeace alleged in a 2020 report that ..."     |

Rules for every summary:

- **Attribute every claim.** Name who found, alleged or admitted it. The
  project never makes a claim in its own voice.
- **Say what was decided, no more.** Use the words of the decision. Do
  not add adjectives, motives or conclusions the source does not state.
- **Say what happened next.** If a finding was overturned or reduced on
  appeal, or a claim was dismissed or withdrawn, say so, or remove the
  evidence if nothing still stands. If the company denies an allegation,
  say that it denies it.
- **Name the company, not people.** Summaries name companies and public
  bodies. Individuals are named only where they are the subject of a
  public finding against them in their role at the company.
- **One fact per piece of evidence**, dated, so that it can be corrected
  or removed on its own.

Allegations need a credible source: a court filing, a regulator, a
legislature, an established non-governmental organisation's published
report, or reporting by an established news organisation. Social media
posts and anonymous claims are not used.

## Corrections

Anyone can ask for evidence to be corrected or removed through the
request form, citing a source. The curator reviews requests like any
other change. A company that disputes a summary is asked for the source
that contradicts it, and the summary is corrected, given a response, or
removed.
