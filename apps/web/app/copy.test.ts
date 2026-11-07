import { describe, expect, it } from "vitest";
import { CHECK } from "./copy";

describe("CHECK.asked", () => {
  it("names the country as it reads in a sentence", () => {
    expect(CHECK.asked("GB", "2026-11-07")).toBe("For the United Kingdom on 7 November 2026.");
    expect(CHECK.asked("FR", "2025-12-01")).toBe("For France on 1 December 2025.");
  });
});
