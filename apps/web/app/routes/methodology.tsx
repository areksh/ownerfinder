import { GRADE, OUTCOME, SITE_NAME } from "../copy";

export function meta() {
  return [{ title: `How it works | ${SITE_NAME}` }];
}

export default function Methodology() {
  return (
    <>
      <h1>How it works</h1>
      <h2>Where the data comes from</h2>
      <p>
        A curator records who owns, holds stakes in, licenses or distributes each brand and company,
        from annual reports, regulatory filings, company registers and the companies' own brand
        lists. Every link cites at least one source; a link without a source is never stored.
        Automated sources such as Wikidata are used only as leads to check.
      </p>
      <h2>How an answer is worked out</h2>
      <p>
        Starting from the brand or company, every recorded link to its holders is followed, as far
        as it goes, keeping only links in force on the chosen date and in the chosen country. Each
        chain is labelled by its weakest link:
      </p>
      <ul>
        <li>{GRADE.owned}: owned outright or by a majority.</li>
        <li>{GRADE.controlled}: the board is controlled without majority ownership.</li>
        <li>
          {GRADE.stake}: a shareholding, by default of at least 5 per cent; passive holdings such as
          index funds are left out unless you include them.
        </li>
        <li>{GRADE.licensed}: the brand is made or sold under licence.</li>
        <li>{GRADE.distributed}: the products are distributed.</li>
      </ul>
      <h2>What the answers mean</h2>
      <dl>
        <dt>{OUTCOME.linked.headline}</dt>
        <dd>At least one chain reaches a listed company.</dd>
        <dt>{OUTCOME["no-link"].headline}</dt>
        <dd>{OUTCOME["no-link"].explanation}</dd>
        <dt>{OUTCOME.unknown.headline}</dt>
        <dd>Nothing is recorded for that brand, country and date.</dd>
      </dl>
      <h2>Limits</h2>
      <ul>
        <li>Ownership changes often; the data can be out of date, and corrections are welcome.</li>
        <li>
          When no source gives the date a link began, it is recorded from the date of the earliest
          source that shows it, so earlier dates may show as unknown.
        </li>
        <li>
          Shares through several companies are indicative: voting rights and share classes are
          ignored.
        </li>
      </ul>
    </>
  );
}
