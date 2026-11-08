import { describe, expect, it } from "vitest";
import { checkSettings, lookupApiPath } from "./lookup-path";

function settings(query: string, visitorCountry?: string) {
  return checkSettings(new URLSearchParams(query), visitorCountry);
}

describe("checkSettings", () => {
  it("uses the country in the URL first", () => {
    expect(settings("country=FR", "DE").country).toBe("FR");
  });

  it("falls back to the visitor's country, then GB", () => {
    expect(settings("", "DE").country).toBe("DE");
    expect(settings("", "XX").country).toBe("GB");
    expect(settings("").country).toBe("GB");
  });

  it("keeps only the options the visitor set", () => {
    expect(settings("country=GB&date=2025-06-01&minStakePct=10&includePassive=on")).toEqual({
      country: "GB",
      date: "2025-06-01",
      minStakePct: "10",
      includePassive: true,
    });
    expect(settings("country=GB&date=&minStakePct=")).toEqual({
      country: "GB",
      includePassive: false,
    });
  });

  it("reads the chosen criteria, telling none chosen from no choice made", () => {
    expect(settings("country=GB").criteria).toBeUndefined();
    expect(
      settings("country=GB&criteria=&criteria=criterion%3Aa&criteria=criterion%3Ab").criteria,
    ).toEqual(["criterion:a", "criterion:b"]);
    expect(settings("country=GB&criteria=").criteria).toEqual([]);
  });
});

describe("lookupApiPath", () => {
  it("passes the chosen criteria, including an empty choice", () => {
    const base = { country: "GB", includePassive: false };
    expect(
      lookupApiPath("brand:persil", { ...base, criteria: ["criterion:a", "criterion:b"] }),
    ).toBe("/lookup/brand%3Apersil?country=GB&criteria=criterion%3Aa%2Ccriterion%3Ab");
    expect(lookupApiPath("brand:persil", { ...base, criteria: [] })).toBe(
      "/lookup/brand%3Apersil?country=GB&criteria=",
    );
  });

  it("passes the settings to the API, encoding the id", () => {
    expect(
      lookupApiPath("brand:kelloggs", {
        country: "US",
        date: "2025-06-01",
        minStakePct: "10",
        includePassive: true,
      }),
    ).toBe(
      "/lookup/brand%3Akelloggs?country=US&date=2025-06-01&minStakePct=10&includePassive=true",
    );
    expect(lookupApiPath("brand:persil", { country: "GB", includePassive: false })).toBe(
      "/lookup/brand%3Apersil?country=GB",
    );
  });
});
