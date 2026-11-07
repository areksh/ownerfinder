/**
 * Partial dates: `YYYY`, `YYYY-MM` or `YYYY-MM-DD`, with the precision
 * kept. Sources often give only a year or a month for when a
 * relationship began or ended, and the model must not invent a day.
 */

export type Precision = "year" | "month" | "day";

/** Missing parts are 1, so a partial date names the first day of its period. */
export interface PartialDate {
  year: number;
  month: number;
  day: number;
  precision: Precision;
}

const PATTERN = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/;
const MS_PER_DAY = 86_400_000;

export function parsePartialDate(text: string): PartialDate | undefined {
  const match = PATTERN.exec(text);
  if (match === null) return undefined;
  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = monthText === undefined ? 1 : Number(monthText);
  const day = dayText === undefined ? 1 : Number(dayText);
  if (year < 1000 || month < 1 || month > 12) return undefined;
  if (day < 1 || day > daysInMonth(year, month)) return undefined;
  const precision: Precision =
    dayText !== undefined ? "day" : monthText !== undefined ? "month" : "year";
  return { year, month, day, precision };
}

/** A date with day precision, as a lookup or a retrieval date needs. */
export function parseFullDate(text: string): PartialDate | undefined {
  const date = parsePartialDate(text);
  return date?.precision === "day" ? date : undefined;
}

export function isPartialDate(text: string): boolean {
  return parsePartialDate(text) !== undefined;
}

/** The first day of the date's period, in days since 1970-01-01. */
export function startOf(date: PartialDate): number {
  return Date.UTC(date.year, date.month - 1, date.day) / MS_PER_DAY;
}

/** The day after the date's period ends, in days since 1970-01-01. */
export function endOf(date: PartialDate): number {
  switch (date.precision) {
    case "year":
      return Date.UTC(date.year + 1, 0, 1) / MS_PER_DAY;
    case "month":
      return Date.UTC(date.year, date.month, 1) / MS_PER_DAY;
    case "day":
      return startOf(date) + 1;
  }
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}
