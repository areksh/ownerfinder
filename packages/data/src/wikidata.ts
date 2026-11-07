/**
 * Turns a Wikidata query response into a proposal: candidate records for
 * a curator to verify, specified in docs/data-files.md. Nothing here is
 * trusted; every record cites Wikidata and says it needs a primary
 * source.
 */
import { stringify } from "yaml";

export interface ProposedEntity {
  id: string;
  name: string;
  identifiers: { wikidata: string };
}

export interface ProposedRelationship {
  id: string;
  type: "owns" | "holds_stake" | "owns_brand";
  from: string;
  to: string;
  stakePct?: number;
  validFrom?: string;
  validTo?: string;
  scope: { include: "world" };
  sources: string[];
  note: string;
}

export interface Proposal {
  qid: string;
  name: string;
  entities: ProposedEntity[];
  brands: Array<{ id: string; name: string }>;
  relationships: ProposedRelationship[];
  sources: Array<{
    id: string;
    url: string;
    title: string;
    publisher: string;
    retrieved: string;
    licence: string;
  }>;
  skipped: { patents: number };
}

const PROPERTY_NAME: Record<string, string> = {
  P127: "owned by",
  P749: "parent organisation",
  P355: "subsidiary",
};

const PRECISION_LENGTH: Record<string, number> = { "9": 4, "10": 7, "11": 10 };

type Binding = Record<string, { value: string } | undefined>;

export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function parseProposal(qid: string, response: unknown, retrieved: string): Proposal {
  const rows = bindings(response);
  const name = rows.find((r) => r.subjectName)?.subjectName?.value ?? qid;
  const sourceId = `source:wikidata-${qid.toLowerCase()}`;
  const slugs = new Map<string, string>();
  const taken = new Map<string, string>();
  const slugFor = (item: string, label: string) => {
    const known = slugs.get(item);
    if (known !== undefined) return known;
    let slug = slugify(label) || item.toLowerCase();
    if (taken.has(slug)) slug = `${slug}-${item.toLowerCase()}`;
    slugs.set(item, slug);
    taken.set(slug, item);
    return slug;
  };

  const subject = `entity:${slugFor(qid, name)}`;
  const entities = new Map<string, ProposedEntity>([
    [subject, { id: subject, name, identifiers: { wikidata: qid } }],
  ]);
  const brands = new Map<string, { id: string; name: string }>();
  const seen = new Set<string>();
  const relationships: ProposedRelationship[] = [];
  let patents = 0;

  for (const row of rows) {
    if (row.isPatent?.value === "true") {
      patents += 1;
      continue;
    }
    const item = row.other?.value.split("/").pop() ?? "";
    const label = row.otherLabel?.value ?? item;
    const property = row.property?.value ?? "";
    const held = row.direction?.value === "held";
    const isBrand = held && row.isBrand?.value === "true";
    const other = `${isBrand ? "brand" : "entity"}:${slugFor(item, label)}`;
    if (isBrand) brands.set(other, { id: other, name: label });
    else if (!entities.has(other)) {
      entities.set(other, { id: other, name: label, identifiers: { wikidata: item } });
    }

    const notes = [
      `From Wikidata (${PROPERTY_NAME[property] ?? property}). Verify against a primary source before use; scope assumed worldwide.`,
    ];
    const proposed: ProposedRelationship = {
      id: "",
      type: "owns_brand",
      from: held ? subject : other,
      to: held ? other : subject,
      scope: { include: "world" },
      sources: [sourceId],
      note: "",
    };
    if (!isBrand) {
      const pct = percentage(row.share?.value);
      proposed.type = pct !== undefined && pct <= 50 ? "holds_stake" : "owns";
      if (pct !== undefined) proposed.stakePct = pct;
      else notes.push("Share not stated.");
    }
    const validFrom = partialDate(row.start?.value, row.startPrecision?.value);
    const validTo = partialDate(row.end?.value, row.endPrecision?.value);
    if (validFrom !== undefined) proposed.validFrom = validFrom;
    else notes.push("No start date on Wikidata.");
    if (validTo !== undefined) proposed.validTo = validTo;
    proposed.note = notes.join(" ");

    const key = JSON.stringify([
      proposed.type,
      proposed.from,
      proposed.to,
      proposed.stakePct,
      validFrom,
      validTo,
    ]);
    if (seen.has(key)) continue;
    seen.add(key);
    relationships.push(proposed);
  }

  const counts = new Map<string, number>();
  for (const r of relationships) {
    const base = `relationship:${r.from.split(":")[1]}-${r.to.split(":")[1]}`;
    const n = (counts.get(base) ?? 0) + 1;
    counts.set(base, n);
    r.id = n === 1 ? base : `${base}-${n}`;
  }

  const byId = <T extends { id: string }>(records: Iterable<T>) =>
    [...records].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const [first, ...rest] = [...entities.values()];
  return {
    qid,
    name,
    entities: first === undefined ? [] : [first, ...byId(rest)],
    brands: byId(brands.values()),
    relationships: byId(relationships),
    sources: [
      {
        id: sourceId,
        url: `https://www.wikidata.org/wiki/${qid}`,
        title: name,
        publisher: "Wikidata",
        retrieved,
        licence: "CC0-1.0",
      },
    ],
    skipped: { patents },
  };
}

export function proposalYaml(proposal: Proposal): string {
  const header = [
    `# Proposal from Wikidata for ${proposal.qid} (${proposal.name}).`,
    "# Nothing here is verified. Check every record against an annual report,",
    "# filing or register; replace the Wikidata source; fill in missing start",
    "# dates and narrow scopes; then move what holds up into data/ by hand.",
    `# Left out: ${proposal.skipped.patents} patent statements.`,
  ];
  const { entities, brands, relationships, sources } = proposal;
  return `${header.join("\n")}\n${stringify({ entities, brands, relationships, sources }, { lineWidth: 0 })}`;
}

/** Wikidata shares are meant to be fractions, but some are entered as percentages. */
function percentage(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const share = Number(value);
  if (!Number.isFinite(share) || share <= 0) return undefined;
  return Math.round((share <= 1 ? share * 100 : share) * 100) / 100;
}

/** A Wikidata time at year, month or day precision; coarser times are dropped. */
function partialDate(value: string | undefined, precision: string | undefined): string | undefined {
  const length = precision === undefined ? undefined : PRECISION_LENGTH[precision];
  if (value === undefined || length === undefined || !/^\d{4}-/.test(value)) return undefined;
  return value.slice(0, length);
}

function bindings(response: unknown): Binding[] {
  const results = (response as { results?: { bindings?: unknown } } | null)?.results?.bindings;
  if (!Array.isArray(results)) throw new TypeError("not a SPARQL JSON response");
  return results as Binding[];
}
