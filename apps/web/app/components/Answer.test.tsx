import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { Link, LookupAnswer } from "../api.server";
import { Answer } from "./Answer";

afterEach(cleanup);

const SOURCE = {
  id: "source:agreement",
  url: "https://www.sec.gov/agreement",
  title: "Brand agreement",
  publisher: "Kellogg Company",
  retrieved: "2026-11-07",
};

function link(partial: Partial<Link> & Pick<Link, "type" | "from" | "to">): Link {
  return {
    id: `relationship:${partial.from.id}-${partial.to.id}`,
    validFrom: "2023-09-29",
    scope: { include: "world" },
    sources: [SOURCE.id],
    ...partial,
  } as Link;
}

const kellanova = { id: "entity:kellanova", name: "Kellanova" };
const mars = { id: "entity:mars", name: "Mars, Incorporated" };
const wk = { id: "entity:wk-kellogg-co", name: "WK Kellogg Co" };
const ferrero = { id: "entity:ferrero", name: "Ferrero" };
const kelloggs = { id: "brand:kelloggs", name: "Kellogg's" };

function answer(partial: Partial<LookupAnswer>): LookupAnswer {
  return {
    query: {
      node: kelloggs.id,
      date: "2026-11-07",
      country: "US",
      minStakePct: 5,
      includePassive: false,
    },
    node: { ...kelloggs, kind: "brand" },
    outcome: "linked",
    approximate: false,
    paths: [],
    sources: { [SOURCE.id]: SOURCE },
    ...partial,
  };
}

const linked = answer({
  paths: [
    {
      grade: "owned",
      approximate: false,
      entities: [
        { ...kellanova, listed: false },
        { ...mars, listed: true },
      ],
      links: [
        link({ type: "owns_brand", from: kellanova, to: kelloggs }),
        link({ type: "owns", from: mars, to: kellanova, validFrom: "2025-12" }),
      ],
    },
    {
      grade: "licensed",
      approximate: false,
      entities: [
        { ...wk, listed: false },
        { ...ferrero, listed: true },
      ],
      links: [
        link({
          type: "licenses_brand",
          from: wk,
          to: kelloggs,
          scope: { include: ["US", "CA"] },
          coverage: "Exclusive, perpetual licence in North America.",
        }),
        link({ type: "owns", from: ferrero, to: wk, stakePct: 100, validFrom: "2025-09-26" }),
      ],
    },
  ],
});

describe("Answer", () => {
  it("says a brand is linked and names the listed companies", () => {
    render(<Answer answer={linked} />);
    expect(
      screen.getByRole("heading", { level: 2, name: "Linked to a listed company" }),
    ).toBeTruthy();
    const listed = screen.getByRole("list", { name: "Listed companies on these paths" });
    expect(
      within(listed)
        .getAllByRole("listitem")
        .map((li) => li.textContent),
    ).toEqual(["Mars, Incorporated", "Ferrero"]);
  });

  it("describes each link in words, with its dates, scope and coverage", () => {
    render(<Answer answer={linked} />);
    const text = document.body.textContent ?? "";
    expect(text).toContain("Kellanova owns the Kellogg's brand");
    expect(text).toContain("Mars, Incorporated owns Kellanova");
    expect(text).toContain("WK Kellogg Co makes or sells Kellogg's under licence");
    expect(text).toContain("Ferrero owns WK Kellogg Co (100%)");
    expect(text).toContain("since December 2025");
    expect(text).toContain("since 26 September 2025");
    expect(text).toContain("in the United States and Canada");
    expect(text).toContain("Exclusive, perpetual licence in North America.");
  });

  it("labels each path by its weakest link", () => {
    render(<Answer answer={linked} />);
    expect(screen.getByRole("heading", { level: 3, name: /^Ownership: / })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 3, name: /^Licence: / })).toBeTruthy();
  });

  it("describes stakes with their percentage and passive holdings as such", () => {
    const stake = answer({
      paths: [
        {
          grade: "stake",
          effectiveSharePct: 19.9,
          approximate: false,
          entities: [{ ...mars, listed: true }],
          links: [
            link({ type: "holds_stake", from: mars, to: kellanova, stakePct: 19.9, passive: true }),
          ],
        },
      ],
    });
    render(<Answer answer={stake} />);
    const text = document.body.textContent ?? "";
    expect(text).toContain("Mars, Incorporated holds 19.9% of Kellanova, a passive holding");
    expect(text).toContain("Indicative share through this path: 19.9%");
  });

  it("links every source and cites it from the links that use it", () => {
    render(<Answer answer={linked} />);
    const sources = screen.getByRole("list", { name: "Sources" });
    const anchor = within(sources).getByRole("link", { name: "Brand agreement" });
    expect(anchor.getAttribute("href")).toBe("https://www.sec.gov/agreement");
    expect(sources.textContent).toContain("Kellogg Company");
    expect(screen.getAllByRole("link", { name: "Source 1" })[0]?.getAttribute("href")).toBe(
      "#source-1",
    );
  });

  it("says no link found without implying there is none", () => {
    render(
      <Answer
        answer={answer({
          outcome: "no-link",
          paths: [
            {
              grade: "owned",
              approximate: false,
              entities: [{ ...kellanova, listed: false }],
              links: [link({ type: "owns_brand", from: kellanova, to: kelloggs })],
            },
          ],
        })}
      />,
    );
    expect(
      screen.getByRole("heading", { level: 2, name: "No link to a listed company found" }),
    ).toBeTruthy();
    expect(document.body.textContent).toContain(
      "This means none is recorded, not that none exists.",
    );
  });

  it("says when nothing is recorded, for which country and date", () => {
    render(<Answer answer={answer({ outcome: "unknown", paths: [], sources: {} })} />);
    expect(screen.getByRole("heading", { level: 2, name: "Not in our records" })).toBeTruthy();
    expect(document.body.textContent).toContain("in the United States on 7 November 2026");
  });

  it("warns when a date in the sources is only known to the month or year", () => {
    render(<Answer answer={{ ...linked, approximate: true }} />);
    expect(document.body.textContent).toContain("only known to the month or year");
  });
});
