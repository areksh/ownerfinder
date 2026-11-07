/**
 * The SQL that replaces D1's copy of the graph (docs/api.md, ADR 11).
 * Pure: no Node APIs, so the API's tests can load fixtures with the
 * same statements the deploy runs.
 */
import { foldForSearch, type Graph } from "@ecf/model";

/** Child tables first, so the deletes never leave a dangling reference. */
const TABLES = ["search_terms", "listings", "criteria", "sources", "relationships", "nodes"];

export function graphSql(graph: Graph): string[] {
  const statements = TABLES.map((table) => `DELETE FROM ${table}`);
  const insert = (table: string, columns: string, values: string[]) =>
    statements.push(`INSERT INTO ${table} (${columns}) VALUES (${values.map(literal).join(", ")})`);
  const terms = (id: string, labels: string[]) => {
    for (const label of labels) {
      statements.push(
        `INSERT OR IGNORE INTO search_terms (term, node_id, label) VALUES (${[foldForSearch(label), id, label].map(literal).join(", ")})`,
      );
    }
  };

  for (const e of graph.entities) {
    insert("nodes", "id, kind, name, record", [e.id, "entity", e.name, JSON.stringify(e)]);
    terms(e.id, [e.name]);
  }
  for (const b of graph.brands) {
    insert("nodes", "id, kind, name, record", [b.id, "brand", b.name, JSON.stringify(b)]);
    terms(b.id, [b.name, ...(b.aliases ?? [])]);
  }
  for (const r of graph.relationships)
    insert("relationships", "id, from_id, to_id, record", [r.id, r.from, r.to, JSON.stringify(r)]);
  for (const s of graph.sources) insert("sources", "id, record", [s.id, JSON.stringify(s)]);
  for (const c of graph.criteria) insert("criteria", "id, record", [c.id, JSON.stringify(c)]);
  for (const l of graph.listings)
    insert("listings", "entity_id, record", [l.entity, JSON.stringify(l)]);
  return statements;
}

/** A SQL string literal: the only escape SQLite needs is doubling quotes. */
function literal(text: string): string {
  return `'${text.replaceAll("'", "''")}'`;
}
