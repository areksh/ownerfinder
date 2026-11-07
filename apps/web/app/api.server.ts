/**
 * Reads the API (docs/api.md) through the service binding. The host name
 * is ignored by a service binding; only the path and query matter.
 */
import type { Criterion, Listing, Relationship, Source } from "@ecf/model";

export interface NodeRef {
  id: string;
  name: string;
}

export type Link = Omit<Relationship, "from" | "to"> & { from: NodeRef; to: NodeRef };

export interface LookupPath {
  grade?: "owned" | "controlled" | "stake" | "licensed" | "distributed";
  effectiveSharePct?: number;
  approximate: boolean;
  entities: Array<NodeRef & { listed: boolean }>;
  links: Link[];
}

export interface LookupAnswer {
  query: {
    node: string;
    date: string;
    country: string;
    minStakePct: number;
    includePassive: boolean;
    criteria?: string[];
  };
  node: (NodeRef & { kind: "entity" | "brand" }) | null;
  outcome: "linked" | "no-link" | "unknown";
  approximate: boolean;
  paths: LookupPath[];
  sources: Record<string, Source>;
}

export interface SearchAnswer {
  query: string;
  results: Array<NodeRef & { kind: "entity" | "brand"; matched: string }>;
}

export interface NodeAnswer {
  node: NodeRef & { kind: "entity" | "brand" };
  listing: Listing | null;
  heldBy: Link[];
  holds: Link[];
  sources: Record<string, Source>;
}

export interface CriteriaAnswer {
  criteria: Criterion[];
}

export type ApiResult<T> = { ok: true; body: T } | { ok: false; status: number; message: string };

export async function apiGet<T>(api: Fetcher, path: string): Promise<ApiResult<T>> {
  const response = await api.fetch(`https://api${path}`);
  if (response.ok) return { ok: true, body: (await response.json()) as T };
  const body = (await response.json().catch(() => ({}))) as { message?: string };
  return { ok: false, status: response.status, message: body.message ?? response.statusText };
}
