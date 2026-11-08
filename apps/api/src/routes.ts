/**
 * The data endpoints, specified in docs/api.md. Each parses and checks its
 * input, reads what it needs from the store, and shapes the JSON; the
 * ownership answer itself comes from the data model's resolver.
 */
import {
  foldForSearch,
  type Graph,
  isCountryCode,
  type Listing,
  type Path,
  parseFullDate,
  type Query,
  type Relationship,
  type Resolution,
  resolve,
} from "@ecf/model";
import {
  allCriteria,
  findNode,
  listingFor,
  namesFor,
  relationshipsTouching,
  searchTerms,
  sourcesByIds,
  subgraphFor,
} from "./store.ts";

/** A client mistake; the message is safe to show. */
export class BadRequest extends Error {}

export class NotFound extends Error {}

const NODE_ID = /^(?:entity|brand):[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CRITERION_ID = /^criterion:[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SEARCH_LIMIT = 20;

export function nodeId(segment: string): string {
  let id: string;
  try {
    id = decodeURIComponent(segment);
  } catch {
    throw new BadRequest("the id is not validly encoded");
  }
  if (!NODE_ID.test(id)) throw new BadRequest("the id must be an entity: or brand: id");
  return id;
}

export async function search(db: D1Database, url: URL): Promise<unknown> {
  const raw = (url.searchParams.get("q") ?? "").trim();
  if (raw.length < 2 || raw.length > 100) {
    throw new BadRequest("q must be 2 to 100 characters");
  }
  return { query: raw, results: await searchTerms(db, foldForSearch(raw), SEARCH_LIMIT) };
}

export async function lookup(db: D1Database, id: string, url: URL): Promise<unknown> {
  const query = lookupQuery(id, url.searchParams);
  const echo = {
    node: id,
    date: query.date,
    country: query.country,
    minStakePct: query.minStakePct,
    includePassive: query.includePassive,
    ...(query.criteria === undefined ? {} : { criteria: query.criteria }),
  };
  const node = await findNode(db, id);
  if (node === undefined) {
    return {
      query: echo,
      node: null,
      outcome: "unknown",
      approximate: false,
      paths: [],
      listings: [],
      sources: {},
    };
  }
  const graph = await subgraphFor(db, id);
  const resolution = resolve(graph, query);
  const names = new Map([...graph.entities, ...graph.brands].map((n) => [n.id, n.name]));
  const listings = reasonsOnPaths(graph, resolution, query.criteria);
  const sourceIds = new Set([
    ...resolution.paths.flatMap((p) => p.links.flatMap((r) => r.sources)),
    ...listings.flatMap((l) => l.evidence.flatMap((e) => e.sources)),
  ]);
  return {
    query: echo,
    node: { id, kind: node.kind, name: node.record.name },
    outcome: resolution.outcome,
    approximate: resolution.approximate,
    paths: resolution.paths.map((path) => pathJson(path, names)),
    listings,
    sources: await sourcesByIds(db, [...sourceIds]),
  };
}

export async function node(db: D1Database, id: string): Promise<unknown> {
  const found = await findNode(db, id);
  if (found === undefined) throw new NotFound();
  const { heldBy, holds } = await relationshipsTouching(db, id);
  const all = [...heldBy, ...holds];
  const names = await namesFor(db, [...new Set(all.flatMap((r) => [r.from, r.to]))]);
  const listing = found.kind === "entity" ? await listingFor(db, id) : null;
  const sourceIds = [
    ...all.flatMap((r) => r.sources),
    ...(listing?.evidence.flatMap((e) => e.sources) ?? []),
  ];
  return {
    node: { id, kind: found.kind, name: found.record.name },
    listing,
    heldBy: heldBy.map((r) => linkJson(r, names)),
    holds: holds.map((r) => linkJson(r, names)),
    sources: await sourcesByIds(db, [...new Set(sourceIds)]),
  };
}

export async function criteria(db: D1Database): Promise<unknown> {
  return { criteria: await allCriteria(db) };
}

function lookupQuery(
  id: string,
  params: URLSearchParams,
): Required<Omit<Query, "criteria">> & Pick<Query, "criteria"> {
  const country = params.get("country");
  if (country === null) throw new BadRequest("country is required");
  if (!isCountryCode(country))
    throw new BadRequest("country must be an ISO 3166-1 alpha-2 code, such as GB");

  const date = params.get("date") ?? new Date().toISOString().slice(0, 10);
  if (parseFullDate(date) === undefined)
    throw new BadRequest("date must be a real date, YYYY-MM-DD");

  const pctText = params.get("minStakePct");
  const minStakePct = pctText === null ? 5 : Number(pctText);
  if (pctText !== null && (!/^\d+(?:\.\d+)?$/.test(pctText) || minStakePct > 100)) {
    throw new BadRequest("minStakePct must be a number from 0 to 100");
  }

  const passiveText = params.get("includePassive");
  if (passiveText !== null && passiveText !== "true" && passiveText !== "false") {
    throw new BadRequest("includePassive must be true or false");
  }

  const criteriaText = params.get("criteria");
  const criteria =
    criteriaText === null ? undefined : criteriaText.split(",").filter((c) => c !== "");
  if (criteria?.some((c) => !CRITERION_ID.test(c))) {
    throw new BadRequest("criteria must be comma-separated criterion: ids");
  }

  const query: Required<Omit<Query, "criteria">> & Pick<Query, "criteria"> = {
    node: id,
    date,
    country,
    minStakePct,
    includePassive: passiveText === "true",
  };
  if (criteria !== undefined) query.criteria = criteria;
  return query;
}

function pathJson(path: Path, names: Map<string, string>) {
  const listed = new Set(path.listed);
  return {
    ...(path.grade === undefined ? {} : { grade: path.grade }),
    ...(path.effectiveSharePct === undefined ? {} : { effectiveSharePct: path.effectiveSharePct }),
    approximate: path.approximate,
    entities: path.entities.map((id) => ({
      id,
      name: names.get(id) ?? id,
      listed: listed.has(id),
    })),
    links: path.links.map((r) => linkJson(r, names)),
  };
}

function linkJson(r: Relationship, names: Map<string, string>) {
  return {
    ...r,
    from: { id: r.from, name: names.get(r.from) ?? r.from },
    to: { id: r.to, name: names.get(r.to) ?? r.to },
  };
}

/**
 * The listings of the listed companies an answer's paths reach, keeping
 * only the evidence for the chosen criteria (all when none are chosen), so
 * the reasons can be shown beside each company.
 */
function reasonsOnPaths(
  graph: Graph,
  resolution: Resolution,
  criteria: readonly string[] | undefined,
): Listing[] {
  const listed = new Set(resolution.paths.flatMap((p) => p.listed));
  return graph.listings
    .filter((listing) => listed.has(listing.entity))
    .map((listing) => ({
      entity: listing.entity,
      evidence: listing.evidence.filter(
        (e) => criteria === undefined || criteria.includes(e.criterion),
      ),
    }))
    .filter((listing) => listing.evidence.length > 0);
}
