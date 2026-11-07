/**
 * Graph validation: record shapes first, then the rules that relate one
 * record to another. The data build refuses a graph with any issue. The
 * rules are specified in docs/data-model.md.
 */
import type { z } from "zod";
import { COUNTRY_CODES } from "./countries";
import { parsePartialDate, startOf } from "./dates";
import {
  type Graph,
  graphSchema,
  type Relationship,
  type RelationshipType,
  type Scope,
} from "./schema";

export type IssueCode =
  | "shape"
  | "duplicate-id"
  | "dangling-reference"
  | "wrong-target-kind"
  | "self-reference"
  | "stake-out-of-range"
  | "passive-not-allowed"
  | "date-order"
  | "missing-source"
  | "overlapping-duplicate";

export interface Issue {
  code: IssueCode;
  /** The offending record's id; for a listing, the listed entity's id. */
  id?: string;
  message: string;
}

type Kind = "entity" | "brand" | "relationship" | "source" | "criterion";

const TARGET_KIND: Record<RelationshipType, Kind> = {
  owns: "entity",
  holds_stake: "entity",
  controls_board: "entity",
  owns_brand: "brand",
  licenses_brand: "brand",
  distributes: "brand",
};

export function validateGraph(input: unknown): Issue[] {
  const parsed = graphSchema.safeParse(input);
  if (!parsed.success) return shapeIssues(input, parsed.error);
  const graph = parsed.data;
  const issues: Issue[] = [];
  const kinds = indexKinds(graph, issues);

  const expectKind = (owner: string, ref: string, kind: Kind, field: string) => {
    if (kinds.get(ref) !== kind) {
      issues.push({
        code: "dangling-reference",
        id: owner,
        message: `${field} ${ref} is not a known ${kind}`,
      });
    }
  };

  for (const r of graph.relationships) {
    expectKind(r.id, r.from, "entity", "from");
    const targetKind = kinds.get(r.to);
    if (targetKind !== "entity" && targetKind !== "brand") {
      issues.push({
        code: "dangling-reference",
        id: r.id,
        message: `to ${r.to} is not a known entity or brand`,
      });
    } else if (targetKind !== TARGET_KIND[r.type]) {
      issues.push({
        code: "wrong-target-kind",
        id: r.id,
        message: `${r.type} must point at ${article(TARGET_KIND[r.type])}, not ${article(targetKind)}`,
      });
    }
    if (r.from === r.to) {
      issues.push({ code: "self-reference", id: r.id, message: "points at its own holder" });
    }
    for (const s of r.sources) expectKind(r.id, s, "source", "source");
    if (r.sources.length === 0) {
      issues.push({ code: "missing-source", id: r.id, message: "has no source" });
    }
    checkStake(r, issues);
    if (r.passive !== undefined && r.type !== "holds_stake") {
      issues.push({
        code: "passive-not-allowed",
        id: r.id,
        message: "passive applies only to holds_stake",
      });
    }
    if (r.validTo !== undefined && start(r.validTo) <= start(r.validFrom)) {
      issues.push({ code: "date-order", id: r.id, message: "validTo must be after validFrom" });
    }
  }

  for (const listing of graph.listings) {
    const id = listing.entity;
    expectKind(id, listing.entity, "entity", "entity");
    for (const e of listing.evidence) {
      expectKind(id, e.criterion, "criterion", "criterion");
      for (const s of e.sources) expectKind(id, s, "source", "source");
      if (e.sources.length === 0) {
        issues.push({
          code: "missing-source",
          id,
          message: `evidence for ${e.criterion} has no source`,
        });
      }
    }
  }

  checkOverlaps(graph.relationships, issues);
  return issues;
}

function shapeIssues(input: unknown, error: z.ZodError): Issue[] {
  return error.issues.map((issue) => {
    const [collection, index, ...rest] = issue.path;
    const id = recordId(input, collection, index);
    const field = rest.length > 0 ? rest.join(".") : issue.path.join(".");
    const message = field === "" ? issue.message : `${field}: ${issue.message}`;
    return id === undefined ? { code: "shape", message } : { code: "shape", id, message };
  });
}

