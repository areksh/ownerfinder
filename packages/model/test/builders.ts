import type { Graph, Relationship, RelationshipType } from "../src/schema";

/** The one source every built relationship and evidence item cites. */
export const SOURCE_ID = "source:test";
export const CRITERION_ID = "criterion:example";

function slug(id: string): string {
  return id.slice(id.indexOf(":") + 1);
}

/**
 * A relationship with test defaults: in force since 2000, worldwide,
 * citing the test source. `extra` overrides any field.
 */
export function rel(
  type: RelationshipType,
  from: string,
  to: string,
  extra: Partial<Relationship> = {},
): Relationship {
  return {
    id: `relationship:${type.replaceAll("_", "-")}-${slug(from)}-${slug(to)}`,
    type,
    from,
    to,
    validFrom: "2000",
    scope: { include: "world" },
    sources: [SOURCE_ID],
    ...extra,
  };
}

export interface GraphSpec {
  entities?: string[];
  brands?: string[];
  relationships?: Relationship[];
  /** Entity ids to list, under the example criterion or the one given. */
  listed?: Array<string | { entity: string; criterion: string }>;
  criteria?: string[];
}

/** A graph whose names, source, criteria and listings are filled in. */
export function graph(spec: GraphSpec): Graph {
  const criteria = spec.criteria ?? [CRITERION_ID];
  return {
    entities: (spec.entities ?? []).map((id) => ({ id, name: slug(id) })),
    brands: (spec.brands ?? []).map((id) => ({ id, name: slug(id) })),
    relationships: spec.relationships ?? [],
    sources: [
      {
        id: SOURCE_ID,
        url: "https://example.org/test",
        title: "Test source",
        publisher: "Test",
        retrieved: "2026-11-07",
      },
    ],
    criteria: criteria.map((id) => ({ id, name: slug(id), description: "Test criterion." })),
    listings: (spec.listed ?? []).map((item) => {
      const { entity, criterion } =
        typeof item === "string" ? { entity: item, criterion: CRITERION_ID } : item;
      return {
        entity,
        evidence: [
          {
            criterion,
            summary: "Test evidence.",
            status: "alleged" as const,
            date: "2025",
            sources: [SOURCE_ID],
          },
        ],
      };
    }),
  };
}
