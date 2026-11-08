import type { Graph } from "@ecf/model";
import { fixture } from "@ecf/model/acceptance-fixture";

/**
 * The acceptance fixture with Mars's listing replaced by evidence under two
 * criteria, each citing a source that no relationship cites, so tests can
 * see which evidence and which sources an answer carries.
 */
export const withReasons: Graph = {
  ...fixture,
  sources: [
    ...fixture.sources,
    {
      id: "source:reason-a",
      url: "https://example.org/a",
      title: "Reason A",
      publisher: "Example",
      retrieved: "2026-11-08",
    },
    {
      id: "source:reason-b",
      url: "https://example.org/b",
      title: "Reason B",
      publisher: "Example",
      retrieved: "2026-11-08",
    },
  ],
  criteria: [
    ...fixture.criteria,
    { id: "criterion:other", name: "Other", description: "A second placeholder criterion." },
  ],
  listings: fixture.listings.map((listing) =>
    listing.entity !== "entity:mars"
      ? listing
      : {
          entity: "entity:mars",
          evidence: [
            {
              criterion: "criterion:example",
              summary: "Placeholder A.",
              status: "alleged",
              date: "2026",
              sources: ["source:reason-a"],
            },
            {
              criterion: "criterion:other",
              summary: "Placeholder B.",
              status: "found",
              date: "2025-03",
              sources: ["source:reason-b"],
            },
          ],
        },
  ),
};
