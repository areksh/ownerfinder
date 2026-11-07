import type { Link } from "../api.server";
import { linkSentence, when, where } from "../copy";

/** One relationship in words, citing its sources by number. */
export function LinkItem({
  link,
  sourceNumber,
}: {
  link: Link;
  sourceNumber: Map<string, number>;
}) {
  return (
    <li>
      {linkSentence(link)}, {when(link)}, {where(link.scope)}.
      {link.coverage !== undefined && <> {link.coverage}</>}
      {link.note !== undefined && <> Note: {link.note}</>}{" "}
      {link.sources.map((s) => (
        <a key={s} href={`#source-${sourceNumber.get(s)}`}>
          Source {sourceNumber.get(s)}
        </a>
      ))}
    </li>
  );
}

export function numberSources(sources: Record<string, unknown>): Map<string, number> {
  return new Map(Object.keys(sources).map((id, i) => [id, i + 1]));
}
