/**
 * Reads the graph from D1 (ADR 11). Rows hold records whole as JSON in
 * the data model's shape; these queries only choose which records to
 * read. Every answer about ownership is left to the model's resolver.
 */
import type { Brand, Criterion, Entity, Graph, Listing, Relationship, Source } from "@ecf/model";

export type NodeRecord = { kind: "entity"; record: Entity } | { kind: "brand"; record: Brand };

/** The node and every holder that can reach it, transitively. UNION stops at cycles. */
const UP = `WITH RECURSIVE up(id) AS (
  SELECT ?1
  UNION
  SELECT r.from_id FROM relationships r JOIN up ON r.to_id = up.id
)`;

interface RecordRow {
  record: string;
}

function parse<T>(rows: RecordRow[]): T[] {
  return rows.map((row) => JSON.parse(row.record) as T);
}

export async function findNode(db: D1Database, id: string): Promise<NodeRecord | undefined> {
  const row = await db
    .prepare("SELECT kind, record FROM nodes WHERE id = ?1")
    .bind(id)
    .first<{ kind: "entity" | "brand"; record: string }>();
  if (row === null) return undefined;
  return row.kind === "entity"
    ? { kind: "entity", record: JSON.parse(row.record) as Entity }
    : { kind: "brand", record: JSON.parse(row.record) as Brand };
}

/** The part of the graph a lookup on `id` can reach, plus all criteria. */
export async function subgraphFor(db: D1Database, id: string): Promise<Graph> {
  const [relationships, nodes, listings, criteria] = await db.batch<RecordRow & { kind?: string }>([
    db
      .prepare(`${UP} SELECT record FROM relationships WHERE to_id IN (SELECT id FROM up)`)
      .bind(id),
    db.prepare(`${UP} SELECT kind, record FROM nodes WHERE id IN (SELECT id FROM up)`).bind(id),
    db.prepare(`${UP} SELECT record FROM listings WHERE entity_id IN (SELECT id FROM up)`).bind(id),
    db.prepare("SELECT record FROM criteria ORDER BY id"),
  ]);
  const nodeRows = nodes?.results ?? [];
  return {
    entities: parse<Entity>(nodeRows.filter((row) => row.kind === "entity")),
    brands: parse<Brand>(nodeRows.filter((row) => row.kind === "brand")),
    relationships: parse<Relationship>(relationships?.results ?? []),
    sources: [],
    criteria: parse<Criterion>(criteria?.results ?? []),
    listings: parse<Listing>(listings?.results ?? []),
  };
}

export async function relationshipsTouching(
  db: D1Database,
  id: string,
): Promise<{ heldBy: Relationship[]; holds: Relationship[] }> {
  const [heldBy, holds] = await db.batch<RecordRow>([
    db.prepare("SELECT record FROM relationships WHERE to_id = ?1 ORDER BY id").bind(id),
    db.prepare("SELECT record FROM relationships WHERE from_id = ?1 ORDER BY id").bind(id),
  ]);
  return {
    heldBy: parse<Relationship>(heldBy?.results ?? []),
    holds: parse<Relationship>(holds?.results ?? []),
  };
}

export async function namesFor(db: D1Database, ids: string[]): Promise<Map<string, string>> {
  const { results } = await db
    .prepare("SELECT id, name FROM nodes WHERE id IN (SELECT value FROM json_each(?1))")
    .bind(JSON.stringify(ids))
    .all<{ id: string; name: string }>();
  return new Map(results.map((row) => [row.id, row.name]));
}

export async function sourcesByIds(db: D1Database, ids: string[]): Promise<Record<string, Source>> {
  const { results } = await db
    .prepare("SELECT record FROM sources WHERE id IN (SELECT value FROM json_each(?1)) ORDER BY id")
    .bind(JSON.stringify(ids))
    .all<RecordRow>();
  return Object.fromEntries(parse<Source>(results).map((source) => [source.id, source]));
}

export async function listingFor(db: D1Database, entity: string): Promise<Listing | null> {
  const row = await db
    .prepare("SELECT record FROM listings WHERE entity_id = ?1")
    .bind(entity)
    .first<RecordRow>();
  return row === null ? null : (JSON.parse(row.record) as Listing);
}

export async function allCriteria(db: D1Database): Promise<Criterion[]> {
  const { results } = await db.prepare("SELECT record FROM criteria ORDER BY id").all<RecordRow>();
  return parse<Criterion>(results);
}

export interface SearchResult {
  id: string;
  kind: "entity" | "brand";
  name: string;
  matched: string;
}

/**
 * Nodes whose folded name or alias contains `folded`: exact matches
 * first, then those starting with it, then the rest, each by name. A node
 * matched by several terms appears once, under its best match.
 */
export async function searchTerms(
  db: D1Database,
  folded: string,
  limit: number,
): Promise<SearchResult[]> {
  const escaped = folded.replace(/[\\%_]/g, (c) => `\\${c}`);
  const { results } = await db
    .prepare(
      `SELECT t.node_id AS id, n.kind AS kind, n.name AS name, t.label AS matched,
              CASE WHEN t.term = ?1 THEN 0 WHEN t.term LIKE ?2 ESCAPE '\\' THEN 1 ELSE 2 END AS rank
         FROM search_terms t JOIN nodes n ON n.id = t.node_id
        WHERE t.term LIKE ?3 ESCAPE '\\'
        ORDER BY rank, n.name, t.label
        LIMIT ?4`,
    )
    .bind(folded, `${escaped}%`, `%${escaped}%`, limit * 4)
    .all<SearchResult & { rank: number }>();
  const seen = new Set<string>();
  const best: SearchResult[] = [];
  for (const { rank: _rank, ...result } of results) {
    if (seen.has(result.id)) continue;
    seen.add(result.id);
    best.push(result);
  }
  return best.slice(0, limit);
}
