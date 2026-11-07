import { execFile } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { buildDump } from "../src/build.ts";
import { checkData } from "../src/check.ts";
import { dataDir, GROUP, SOURCES } from "./helpers.ts";

const run = promisify(execFile);
const CLI = join(import.meta.dirname, "../src/cli.ts");

const REVERSED = `
brands:
  - { id: brand:zest, name: Zest }
  - { id: brand:apple, name: Apple }
`;

async function validGraph() {
  const dir = await dataDir({
    "groups/example.yaml": GROUP,
    "groups/more.yaml": REVERSED,
    "sources/example.yaml": SOURCES,
  });
  const { graph } = await checkData(dir);
  if (graph === undefined) throw new Error("fixture should be valid");
  return { dir, graph };
}

describe("buildDump", () => {
  it("states the data licence and sorts every collection by id", async () => {
    const { graph } = await validGraph();
    const dump = JSON.parse(buildDump(graph));
    expect(dump.licence).toBe("ODbL-1.0");
    expect(dump.licenceUrl).toBe("https://opendatacommons.org/licenses/odbl/1-0/");
    expect(dump.graph.brands.map((b: { id: string }) => b.id)).toEqual([
      "brand:apple",
      "brand:fizz",
      "brand:zest",
    ]);
    expect(dump.graph.entities.map((e: { id: string }) => e.id)).toEqual([
      "entity:child",
      "entity:parent",
    ]);
  });

  it("gives the same bytes for the same data", async () => {
    const { graph } = await validGraph();
    const again = await validGraph();
    expect(buildDump(again.graph)).toBe(buildDump(graph));
    expect(buildDump(graph).endsWith("}\n")).toBe(true);
  });
});

describe("data:build command", () => {
  it("writes the dump", async () => {
    const { dir } = await validGraph();
    const out = join(dir, "out/graph.json");
    const { stdout } = await run("node", [CLI, "build", dir, out]);
    expect(stdout).toContain("graph.json");
    expect(JSON.parse(await readFile(out, "utf8")).graph.brands).toHaveLength(3);
    const sql = await readFile(join(dir, "out/graph.sql"), "utf8");
    expect(sql.startsWith("DELETE FROM search_terms;\n")).toBe(true);
    expect(sql).toContain("INSERT INTO nodes (id, kind, name, record) VALUES ('brand:apple'");
  });

  it("refuses invalid data and writes nothing", async () => {
    const dir = await dataDir({ "groups/example.yaml": GROUP });
    const out = join(dir, "out/graph.json");
    const failure = await run("node", [CLI, "build", dir, out]).catch((error: unknown) => error);
    expect(failure).toMatchObject({ code: 1 });
    await expect(stat(out)).rejects.toMatchObject({ code: "ENOENT" });
  });
});
