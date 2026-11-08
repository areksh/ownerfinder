/**
 * Record shapes, checked at runtime because data files and API queries
 * arrive untyped. Rules that relate one record to another live in
 * `validate.ts`. The specification is docs/data-model.md.
 */
import { z } from "zod";
import { isCountryCode } from "./countries.ts";
import { isPartialDate, parseFullDate } from "./dates.ts";

const SLUG = "[a-z0-9]+(?:-[a-z0-9]+)*";

export const RECORD_KINDS = ["entity", "brand", "relationship", "source", "criterion"] as const;
export type RecordKind = (typeof RECORD_KINDS)[number];

function idOf(kind: RecordKind) {
  return z.string().regex(new RegExp(`^${kind}:${SLUG}$`), `must be a ${kind}: id`);
}

/** Any record's id; the kind a reference needs is checked by validateGraph. */
const reference = z
  .string()
  .regex(new RegExp(`^(?:${RECORD_KINDS.join("|")}):${SLUG}$`), "must be a record id");

const partialDate = z.string().refine(isPartialDate, "must be YYYY, YYYY-MM or YYYY-MM-DD");
const fullDate = z.string().refine((s) => parseFullDate(s) !== undefined, "must be YYYY-MM-DD");
const httpsUrl = z.string().refine((s) => {
  try {
    return new URL(s).protocol === "https:";
  } catch {
    return false;
  }
}, "must be an https URL");
const text = z.string().trim().min(1);

function optionalMatching(pattern: RegExp) {
  return z.string().regex(pattern).optional();
}

export const countryCodeSchema = z
  .string()
  .refine(isCountryCode, "must be an ISO 3166-1 alpha-2 code");
const countryList = z.array(countryCodeSchema).min(1);

export const scopeSchema = z.strictObject({
  include: z.union([z.literal("world"), countryList]),
  exclude: countryList.optional(),
});

export const entitySchema = z.strictObject({
  id: idOf("entity"),
  name: text,
  identifiers: z
    .strictObject({
      lei: optionalMatching(/^[A-Z0-9]{20}$/),
      wikidata: optionalMatching(/^Q[1-9]\d*$/),
      companiesHouse: optionalMatching(/^[A-Z0-9]{8}$/),
      secCik: optionalMatching(/^\d{1,10}$/),
      openCorporates: optionalMatching(/^[a-z_]+\/\S+$/),
    })
    .optional(),
});

export const brandSchema = z.strictObject({
  id: idOf("brand"),
  name: text,
  aliases: z.array(text).optional(),
});

export const RELATIONSHIP_TYPES = [
  "owns",
  "holds_stake",
  "controls_board",
  "owns_brand",
  "licenses_brand",
  "distributes",
  "affiliated_with",
] as const;

export const relationshipSchema = z.strictObject({
  id: idOf("relationship"),
  type: z.enum(RELATIONSHIP_TYPES),
  from: reference,
  to: reference,
  stakePct: z.number().finite().optional(),
  passive: z.boolean().optional(),
  validFrom: partialDate,
  /** True when a source gives the date the relationship began; otherwise
   * `validFrom` is only the earliest date it is known to have been in force. */
  startKnown: z.boolean().optional(),
  validTo: partialDate.optional(),
  scope: scopeSchema,
  sources: z.array(reference),
  coverage: text.optional(),
  note: text.optional(),
});

export const sourceSchema = z.strictObject({
  id: idOf("source"),
  url: httpsUrl,
  title: text,
  publisher: text,
  published: partialDate.optional(),
  retrieved: fullDate,
  archiveUrl: httpsUrl.optional(),
  licence: text.optional(),
});

export const criterionSchema = z.strictObject({
  id: idOf("criterion"),
  name: text,
  description: text,
});

export const EVIDENCE_STATUSES = ["alleged", "found", "settled", "admitted"] as const;

export const evidenceSchema = z.strictObject({
  criterion: reference,
  summary: text,
  status: z.enum(EVIDENCE_STATUSES),
  date: partialDate,
  sources: z.array(reference),
});

export const listingSchema = z.strictObject({
  entity: reference,
  evidence: z.array(evidenceSchema).min(1),
});

export const graphSchema = z.strictObject({
  entities: z.array(entitySchema),
  brands: z.array(brandSchema),
  relationships: z.array(relationshipSchema),
  sources: z.array(sourceSchema),
  criteria: z.array(criterionSchema),
  listings: z.array(listingSchema),
});

export type Scope = z.infer<typeof scopeSchema>;
export type Entity = z.infer<typeof entitySchema>;
export type Brand = z.infer<typeof brandSchema>;
export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];
export type Relationship = z.infer<typeof relationshipSchema>;
export type Source = z.infer<typeof sourceSchema>;
export type Criterion = z.infer<typeof criterionSchema>;
export type EvidenceStatus = (typeof EVIDENCE_STATUSES)[number];
export type Evidence = z.infer<typeof evidenceSchema>;
export type Listing = z.infer<typeof listingSchema>;
export type Graph = z.infer<typeof graphSchema>;
