import { describe, expect, it } from "vitest";
import { parseFullDate, startOf } from "../src/dates";
import { appliesIn, inForce } from "../src/scope";

function day(text: string): number {
  const date = parseFullDate(text);
  if (date === undefined) throw new Error(`bad test date ${text}`);
  return startOf(date);
}

describe("appliesIn", () => {
  it("applies a worldwide scope everywhere", () => {
    expect(appliesIn({ include: "world" }, "JP")).toBe(true);
  });

  it("applies a country list only to its countries", () => {
    const scope = { include: ["GB", "IE"] };
    expect(appliesIn(scope, "IE")).toBe(true);
    expect(appliesIn(scope, "DE")).toBe(false);
  });

  it("removes excluded countries", () => {
    expect(appliesIn({ include: "world", exclude: ["GB"] }, "GB")).toBe(false);
    expect(appliesIn({ include: "world", exclude: ["GB"] }, "DE")).toBe(true);
    expect(appliesIn({ include: ["GB", "IE"], exclude: ["IE"] }, "IE")).toBe(false);
  });
});

describe("inForce", () => {
  const demerger = { validFrom: "2000-08", validTo: "2025-12-06" };

  it("includes the first day and excludes the end day", () => {
    expect(inForce({ validFrom: "2025-12-06" }, day("2025-12-06")).inForce).toBe(true);
    expect(inForce({ validFrom: "2025-12-06" }, day("2025-12-05")).inForce).toBe(false);
    expect(inForce(demerger, day("2025-12-05")).inForce).toBe(true);
    expect(inForce(demerger, day("2025-12-06")).inForce).toBe(false);
  });

  it("is exact when the date is outside every imprecise boundary", () => {
    expect(inForce(demerger, day("2010-01-01"))).toEqual({ inForce: true, approximate: false });
    expect(inForce(demerger, day("2025-12-06"))).toEqual({ inForce: false, approximate: false });
  });

  it("is approximate inside the period of an imprecise start", () => {
    expect(inForce(demerger, day("2000-08-15"))).toEqual({ inForce: true, approximate: true });
    expect(inForce({ validFrom: "2022" }, day("2022-06-01"))).toEqual({
      inForce: true,
      approximate: true,
    });
  });

  it("is approximate inside the period of an imprecise end", () => {
    expect(inForce({ validFrom: "1998", validTo: "2022-01" }, day("2022-01-20"))).toEqual({
      inForce: false,
      approximate: true,
    });
    expect(inForce({ validFrom: "1998", validTo: "2022-01" }, day("2022-02-01"))).toEqual({
      inForce: false,
      approximate: false,
    });
  });
});
