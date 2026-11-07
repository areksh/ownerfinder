import { SearchForm } from "../components/SearchForm";
import { OUTCOME, SITE_NAME } from "../copy";

export function meta() {
  return [{ title: SITE_NAME }];
}

export default function Home() {
  return (
    <>
      <h1>{SITE_NAME}</h1>
      <p>
        Find out whether a brand or company is owned, part-owned, licensed or distributed by a
        company on a curated list, at any level of the chain, with a source for every link. The
        answer depends on the country and the date, so both are shown with every answer.
      </p>
      <SearchForm />
      <h2>The three possible answers</h2>
      <dl>
        <dt>{OUTCOME.linked.headline}</dt>
        <dd>
          A recorded chain of ownership, stakes, licences or distribution reaches a listed company.
        </dd>
        <dt>{OUTCOME["no-link"].headline}</dt>
        <dd>
          We know who owns it, and none of the recorded links reaches a listed company. It is not a
          guarantee.
        </dd>
        <dt>{OUTCOME.unknown.headline}</dt>
        <dd>We have no record for that brand in that country on that date.</dd>
      </dl>
      <p>
        The site is in development: the ownership data covers a few dozen groups, and no companies
        are listed yet.
      </p>
    </>
  );
}
