/** Whether a relationship applies in a country and on a day. */
import { endOf, type PartialDate, parsePartialDate, startOf } from "./dates.ts";
import type { Relationship, Scope } from "./schema.ts";

export function appliesIn(scope: Scope, country: string): boolean {
  const included = scope.include === "world" || scope.include.includes(country);
  return included && !(scope.exclude ?? []).includes(country);
}

export interface InForce {
  inForce: boolean;
  /**
   * True when the day falls inside the period of an imprecise boundary
   * (`2025-12` asked about on 2025-12-15), so the answer could be either way.
   */
  approximate: boolean;
}

/**
 * `day` counts days since 1970-01-01. A relationship is in force from the
 * first day of `validFrom` up to, not including, the first day of `validTo`.
 */
export function inForce(r: Pick<Relationship, "validFrom" | "validTo">, day: number): InForce {
  const from = parse(r.validFrom);
  const to = r.validTo === undefined ? undefined : parse(r.validTo);
  return {
    inForce: startOf(from) <= day && (to === undefined || day < startOf(to)),
    approximate: blurs(from, day) || (to !== undefined && blurs(to, day)),
  };
}

function blurs(date: PartialDate, day: number): boolean {
  return date.precision !== "day" && startOf(date) <= day && day < endOf(date);
}

function parse(text: string): PartialDate {
  const date = parsePartialDate(text);
  if (date === undefined) throw new RangeError(`invalid partial date ${JSON.stringify(text)}`);
  return date;
}
