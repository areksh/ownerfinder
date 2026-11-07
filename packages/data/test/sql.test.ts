import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { Graph } from "@ecf/model";
import { describe, expect, it } from "vitest";
import { graphSql } from "../src/sql.ts";

const MIGRATION = join(import.meta.dirname, "../../../apps/api/migrations/0001_graph.sql");

const graph: Graph = {
  entities: [{ id: "entity:loreal", name: "L'Oréal S.A." }],
  brands: [
    { id: "brand:ben-and-jerrys", name: "Ben & Jerry's", aliases: ["B&J", "Ben and Jerry’s"] },
  ],
  relationships: [
    {
      id: "relationship:loreal-bj",
      type: "owns_brand",
      from: "entity:loreal",
      to: "brand:ben-and-jerrys",
      validFrom: "2020",
      scope: { include: ["GB"] },
      sources: ["source:s"],
      note: "Not true; a fixture with 'quotes'.",
    },
  ],
  sources: [
    {
      id: "source:s",
      url: "https://example.org",
      title: "T",
      publisher: "P",
      retrieved: "2026-11-07",
    },
  ],
  criteria: [{ id: "criterion:x", name: "X", description: "An example." }],
  listings: [
    {
      entity: "entity:loreal",
      evidence: [
        {
          criterion: "criterion:x",
          summary: "Alleged.",
          status: "alleged",
          date: "2025",
          sources: ["source:s"],
        },
      ],
    },
  ],
};

async function loaded(statements: string[]): Promise<DatabaseSync> {
  const db = new DatabaseSync(":memory:");
  db.exec(await readFile(MIGRATION, "utf8"));
  db.exec(`${statements.join(";\n")};`);
  return db;
}

describe("graphSql", () => {
  it("loads every record into the real schema, reading back the same records", async () => {
    const db = await loaded(graphSql(graph));
    const records = (sql: string) =>
      db
        .prepare(sql)
        .all()
        .map((row) => JSON.parse(String((row as { record: string }).record)));
    expect(records("SELECT record FROM nodes WHERE kind = 'entity'")).toEqual(graph.entities);
    expect(records("SELECT record FROM nodes WHERE kind = 'brand'")).toEqual(graph.brands);
    expect(records("SELECT record FROM relationships")).toEqual(graph.relationships);
    expect(records("SELECT record FROM sources")).toEqual(graph.sources);
    expect(records("SELECT record FROM criteria")).toEqual(graph.criteria);
    expect(records("SELECT record FROM listings")).toEqual(graph.listings);
    expect(db.prepare("SELECT from_id, to_id FROM relationships").get()).toEqual({
      from_id: "entity:loreal",
      to_id: "brand:ben-and-jerrys",
    });
  });

  it("indexes folded names and aliases for search, once each", async () => {
    const db = await loaded(graphSql(graph));
    expect(db.prepare("SELECT term, node_id, label FROM search_terms ORDER BY term").all()).toEqual(
      [
        { term: "b&j", node_id: "brand:ben-and-jerrys", label: "B&J" },
        { term: "ben & jerry's", node_id: "brand:ben-and-jerrys", label: "Ben & Jerry's" },
        { term: "ben and jerry's", node_id: "brand:ben-and-jerrys", label: "Ben and Jerry’s" },
        { term: "l'oreal s.a.", node_id: "entity:loreal", label: "L'Oréal S.A." },
      ],
    );
  });

  it("replaces what was there before, so loading twice leaves one copy", async () => {
    const db = await loaded([...graphSql(graph), ...graphSql(graph)]);
    expect(db.prepare("SELECT count(*) AS n FROM nodes").get()).toEqual({ n: 2 });
    expect(db.prepare("SELECT count(*) AS n FROM search_terms").get()).toEqual({ n: 4 });
  });
});
