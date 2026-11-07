/** The published dump of the curated graph, specified in docs/data-files.md. */
import type { Graph } from "@ecf/model";

export const DATA_LICENCE = "ODbL-1.0";
export const DATA_LICENCE_URL = "https://opendatacommons.org/licenses/odbl/1-0/";

/**
 * The graph as JSON, with every collection sorted by id (listings by the
 * entity they list) and no timestamp, so the same data always gives the
 * same bytes and a diff of two dumps shows only real changes.
 */
export function buildDump(graph: Graph): string {
  const byId = <T extends { id: string }>(records: T[]) =>
    [...records].sort((a, b) => compare(a.id, b.id));
  const sorted: Graph = {
    entities: byId(graph.entities),
    brands: byId(graph.brands),
    relationships: byId(graph.relationships),
    sources: byId(graph.sources),
    criteria: byId(graph.criteria),
    listings: [...graph.listings].sort((a, b) => compare(a.entity, b.entity)),
  };
  const dump = { licence: DATA_LICENCE, licenceUrl: DATA_LICENCE_URL, graph: sorted };
  return `${JSON.stringify(dump, null, 2)}\n`;
}

/** Code-point order, independent of the machine's locale. */
function compare(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
