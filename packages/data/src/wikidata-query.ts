/**
 * The SPARQL query behind a Wikidata proposal. Kept apart from the
 * parser so a recorded response can be refreshed with exactly the query
 * the tool sends.
 */

export const WIKIDATA_ENDPOINT = "https://query.wikidata.org/sparql";

/** Wikidata asks automated clients to identify themselves. */
export const USER_AGENT = "ownerfinder-data-tools/0.1 (https://github.com/areksh/ownerfinder)";

export function isQid(text: string): boolean {
  return /^Q[1-9]\d*$/.test(text);
}

/**
 * One row per ownership statement touching the organisation, in either
 * direction: who owns it or is its parent ("holder"), and what it owns,
 * parents or lists as a subsidiary ("held"). Each row carries the
 * statement's share and dates, and whether the other item is a brand or
 * a patent.
 */
export function proposalQuery(qid: string): string {
  if (!isQid(qid)) throw new RangeError(`not a Wikidata item id: ${qid}`);
  return `SELECT ?subjectName ?direction ?property ?other ?otherLabel ?share
       ?start ?startPrecision ?end ?endPrecision ?isBrand ?isPatent WHERE {
  {
    VALUES ?property { "P127" "P749" }
    wd:${qid} ?claim ?st . ?st ?ps ?other .
    BIND("holder" AS ?direction)
  } UNION {
    VALUES ?property { "P127" "P749" }
    ?other ?claim ?st . ?st ?ps wd:${qid} .
    BIND("held" AS ?direction)
  } UNION {
    VALUES ?property { "P355" }
    wd:${qid} ?claim ?st . ?st ?ps ?other .
    BIND("held" AS ?direction)
  }
  BIND(IRI(CONCAT(STR(p:), ?property)) AS ?claim)
  BIND(IRI(CONCAT(STR(ps:), ?property)) AS ?ps)
  FILTER(isIRI(?other))
  OPTIONAL { ?st pq:P1107 ?share }
  OPTIONAL { ?st pqv:P580 [ wikibase:timeValue ?start; wikibase:timePrecision ?startPrecision ] }
  OPTIONAL { ?st pqv:P582 [ wikibase:timeValue ?end; wikibase:timePrecision ?endPrecision ] }
  OPTIONAL { wd:${qid} rdfs:label ?subjectName FILTER(LANG(?subjectName) = "en") }
  BIND(EXISTS { ?other wdt:P31/wdt:P279* wd:Q431289 } AS ?isBrand)
  BIND(EXISTS { ?other wdt:P31/wdt:P279* wd:Q253623 } AS ?isPatent)
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}`;
}
