/**
 * Copies the built data dump into the site's static files, so it is
 * served at /data/graph.json (docs/website.md). Run before building the
 * site; `pnpm data:build` must have run first for the file to exist.
 */
import { copyFile, mkdir, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const from = fileURLToPath(new URL("../../../build/graph.json", import.meta.url));
const to = fileURLToPath(new URL("../public/data/graph.json", import.meta.url));

try {
  await stat(from);
} catch {
  console.warn("No build/graph.json yet (run pnpm data:build); /data/graph.json will be missing.");
  process.exit(0);
}
await mkdir(fileURLToPath(new URL("../public/data/", import.meta.url)), { recursive: true });
await copyFile(from, to);
console.log("Copied build/graph.json to public/data/graph.json");
