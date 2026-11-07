/**
 * The data tools, run with plain Node (types are stripped natively):
 *
 *   node packages/data/src/cli.ts check [data-dir]
 *
 * Paths default to the repository's data/ and build/ directories.
 */
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { checkData, formatProblem } from "./check.ts";

const ROOT = fileURLToPath(new URL("../../../", import.meta.url));

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

async function check(dir: string): Promise<number> {
  const { graph, problems } = await checkData(dir);
  for (const problem of problems) {
    console.error(formatProblem({ ...problem, file: relative(process.cwd(), problem.file) }));
  }
  if (graph === undefined) {
    console.error(plural(problems.length, "problem", "problems"));
    return 1;
  }
  console.log(
    `Data is valid: ${[
      plural(graph.entities.length, "entity", "entities"),
      plural(graph.brands.length, "brand", "brands"),
      plural(graph.relationships.length, "relationship", "relationships"),
      plural(graph.sources.length, "source", "sources"),
    ].join(", ")}.`,
  );
  return 0;
}

async function main(args: string[]): Promise<number> {
  const [command, dir] = args;
  switch (command) {
    case "check":
      return check(resolve(dir ?? `${ROOT}data`));
    default:
      console.error("usage: cli.ts check [data-dir]");
      return 2;
  }
}

process.exitCode = await main(process.argv.slice(2));
