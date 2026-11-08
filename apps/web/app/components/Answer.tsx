import type { Criterion } from "@ecf/model";
import type { LookupAnswer } from "../api.server";
import {
  APPROXIMATE,
  chain,
  GRADE,
  OUTCOME,
  SHARE,
  TOP_OF_CHAIN,
  unknownExplanation,
  whyListed,
} from "../copy";
import { LinkItem, numberSources } from "./LinkItem";
import { Reasons } from "./Reasons";
import { Sources } from "./Sources";

/** The answer to one lookup: outcome, every path link by link, and the sources. */
export function Answer({
  answer,
  criteria = [],
}: {
  answer: LookupAnswer;
  criteria?: Criterion[];
}) {
  const outcome = OUTCOME[answer.outcome];
  const sourceNumber = numberSources(answer.sources);
  const listed = [
    ...new Map(
      answer.paths.flatMap((p) => p.entities.filter((e) => e.listed)).map((e) => [e.id, e.name]),
    ).values(),
  ];
  const name = answer.node?.name ?? answer.query.node;
  const names = new Map(
    answer.paths.flatMap((p) => p.entities).map((e) => [e.id, e.name] as const),
  );

  return (
    <section aria-labelledby="outcome">
      <h2 id="outcome">{outcome.headline}</h2>
      <p>
        {answer.outcome === "unknown"
          ? unknownExplanation(name, answer.query.country, answer.query.date)
          : outcome.explanation}
      </p>
      {listed.length > 0 && (
        <ul aria-label="Listed companies on these paths">
          {listed.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}
      {answer.listings.map((listing) => {
        const heading = whyListed(names.get(listing.entity) ?? listing.entity);
        return (
          <section key={listing.entity} aria-label={heading}>
            <h3>{heading}</h3>
            <Reasons evidence={listing.evidence} criteria={criteria} sourceNumber={sourceNumber} />
          </section>
        );
      })}
      {answer.approximate && <p>{APPROXIMATE}</p>}

      {answer.paths.map((path) => {
        const key =
          path.links.map((l) => l.id).join(" ") || path.entities.map((e) => e.id).join(" ");
        const heading = `${path.grade === undefined ? TOP_OF_CHAIN : GRADE[path.grade]}: ${chain(path.entities.map((e) => e.name))}`;
        return (
          <article key={key} aria-label={heading}>
            <h3>{heading}</h3>
            {path.effectiveSharePct !== undefined && <p>{SHARE(path.effectiveSharePct)}</p>}
            <ol>
              {path.links.map((link) => (
                <LinkItem key={link.id} link={link} sourceNumber={sourceNumber} />
              ))}
            </ol>
          </article>
        );
      })}

      <Sources sources={answer.sources} />
    </section>
  );
}
