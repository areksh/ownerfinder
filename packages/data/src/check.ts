/** Loads the data files and validates them as one graph. */
import { type Graph, graphSchema, validateGraph } from "@ecf/model";
import { loadData, type Problem } from "./load.ts";

export interface Checked {
  /** The validated graph, present only when there are no problems. */
  graph?: Graph;
  problems: Problem[];
}

export async function checkData(dir: string): Promise<Checked> {
  const loaded = await loadData(dir);
  const problems = [...loaded.problems];
  for (const issue of validateGraph(loaded.graph)) {
    const origins = issue.collection === "listings" ? loaded.listingOrigin : loaded.origin;
    const file = (issue.id === undefined ? undefined : origins.get(issue.id)) ?? dir;
    const problem: Problem = { file, message: withHint(issue.message) };
    if (issue.id !== undefined) problem.id = issue.id;
    problems.push(problem);
  }
  return problems.length === 0
    ? { graph: graphSchema.parse(loaded.graph), problems }
    : { problems };
}

export function formatProblem(problem: Problem): string {
  return problem.id === undefined
    ? `${problem.file}: ${problem.message}`
    : `${problem.file}: ${problem.id}: ${problem.message}`;
}

/** YAML reads a bare 2015 as a number; say how to fix it. */
function withHint(message: string): string {
  return /expected string, received number/.test(message)
    ? `${message}; quote it in YAML, for example "2015"`
    : message;
}
