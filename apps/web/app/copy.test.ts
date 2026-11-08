import { describe, expect, it } from "vitest";
import type { Link } from "./api.server";
import { CHECK, GRADE, linkSentence, unknownExplanation, when } from "./copy";

describe("CHECK.asked", () => {
  it("names the country as it reads in a sentence", () => {
    expect(CHECK.asked("GB", "2026-11-07")).toBe("For the United Kingdom on 7 November 2026.");
    expect(CHECK.asked("FR", "2025-12-01")).toBe("For France on 1 December 2025.");
  });
});

describe("when", () => {
  it("says since when only when the start is known", () => {
    expect(when({ validFrom: "2025-09-26", startKnown: true })).toBe("since 26 September 2025");
    expect(when({ validFrom: "1998-08", validTo: "2022-01", startKnown: true })).toBe(
      "from August 1998 until January 2022",
    );
  });

  it("otherwise says the date is only when it is first known, not when it began", () => {
    expect(when({ validFrom: "2026-11-07" })).toBe(
      "known from 7 November 2026; when it began is not recorded",
    );
    expect(when({ validFrom: "2026", validTo: "2026-12" })).toBe(
      "known from 2026 until December 2026",
    );
  });
});

describe("unknownExplanation", () => {
  it("points to the earliest later record when there is one", () => {
    expect(unknownExplanation("KitKat", "GB", "2020-06-01", "2026-11-07")).toBe(
      "Nothing is recorded for KitKat in the United Kingdom on 1 June 2020. Our earliest record of who holds it there is from 7 November 2026, which may be later than when that began. If you know who owned it then, you can request it be added.",
    );
  });

  it("asks for a request when nothing is recorded at all", () => {
    expect(unknownExplanation("Newport", "GB", "2026-11-08")).toBe(
      "Nothing is recorded for Newport in the United Kingdom on 8 November 2026. If you know who owns it, you can request it be added.",
    );
  });
});

describe("an affiliation", () => {
  const link = {
    id: "relationship:x",
    type: "affiliated_with",
    from: { id: "entity:ferrero", name: "Ferrero International S.A." },
    to: { id: "entity:affiliates", name: "Ferrero-affiliated companies" },
    validFrom: "2026-11-08",
    scope: { include: "world" },
    sources: ["source:x"],
  } as Link;

  it("says the companies are related without saying either owns the other", () => {
    expect(linkSentence(link)).toBe(
      "Ferrero-affiliated companies: related to Ferrero International S.A., but not owned by it",
    );
  });

  it("labels a chain through it as a related company", () => {
    expect(GRADE.related).toBe("Related company");
  });
});
