import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach } from "vitest";

const made: string[] = [];

afterEach(async () => {
  await Promise.all(made.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

/** Writes `files` (relative path -> YAML text) into a fresh data directory. */
export async function dataDir(files: Record<string, string>): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "ecf-data-"));
  made.push(dir);
  for (const [path, text] of Object.entries(files)) {
    await mkdir(dirname(join(dir, path)), { recursive: true });
    await writeFile(join(dir, path), text);
  }
  return dir;
}

export const SOURCES = `
sources:
  - id: source:report
    url: https://example.org/report
    title: Annual report
    publisher: Example plc
    retrieved: "2026-11-07"
`;

export const GROUP = `
entities:
  - id: entity:parent
    name: Parent plc
  - id: entity:child
    name: Child Ltd
brands:
  - id: brand:fizz
    name: Fizz
relationships:
  - id: relationship:parent-child
    type: owns
    from: entity:parent
    to: entity:child
    validFrom: "2015-06"
    scope: { include: world }
    sources: [source:report]
  - id: relationship:child-fizz
    type: owns_brand
    from: entity:child
    to: brand:fizz
    validFrom: "2015"
    scope: { include: [GB, IE] }
    sources: [source:report]
`;
