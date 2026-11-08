import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Reasons } from "./Reasons";

afterEach(cleanup);

const evidence = (status: "alleged" | "found" | "settled" | "admitted") => ({
  criterion: "criterion:labour",
  summary: "Something happened.",
  status,
  date: "2021",
  sources: ["source:a"],
});

describe("Reasons", () => {
  it.each([
    ["alleged", "Alleged; not established, 2021."],
    ["found", "Found by a court, regulator or official inquiry, 2021."],
    ["settled", "Settled without admission, 2021."],
    ["admitted", "Admitted by the company, 2021."],
  ] as const)("says in words how established %s evidence is", (status, words) => {
    render(
      <Reasons
        evidence={[evidence(status)]}
        criteria={[]}
        sourceNumber={new Map([["source:a", 1]])}
      />,
    );
    expect(screen.getByRole("listitem").textContent).toContain(words);
  });

  it("separates the sources a piece of evidence cites", () => {
    render(
      <Reasons
        evidence={[{ ...evidence("found"), sources: ["source:a", "source:b"] }]}
        criteria={[]}
        sourceNumber={
          new Map([
            ["source:a", 1],
            ["source:b", 2],
          ])
        }
      />,
    );
    expect(screen.getByRole("listitem").textContent).toContain("Source 1, Source 2");
  });

  it("names the criterion, falling back to its id when the name is unknown", () => {
    const sourceNumber = new Map([["source:a", 1]]);
    render(
      <Reasons
        evidence={[evidence("found")]}
        criteria={[{ id: "criterion:labour", name: "Labour rights", description: "..." }]}
        sourceNumber={sourceNumber}
      />,
    );
    expect(screen.getByRole("listitem").textContent).toMatch(
      /^Labour rights: Something happened\./,
    );
    cleanup();
    render(<Reasons evidence={[evidence("found")]} criteria={[]} sourceNumber={sourceNumber} />);
    expect(screen.getByRole("listitem").textContent).toMatch(/^criterion:labour: /);
  });
});
