import { describe, expect, it } from "vitest";
import { foldForSearch } from "../src/search.ts";

describe("foldForSearch", () => {
  it("ignores case and accents", () => {
    expect(foldForSearch("Nestlé")).toBe("nestle");
    expect(foldForSearch("NESTLE")).toBe("nestle");
    expect(foldForSearch("Mondelēz")).toBe("mondelez");
    expect(foldForSearch("Côte d'Or")).toBe("cote d'or");
  });

  it("trims and collapses whitespace", () => {
    expect(foldForSearch("  Ben  &\tJerry's ")).toBe("ben & jerry's");
  });

  it("folds typographic apostrophes to the ASCII one", () => {
    expect(foldForSearch("Kellogg’s")).toBe("kellogg's");
  });
});
