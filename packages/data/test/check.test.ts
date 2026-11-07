import { execFile } from "node:child_process";
import { join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { checkData, formatProblem } from "../src/check.ts";
import { loadData } from "../src/load.ts";
import { dataDir, GROUP, SOURCES } from "./helpers.ts";

const run = promisify(execFile);
const CLI = join(import.meta.dirname, "../src/cli.ts");

async function problems(files: Record<string, string>): Promise<string[]> {
  const dir = await dataDir(files);
  const { problems } = await checkData(dir);
  return problems.map(formatProblem).map((line) => line.replace(`${dir}/`, ""));
}

describe("loadData", () => {
  it("merges every file into one graph and remembers where each record came from", async () => {
    const dir = await dataDir({ "groups/example.yaml": GROUP, "sources/example.yaml": SOURCES });
    const { graph, origin, problems } = await loadData(dir);
    expect(problems).toEqual([]);
    expect(graph.entities.map((e) => e.id)).toEqual(["entity:parent", "entity:child"]);
    expect(graph.relationships).toHaveLength(2);
    expect(graph.sources).toHaveLength(1);
    expect(graph.criteria).toEqual([]);
    expect(graph.listings).toEqual([]);
    expect(origin.get("brand:fizz")).toBe(join(dir, "groups/example.yaml"));
    expect(origin.get("source:report")).toBe(join(dir, "sources/example.yaml"));
  });

  it("reads criteria and listing files", async () => {
    const dir = await dataDir({
      "groups/example.yaml": GROUP,
      "sources/example.yaml": SOURCES,
      "criteria.yaml": "criteria:\n  - { id: criterion:x, name: X, description: An example. }\n",
      "listings/parent.yaml": `
entity: entity:parent
evidence:
  - criterion: criterion:x
    summary: Alleged by an example party.
    status: alleged
    date: "2025"
    sources: [source:report]
`,
    });
    const { graph, origin } = await loadData(dir);
    expect(graph.criteria.map((c) => c.id)).toEqual(["criterion:x"]);
    expect(graph.listings.map((l) => l.entity)).toEqual(["entity:parent"]);
    expect(origin.get("entity:parent")).toBe(join(dir, "groups/example.yaml"));
  });

  it("treats a missing data directory as empty", async () => {
    const dir = await dataDir({});
    const { graph, problems } = await loadData(join(dir, "nowhere"));
    expect(problems).toEqual([]);
    expect(graph.entities).toEqual([]);
  });
});

describe("checkData", () => {
  it("passes valid data", async () => {
    expect(
      await problems({ "groups/example.yaml": GROUP, "sources/example.yaml": SOURCES }),
    ).toEqual([]);
  });

  it("reports an unsourced relationship with its file and id", async () => {
    const unsourced = GROUP.replace(
      '    validFrom: "2015-06"\n    scope: { include: world }\n    sources: [source:report]',
      '    validFrom: "2015-06"\n    scope: { include: world }\n    sources: []',
    );
    expect(
      await problems({ "groups/example.yaml": unsourced, "sources/example.yaml": SOURCES }),
    ).toEqual(["groups/example.yaml: relationship:parent-child: has no source"]);
  });

  it("explains a bare year that YAML read as a number", async () => {
    const bare = GROUP.replace('validFrom: "2015"', "validFrom: 2015");
    const [line, ...rest] = await problems({
      "groups/example.yaml": bare,
      "sources/example.yaml": SOURCES,
    });
    expect(rest).toEqual([]);
    expect(line).toMatch(/^groups\/example\.yaml: relationship:child-fizz: validFrom: .*quote/);
  });

  it("reports a record defined in two files, naming both", async () => {
    expect(
      await problems({
        "groups/a.yaml": GROUP,
        "groups/b.yaml": "brands:\n  - { id: brand:fizz, name: Fizz again }\n",
        "sources/example.yaml": SOURCES,
      }),
    ).toEqual(["groups/b.yaml: brand:fizz: also defined in groups/a.yaml"]);
  });

  it("refuses YAML anchors and aliases", async () => {
    const aliased = `${GROUP}\n  - &dup { id: relationship:x, type: owns, from: entity:parent, to: entity:child, validFrom: "2020", scope: { include: world }, sources: [source:report] }\n`;
    const result = await problems({
      "groups/example.yaml": aliased,
      "sources/example.yaml": SOURCES,
    });
    expect(result).toEqual([
      expect.stringMatching(/^groups\/example\.yaml: .*anchors and aliases/),
    ]);
  });

  it("refuses a duplicate key", async () => {
    const result = await problems({
      "groups/example.yaml": "brands:\n  - id: brand:a\n    id: brand:b\n    name: A\n",
    });
    expect(result).toEqual([
      expect.stringMatching(/^groups\/example\.yaml: .*[Mm]ap keys must be unique/),
    ]);
  });

  it("reports a syntax error with its file", async () => {
    const result = await problems({ "groups/example.yaml": "brands: [unclosed\n" });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatch(/^groups\/example\.yaml: /);
  });

  it("reports keys that do not belong in a file of that kind", async () => {
    expect(
      await problems({
        "groups/example.yaml": `${GROUP}\nsources: []\n`,
        "sources/example.yaml": SOURCES,
      }),
    ).toEqual([
      "groups/example.yaml: unexpected key sources; a group file holds entities, brands and relationships",
    ]);
  });

  it("reports a file that is not YAML", async () => {
    expect(await problems({ "groups/notes.txt": "x", "groups/example.yml": "brands: []" })).toEqual(
      [
        "groups/example.yml: data files must end in .yaml",
        "groups/notes.txt: data files must end in .yaml",
      ],
    );
  });
});

describe("data:check command", () => {
  it("exits non-zero and prints the problem for an unsourced relationship", async () => {
    const dir = await dataDir({
      "groups/example.yaml": GROUP.replaceAll("sources: [source:report]", "sources: []"),
      "sources/example.yaml": SOURCES,
    });
    const failure = await run("node", [CLI, "check", dir]).catch((error: unknown) => error);
    expect(failure).toMatchObject({ code: 1 });
    expect((failure as { stderr: string }).stderr).toContain(
      "relationship:parent-child: has no source",
    );
  });

  it("exits zero and summarises valid data", async () => {
    const dir = await dataDir({ "groups/example.yaml": GROUP, "sources/example.yaml": SOURCES });
    const { stdout } = await run("node", [CLI, "check", dir]);
    expect(stdout).toContain("2 entities, 1 brand, 2 relationships, 1 source");
  });
});
