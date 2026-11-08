/**
 * Every piece of interface text, in one place so it can be translated
 * later (docs/website.md). British English.
 */
import type { Scope } from "@ecf/model";
import type { Link, LookupAnswer } from "./api.server";

export const SITE_NAME = "Ownership lookup";

export const OUTCOME = {
  linked: {
    headline: "Linked to a listed company",
    explanation:
      "At least one recorded link leads to a company on the list. Each link and its sources are below.",
  },
  "no-link": {
    headline: "No link to a listed company found",
    explanation:
      "This means none is recorded, not that none exists. The owners we found are below.",
  },
  unknown: {
    headline: "Not in our records",
    explanation: "",
  },
} as const;

export const GRADE: Record<NonNullable<LookupAnswer["paths"][number]["grade"]>, string> = {
  owned: "Ownership",
  controlled: "Board control",
  stake: "Shareholding",
  licensed: "Licence",
  distributed: "Distribution",
  related: "Related company",
};

/** How established a piece of evidence is (docs/listings.md). */
export const STATUS = {
  alleged: "Alleged; not established",
  found: "Found by a court, regulator or official inquiry",
  settled: "Settled without admission",
  admitted: "Admitted by the company",
} as const;

export const whyListed = (name: string) => `Why ${name} is on the list`;

export const APPROXIMATE =
  "Some dates in the sources are only known to the month or year, so this answer may differ close to those dates.";

const regionNames = new Intl.DisplayNames(["en-GB"], { type: "region" });
const and = new Intl.ListFormat("en-GB", { type: "conjunction" });

/** Country names that read naturally after "in". */
const WITH_THE = new Set([
  "US",
  "GB",
  "NL",
  "AE",
  "PH",
  "BS",
  "GM",
  "DO",
  "CF",
  "CD",
  "KM",
  "MV",
  "MH",
  "SB",
  "VA",
]);

export function countryName(code: string): string {
  const name = regionNames.of(code) ?? code;
  return WITH_THE.has(code) ? `the ${name}` : name;
}

export function countryLabel(code: string): string {
  return regionNames.of(code) ?? code;
}

const MONTH = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
const DAY = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** "2025", "December 2025" or "26 September 2025". */
export function partialDate(text: string): string {
  const [year, month, day] = text.split("-").map(Number);
  if (month === undefined) return String(year);
  const date = new Date(Date.UTC(year ?? 0, month - 1, day ?? 1));
  return day === undefined ? MONTH.format(date) : DAY.format(date);
}

export function linkSentence(link: Link): string {
  const { from, to } = link;
  switch (link.type) {
    case "owns":
      return `${from.name} owns ${to.name}${link.stakePct === undefined ? "" : ` (${link.stakePct}%)`}`;
    case "holds_stake":
      return `${from.name} holds ${link.stakePct}% of ${to.name}${link.passive === true ? ", a passive holding" : ""}`;
    case "controls_board":
      return `${from.name} controls the board of ${to.name}`;
    case "owns_brand":
      return `${from.name} owns the ${to.name} brand`;
    case "licenses_brand":
      return `${from.name} makes or sells ${to.name} under licence`;
    case "distributes":
      return `${from.name} distributes ${to.name}`;
    case "affiliated_with":
      return `${to.name}: related to ${from.name}, but not owned by it`;
  }
}

/**
 * When a link held. "Since" is said only when a source gives the start;
 * otherwise the date is just the earliest one it is known to have held
 * (docs/data-model.md).
 */
export function when(link: Pick<Link, "validFrom" | "validTo" | "startKnown">): string {
  const from = partialDate(link.validFrom);
  if (link.startKnown === true) {
    return link.validTo === undefined
      ? `since ${from}`
      : `from ${from} until ${partialDate(link.validTo)}`;
  }
  return link.validTo === undefined
    ? `known from ${from}; when it began is not recorded`
    : `known from ${from} until ${partialDate(link.validTo)}`;
}

export function where(scope: Scope): string {
  if (scope.include === "world") {
    return scope.exclude === undefined
      ? "worldwide"
      : `worldwide except ${and.format(scope.exclude.map(countryName))}`;
  }
  const places = scope.include.filter((code) => !(scope.exclude ?? []).includes(code));
  return `in ${and.format(places.map(countryName))}`;
}

export function unknownExplanation(
  name: string,
  country: string,
  date: string,
  earliestRecord?: string,
): string {
  const nothing = `Nothing is recorded for ${name} in ${countryName(country)} on ${partialDate(date)}.`;
  return earliestRecord === undefined
    ? `${nothing} If you know who owns it, you can request it be added.`
    : `${nothing} Our earliest record of who holds it there is from ${partialDate(earliestRecord)}, which may be later than when that began. If you know who owned it then, you can request it be added.`;
}

export function chain(names: string[]): string {
  return names.join(" then ");
}

export const SHARE = (pct: number) =>
  `Indicative share through this path: ${pct}%. It ignores voting rights and share classes.`;

export const TOP_OF_CHAIN = "Top of the chain";

export const NAV = {
  skip: "Skip to content",
  home: "Search",
  methodology: "How it works",
  data: "Data",
  request: "Request a change",
};

export const FOOTER =
  "A non-profit, open-source project. The data is published under the Open Database License 1.0 and the code under the GNU AGPL 3.0.";

export const SEARCH = {
  label: "Brand or company",
  button: "Search",
  noResults: (q: string) => `Nothing matches "${q}".`,
  results: (q: string) => `Results for "${q}"`,
};

export const CHECK = {
  settings: "Change the question",
  country: "Country",
  date: "Date",
  dateHint: "Leave empty for today.",
  minStakePct: "Ignore stakes below (per cent)",
  includePassive: "Include passive holdings, such as index funds",
  criteria: "Reasons for listing to count",
  update: "Update the answer",
  profile: (name: string) => `More about ${name}`,
  asked: (country: string, date: string) => `For ${countryName(country)} on ${partialDate(date)}.`,
};

export const PROFILE = {
  heldBy: "Held by",
  holds: "Holds",
  none: "None recorded.",
  listing: "Why it is on the list",
  check: (name: string) => `Check ${name}`,
};

export const REQUEST = {
  title: "Request a change",
  intro:
    "Ask for a company or brand to be added, or for something to be corrected. Every request needs at least one source.",
  privacy:
    "Requests are published as public GitHub issues, so please do not include personal details.",
  subject: "What is it about? For example, a company or brand name",
  change: "What should be added or changed?",
  sources: "Sources: web addresses, one per line",
  send: "Send the request",
  thanks: "Thank you",
  submitted: "Your request is now an issue for the curator to review:",
  closed: "Requests cannot be taken through this form at the moment.",
  notVerified: "We could not confirm the request came from a person. Please try again.",
  failed: "Your request could not be saved. Please try again later.",
  useGitHub: "The request form is not open yet. Until it is, please",
  openIssue: "open an issue on GitHub with at least one source",
};
