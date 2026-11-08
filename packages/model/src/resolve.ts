/**
 * Answers a lookup: how does a brand or entity connect, on a date and in
 * a country, to a listed company? The rules are specified in
 * docs/data-model.md. The graph is assumed to have passed validateGraph.
 */
import { isCountryCode } from "./countries.ts";
import { parseFullDate, startOf } from "./dates.ts";
import type { Graph, Relationship, RelationshipType } from "./schema.ts";
import { appliesIn, inForce } from "./scope.ts";

export interface Query {
  /** An entity or brand id. */
  node: string;
  /** The day asked about, `YYYY-MM-DD`. */
  date: string;
  /** ISO 3166-1 alpha-2 code of the country asked about. */
  country: string;
  /** Criterion ids that make a listing count; absent means all. */
  criteria?: readonly string[];
  /** Stakes below this percentage are ignored. Default 5. */
  minStakePct?: number;
  /** Passive stakes are ignored unless this is true. */
  includePassive?: boolean;
}

export type Grade = "owned" | "controlled" | "stake" | "licensed" | "distributed" | "related";

export interface Path {
  /** Relationships walked, from the node outwards. */
  links: Relationship[];
  /** Entities on the path in order, starting with the node if it is an entity. */
  entities: string[];
  /** The listed entities on the path, in path order. */
  listed: string[];
  /** The weakest link's grade; absent for an entity that is its own ultimate holder. */
  grade?: Grade;
  /** Indicative share through stakes; present only when the path has a stake. */
  effectiveSharePct?: number;
  approximate: boolean;
}

export interface Resolution {
  outcome: "linked" | "no-link" | "unknown";
  /** Strongest grade first, then shortest. */
  paths: Path[];
  /** A path is approximate, or a link was left out only by an imprecise date. */
  approximate: boolean;
}

export const DEFAULT_MIN_STAKE_PCT = 5;

const GRADE_OF: Record<RelationshipType, Grade> = {
  owns: "owned",
  owns_brand: "owned",
  controls_board: "controlled",
  holds_stake: "stake",
  licenses_brand: "licensed",
  distributes: "distributed",
  affiliated_with: "related",
};

const GRADES: readonly Grade[] = [
  "owned",
  "controlled",
  "stake",
  "licensed",
  "distributed",
  "related",
];

export function resolve(graph: Graph, query: Query): Resolution {
  const day = checkedDay(query);
  const minStakePct = query.minStakePct ?? DEFAULT_MIN_STAKE_PCT;
  const entityIds = new Set(graph.entities.map((e) => e.id));
  const isBrand = graph.brands.some((b) => b.id === query.node);
  if (!isBrand && !entityIds.has(query.node)) {
    return { outcome: "unknown", paths: [], approximate: false };
  }

  const listed = listedEntities(graph, query.criteria);
  const holdersOf = new Map<string, Relationship[]>();
  for (const r of graph.relationships) {
    holdersOf.set(r.to, [...(holdersOf.get(r.to) ?? []), r]);
  }

  let leftOutApproximately = false;
  const approximateLinks = new Set<string>();

  const kept = (r: Relationship): boolean => {
    if (!appliesIn(r.scope, query.country)) return false;
    if (r.type === "holds_stake") {
      if ((r.stakePct ?? 0) < minStakePct) return false;
      if (r.passive === true && query.includePassive !== true) return false;
    }
    const timing = inForce(r, day);
    if (timing.approximate) {
      if (timing.inForce) approximateLinks.add(r.id);
      else leftOutApproximately = true;
    }
    return timing.inForce;
  };

  const paths: Path[] = [];
  const walk = (node: string, links: Relationship[], seen: ReadonlySet<string>) => {
    const holders = (holdersOf.get(node) ?? []).filter((r) => kept(r) && !seen.has(r.from));
    if (holders.length === 0) {
      if (entityIds.has(node))
        paths.push(toPath(isBrand ? [] : [query.node], links, listed, approximateLinks));
      return;
    }
    for (const r of holders) walk(r.from, [...links, r], new Set([...seen, r.from]));
  };
  walk(query.node, [], new Set([query.node]));

  paths.sort((a, b) => rank(a.grade) - rank(b.grade) || a.links.length - b.links.length);
  const outcome =
    paths.length === 0 ? "unknown" : paths.some((p) => p.listed.length > 0) ? "linked" : "no-link";
  return {
    outcome,
    paths,
    approximate: leftOutApproximately || paths.some((p) => p.approximate),
  };
}

function checkedDay(query: Query): number {
  const date = parseFullDate(query.date);
  if (date === undefined) throw new RangeError(`date must be YYYY-MM-DD, got ${query.date}`);
  if (!isCountryCode(query.country)) {
    throw new RangeError(`country must be an ISO 3166-1 alpha-2 code, got ${query.country}`);
  }
  const pct = query.minStakePct;
  if (pct !== undefined && !(pct >= 0 && pct <= 100)) {
    throw new RangeError(`minStakePct must be from 0 to 100, got ${pct}`);
  }
  return startOf(date);
}

function listedEntities(graph: Graph, criteria: readonly string[] | undefined): Set<string> {
  const chosen = criteria === undefined ? undefined : new Set(criteria);
  return new Set(
    graph.listings
      .filter((l) => chosen === undefined || l.evidence.some((e) => chosen.has(e.criterion)))
      .map((l) => l.entity),
  );
}

function toPath(
  start: string[],
  links: Relationship[],
  listed: ReadonlySet<string>,
  approximateLinks: ReadonlySet<string>,
): Path {
  const entities = [...start, ...links.map((r) => r.from)];
  const path: Path = {
    links,
    entities,
    listed: entities.filter((id) => listed.has(id)),
    approximate: links.some((r) => approximateLinks.has(r.id)),
  };
  const grade = weakest(links);
  if (grade !== undefined) path.grade = grade;
  const share = effectiveShare(links);
  if (share !== undefined) path.effectiveSharePct = share;
  return path;
}

function weakest(links: Relationship[]): Grade | undefined {
  let worst: Grade | undefined;
  for (const r of links) {
    const grade = GRADE_OF[r.type];
    if (worst === undefined || rank(grade) > rank(worst)) worst = grade;
  }
  return worst;
}

/**
 * The product of the shares along the path's company links, as a
 * percentage. Indicative only: it ignores voting rights and share
 * classes. Undefined without a stake, or through board control or an
 * affiliation, which carry no share.
 */
function effectiveShare(links: Relationship[]): number | undefined {
  if (!links.some((r) => r.type === "holds_stake")) return undefined;
  let share = 1;
  for (const r of links) {
    if (r.type === "controls_board" || r.type === "affiliated_with") return undefined;
    if (r.type === "owns" || r.type === "holds_stake") share *= (r.stakePct ?? 100) / 100;
  }
  return Math.round(share * 10_000) / 100;
}

function rank(grade: Grade | undefined): number {
  return grade === undefined ? -1 : GRADES.indexOf(grade);
}
