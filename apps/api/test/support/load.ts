import { graphSql } from "@ecf/data/sql";
import type { Graph } from "@ecf/model";

/** Replaces the database's graph with `graph`, using the deploy's own SQL. */
export async function loadGraph(db: D1Database, graph: Graph): Promise<void> {
  await db.batch(graphSql(graph).map((statement) => db.prepare(statement)));
}
