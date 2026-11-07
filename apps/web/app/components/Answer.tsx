import type { LookupAnswer } from "../api.server";
import {
  APPROXIMATE,
  chain,
  GRADE,
  linkSentence,
  OUTCOME,
  partialDate,
  SHARE,
  unknownExplanation,
  when,
  where,
} from "../copy";

/** The answer to one lookup: outcome, every path link by link, and the sources. */
export function Answer({ answer }: { answer: LookupAnswer }) {
  const outcome = OUTCOME[answer.outcome];
  const sourceIds = Object.keys(answer.sources);
  const sourceNumber = new Map(sourceIds.map((id, i) => [id, i + 1]));
  const listed = [
    ...new Map(
      answer.paths.flatMap((p) => p.entities.filter((e) => e.listed)).map((e) => [e.id, e.name]),
    ).values(),
  ];
  const name = answer.node?.name ?? answer.query.node;

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
      {answer.approximate && <p>{APPROXIMATE}</p>}

      {answer.paths.map((path) => {
        const key =
          path.links.map((l) => l.id).join(" ") || path.entities.map((e) => e.id).join(" ");
        const heading = `${path.grade === undefined ? "Top of the chain" : GRADE[path.grade]}: ${chain(path.entities.map((e) => e.name))}`;
        return (
          <article key={key} aria-label={heading}>
            <h3>{heading}</h3>
            {path.effectiveSharePct !== undefined && <p>{SHARE(path.effectiveSharePct)}</p>}
            <ol>
              {path.links.map((link) => (
                <li key={link.id}>
                  {linkSentence(link)}, {when(link)}, {where(link.scope)}.
                  {link.coverage !== undefined && <> {link.coverage}</>}
                  {link.note !== undefined && <> Note: {link.note}</>}{" "}
                  {link.sources.map((s) => (
                    <a key={s} href={`#source-${sourceNumber.get(s)}`}>
                      Source {sourceNumber.get(s)}
                    </a>
                  ))}
                </li>
              ))}
            </ol>
          </article>
        );
      })}

      {sourceIds.length > 0 && (
        <>
          <h3 id="sources">Sources</h3>
          <ol aria-label="Sources">
            {sourceIds.map((id, i) => {
              const source = answer.sources[id];
              if (source === undefined) return null;
              return (
                <li key={id} id={`source-${i + 1}`}>
                  <a href={source.url}>{source.title}</a>, {source.publisher}
                  {source.published !== undefined && <>, {partialDate(source.published)}</>}. Read
                  on {partialDate(source.retrieved)}.
                </li>
              );
            })}
          </ol>
        </>
      )}
    </section>
  );
}
