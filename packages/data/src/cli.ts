/**
 * The data tools, run with plain Node (types are stripped natively):
 *
 *   node packages/data/src/cli.ts check [data-dir]
 *   node packages/data/src/cli.ts build [data-dir] [out-file]
 *
 * Paths default to the repository's data/ and build/ directories.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Graph } from "@ecf/model";
import { buildDump } from "./build.ts";
import { checkData, formatProblem } from "./check.ts";

const ROOT = fileURLToPath(new URL("../../../", import.meta.url));

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

async function check(dir: string): Promise<Graph | undefined> {
  const { graph, problems } = await checkData(dir);
  for (const problem of problems) {
    console.error(formatProblem({ ...problem, file: relative(process.cwd(), problem.file) }));
  }
  if (graph === undefined) {
    console.error(plural(problems.length, "problem", "problems"));
    return undefined;
  }
  console.log(
    `Data is valid: ${[
      plural(graph.entities.length, "entity", "entities"),
      plural(graph.brands.length, "brand", "brands"),
      plural(graph.relationships.length, "relationship", "relationships"),
      plural(graph.sources.length, "source", "sources"),
    ].join(", ")}.`,
  );
  return graph;
}

async function build(dir: string, out: string): Promise<number> {
  const graph = await check(dir);
  if (graph === undefined) return 1;
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, buildDump(graph));
  console.log(`Wrote ${relative(process.cwd(), out)}`);
  return 0;
}

async function main(args: string[]): Promise<number> {
  const [command, dir, out] = args;
  const dataDir = resolve(dir ?? `${ROOT}data`);
  switch (command) {
    case "check":
      return (await check(dataDir)) === undefined ? 1 : 0;
    case "build":
      return build(dataDir, resolve(out ?? `${ROOT}build/graph.json`));
    default:
      console.error("usage: cli.ts check [data-dir] | build [data-dir] [out-file]");
      return 2;
  }
}

process.exitCode = await main(process.argv.slice(2));
