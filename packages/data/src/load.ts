/**
 * Loads the curated YAML files into one graph, remembering which file
 * each record came from. The layout is specified in docs/data-files.md.
 * Records are not checked here beyond what is needed to merge them;
 * validateGraph checks them afterwards. A record whose id another file
 * already defines is reported and left out, so it is reported once.
 */
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import type { Collection } from "@ecf/model";
import { isAlias, isNode, parseDocument, visit } from "yaml";

export interface Problem {
  file: string;
  id?: string;
  message: string;
}

/** A graph whose records have been merged but not yet validated. */
export type RawGraph = Record<Collection, Array<Record<string, unknown>>>;

export interface Loaded {
  graph: RawGraph;
  /** Record id -> file, for every record except listings. */
  origin: Map<string, string>;
  /** Listed entity id -> listing file. */
  listingOrigin: Map<string, string>;
  problems: Problem[];
}

type FileKind = "group" | "sources" | "criteria" | "listing";

const KEYS: Record<Exclude<FileKind, "listing">, Collection[]> = {
  group: ["entities", "brands", "relationships"],
  sources: ["sources"],
  criteria: ["criteria"],
};

const HOLDS: Record<Exclude<FileKind, "listing">, string> = {
  group: "a group file holds entities, brands and relationships",
  sources: "a source file holds sources",
  criteria: "criteria.yaml holds criteria",
};

export async function loadData(dir: string): Promise<Loaded> {
  const loaded: Loaded = {
    graph: {
      entities: [],
      brands: [],
      relationships: [],
      sources: [],
      criteria: [],
      listings: [],
    },
    origin: new Map(),
    listingOrigin: new Map(),
    problems: [],
  };
  const files: Array<[string, FileKind]> = [
    ...(await yamlFiles(dir, "groups", loaded)).map((f): [string, FileKind] => [f, "group"]),
    ...(await yamlFiles(dir, "sources", loaded)).map((f): [string, FileKind] => [f, "sources"]),
    ...((await exists(join(dir, "criteria.yaml")))
      ? [[join(dir, "criteria.yaml"), "criteria"] as [string, FileKind]]
      : []),
    ...(await yamlFiles(dir, "listings", loaded)).map((f): [string, FileKind] => [f, "listing"]),
  ];
  for (const [file, kind] of files) {
    const content = await parseFile(file, loaded.problems);
    if (content !== undefined) merge(dir, file, kind, content, loaded);
  }
  return loaded;
}

async function yamlFiles(dir: string, sub: string, loaded: Loaded): Promise<string[]> {
  let names: string[];
  try {
    names = await readdir(join(dir, sub));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
  const files: string[] = [];
  for (const name of names.sort()) {
    const file = join(dir, sub, name);
    if (name.endsWith(".yaml")) files.push(file);
    else loaded.problems.push({ file, message: "data files must end in .yaml" });
  }
  return files;
}

async function exists(file: string): Promise<boolean> {
  try {
    await readFile(file);
    return true;
  } catch {
    return false;
  }
}

/** Parses one file; undefined (with problems recorded) when it cannot be used. */
async function parseFile(file: string, problems: Problem[]): Promise<unknown> {
  const doc = parseDocument(await readFile(file, "utf8"), {
    merge: false,
    prettyErrors: true,
    schema: "core",
    strict: true,
    uniqueKeys: true,
  });
  const errors = [...doc.errors, ...doc.warnings];
  if (errors.length > 0) {
    for (const error of errors) {
      problems.push({ file, message: firstLine(error.message) });
    }
    return undefined;
  }
  let aliased = false;
  visit(doc, (_key, node) => {
    if (isAlias(node) || (isNode(node) && node.anchor !== undefined)) {
      aliased = true;
      return visit.BREAK;
    }
    return undefined;
  });
  if (aliased) {
    problems.push({
      file,
      message: "YAML anchors and aliases are not allowed; write each record out in full",
    });
    return undefined;
  }
  return doc.toJS();
}

function merge(dir: string, file: string, kind: FileKind, content: unknown, loaded: Loaded): void {
  if (content === null) return;
  if (!isRecord(content)) {
    loaded.problems.push({ file, message: "the file must be a mapping of keys" });
    return;
  }
  if (kind === "listing") {
    const entity = typeof content.entity === "string" ? content.entity : undefined;
    if (entity !== undefined) {
      const first = loaded.listingOrigin.get(entity);
      if (first !== undefined) {
        loaded.problems.push({
          file,
          id: entity,
          message: `also listed in ${relative(dir, first)}`,
        });
        return;
      }
      loaded.listingOrigin.set(entity, file);
    }
    loaded.graph.listings.push(content);
    return;
  }
  for (const key of Object.keys(content)) {
    if (!(KEYS[kind] as string[]).includes(key)) {
      loaded.problems.push({ file, message: `unexpected key ${key}; ${HOLDS[kind]}` });
    }
  }
  for (const collection of KEYS[kind]) {
    const records = content[collection];
    if (records === undefined || records === null) continue;
    if (!Array.isArray(records)) {
      loaded.problems.push({ file, message: `${collection} must be a list` });
      continue;
    }
    for (const record of records) {
      if (!isRecord(record)) {
        loaded.problems.push({ file, message: `each entry in ${collection} must be a mapping` });
        continue;
      }
      if (typeof record.id === "string") {
        const first = loaded.origin.get(record.id);
        if (first !== undefined && first !== file) {
          loaded.problems.push({
            file,
            id: record.id,
            message: `also defined in ${relative(dir, first)}`,
          });
          continue;
        }
        if (first === undefined) loaded.origin.set(record.id, file);
      }
      loaded.graph[collection].push(record);
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function firstLine(message: string): string {
  return message.split("\n")[0] ?? message;
}