function recordId(input: unknown, collection: unknown, index: unknown): string | undefined {
  if (typeof input !== "object" || input === null) return undefined;
  if (typeof collection !== "string" || typeof index !== "number") return undefined;
  const records: unknown = (input as Record<string, unknown>)[collection];
  if (!Array.isArray(records)) return undefined;
  const record: unknown = records[index];
  if (typeof record !== "object" || record === null) return undefined;
  const fields = record as Record<string, unknown>;
  const id = fields.id ?? fields.entity;
  return typeof id === "string" ? id : undefined;
}

function indexKinds(graph: Graph, issues: Issue[]): Map<string, Kind> {
  const kinds = new Map<string, Kind>();
  const add = (id: string, kind: Kind) => {
    if (kinds.has(id)) {
      issues.push({ code: "duplicate-id", id, message: `${id} is used more than once` });
    } else {
      kinds.set(id, kind);
    }
  };
  for (const e of graph.entities) add(e.id, "entity");
  for (const b of graph.brands) add(b.id, "brand");
  for (const r of graph.relationships) add(r.id, "relationship");
  for (const s of graph.sources) add(s.id, "source");
  for (const c of graph.criteria) add(c.id, "criterion");

  const listed = new Set<string>();
  for (const listing of graph.listings) {
    if (listed.has(listing.entity)) {
      issues.push({
        code: "duplicate-id",
        id: listing.entity,
        message: `${listing.entity} has more than one listing`,
      });
    }
    listed.add(listing.entity);
  }
  return kinds;
}

function checkStake(r: Relationship, issues: Issue[]): void {
  const pct = r.stakePct;
  let problem: string | undefined;
  if (r.type === "holds_stake") {
    if (pct === undefined) problem = "holds_stake needs stakePct";
    else if (pct <= 0 || pct > 50) problem = "holds_stake must be above 0 and at most 50";
  } else if (r.type === "owns") {
    if (pct !== undefined && (pct <= 50 || pct > 100)) {
      problem = "owns must be above 50 and at most 100";
    }
  } else if (pct !== undefined) {
    problem = `${r.type} takes no stakePct`;
  }
  if (problem !== undefined) {
    issues.push({ code: "stake-out-of-range", id: r.id, message: problem });
  }
}

function checkOverlaps(relationships: Relationship[], issues: Issue[]): void {
  const groups = new Map<string, Relationship[]>();
  for (const r of relationships) {
    const key = `${r.type} ${r.from} ${r.to}`;
    const group = groups.get(key) ?? [];
    for (const other of group) {
      if (timesOverlap(r, other) && scopesOverlap(r.scope, other.scope)) {
        issues.push({
          code: "overlapping-duplicate",
          id: r.id,
          message: `overlaps ${other.id} in time and place`,
        });
      }
    }
    group.push(r);
    groups.set(key, group);
  }
}

function timesOverlap(a: Relationship, b: Relationship): boolean {
  const end = (r: Relationship) => (r.validTo === undefined ? Infinity : start(r.validTo));
  return start(a.validFrom) < end(b) && start(b.validFrom) < end(a);
}

function scopesOverlap(a: Scope, b: Scope): boolean {
  const inB = countries(b);
  return [...countries(a)].some((code) => inB.has(code));
}

function countries(scope: Scope): Set<string> {
  const included = scope.include === "world" ? COUNTRY_CODES : scope.include;
  const excluded = new Set(scope.exclude);
  return new Set(included.filter((code) => !excluded.has(code)));
}

/** Only called on dates the shape check has already accepted. */
function start(text: string): number {
  const date = parsePartialDate(text);
  if (date === undefined) throw new Error(`unchecked date ${text}`);
  return startOf(date);
}

function article(kind: string): string {
  return /^[aeiou]/.test(kind) ? `an ${kind}` : `a ${kind}`;
}
