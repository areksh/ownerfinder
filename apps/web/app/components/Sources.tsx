import type { Source } from "@ecf/model";
import { partialDate } from "../copy";

/** Numbered sources; links elsewhere on the page cite them as #source-N, in this order. */
export function Sources({ sources }: { sources: Record<string, Source> }) {
  const list = Object.values(sources);
  if (list.length === 0) return null;
  return (
    <>
      <h3 id="sources">Sources</h3>
      <ol aria-label="Sources">
        {list.map((source, i) => (
          <li key={source.id} id={`source-${i + 1}`}>
            <a href={source.url}>{source.title}</a>, {source.publisher}
            {source.published !== undefined && <>, {partialDate(source.published)}</>}. Read on{" "}
            {partialDate(source.retrieved)}.
          </li>
        ))}
      </ol>
    </>
  );
}
