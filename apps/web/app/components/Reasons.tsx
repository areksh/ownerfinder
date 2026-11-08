import type { Criterion, Evidence } from "@ecf/model";
import { partialDate, STATUS } from "../copy";

/**
 * Why a company is on the list: each piece of evidence under its
 * criterion, with how established it is (docs/listings.md) and its
 * sources cited by number.
 */
export function Reasons({
  evidence,
  criteria,
  sourceNumber,
}: {
  evidence: Evidence[];
  criteria: Criterion[];
  sourceNumber: Map<string, number>;
}) {
  const names = new Map(criteria.map((c) => [c.id, c.name]));
  return (
    <ul>
      {evidence.map((e) => (
        <li key={`${e.criterion} ${e.date} ${e.summary}`}>
          {names.get(e.criterion) ?? e.criterion}: {e.summary} {STATUS[e.status]},{" "}
          {partialDate(e.date)}.{" "}
          {e.sources.map((s) => (
            <a key={s} href={`#source-${sourceNumber.get(s)}`}>
              Source {sourceNumber.get(s)}
            </a>
          ))}
        </li>
      ))}
    </ul>
  );
}
