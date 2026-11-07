import { describe, expect, it } from "vitest";
import { endOf, isPartialDate, parseFullDate, parsePartialDate, startOf } from "../src/dates.ts";

function parsed(text: string) {
  const date = parsePartialDate(text);
  if (date === undefined) throw new Error(`expected ${text} to parse`);
  return date;
}

describe("parsePartialDate", () => {
  it("keeps the precision of a year, a month and a day", () => {
    expect(parsePartialDate("2025")).toEqual({ year: 2025, month: 1, day: 1, precision: "year" });
    expect(parsePartialDate("2025-12")).toEqual({
      year: 2025,
      month: 12,
      day: 1,
      precision: "month",
    });
    expect(parsePartialDate("2025-12-06")).toEqual({
      year: 2025,
      month: 12,
      day: 6,
      precision: "day",
    });
  });

  it.each([
    "2025-13",
    "2025-00",
    "2025-02-30",
    "2025-02-29",
    "25-01-01",
    "2025-1-1",
    "0999",
    "2025-12-06T00:00",
    " 2025",
    "",
  ])("rejects %j", (text) => {
    expect(parsePartialDate(text)).toBeUndefined();
    expect(isPartialDate(text)).toBe(false);
  });

  it("accepts a leap day in a leap year", () => {
    expect(isPartialDate("2024-02-29")).toBe(true);
  });
});

describe("parseFullDate", () => {
  it("accepts only day precision", () => {
    expect(parseFullDate("2025-12-06")?.precision).toBe("day");
    expect(parseFullDate("2025-12")).toBeUndefined();
    expect(parseFullDate("2025")).toBeUndefined();
  });
});

describe("startOf and endOf", () => {
  it("count days from the Unix epoch", () => {
    expect(startOf(parsed("1970-01-01"))).toBe(0);
    expect(startOf(parsed("1970-01-02"))).toBe(1);
  });

  it("give the first day of a period and the day after it", () => {
    const nextYear = startOf(parsed("2026-01-01"));
    expect(startOf(parsed("2025-12"))).toBe(startOf(parsed("2025-12-01")));
    expect(endOf(parsed("2025-12"))).toBe(nextYear);
    expect(endOf(parsed("2025"))).toBe(nextYear);
    expect(endOf(parsed("2025-12-31"))).toBe(nextYear);
    expect(endOf(parsed("2024-02"))).toBe(startOf(parsed("2024-03-01")));
  });
});
