/**
 * The request form's server side (docs/website.md): check the fields,
 * check Turnstile, then open a GitHub issue for the curator. `fetch` is
 * passed in so tests never reach Cloudflare or GitHub.
 */

export interface RequestInput {
  subject: string;
  change: string;
  sources: string[];
}

export type Parsed =
  | { ok: true; input: RequestInput }
  | { ok: false; errors: Record<string, string> };

const TURNSTILE_VERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export function parseRequestForm(form: FormData): Parsed {
  const text = (name: string) => String(form.get(name) ?? "").trim();
  const subject = text("subject");
  const change = text("change");
  const sources = text("sources")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "");
  const errors: Record<string, string> = {};
  if (subject.length < 3 || subject.length > 200)
    errors.subject = "Give a subject of 3 to 200 characters.";
  if (change.length < 10 || change.length > 5000) {
    errors.change = "Describe the change in 10 to 5,000 characters.";
  }
  if (sources.length === 0 || sources.length > 10 || !sources.every(isHttpsUrl)) {
    errors.sources = "Give 1 to 10 sources, each an https web address on its own line.";
  }
  return Object.keys(errors).length > 0
    ? { ok: false, errors }
    : { ok: true, input: { subject, change, sources } };
}

/**
 * The issue text. The requester's words go in a fence longer than any
 * run of backticks they contain, so they render as written: no headings,
 * links or @-mentions that would notify people.
 */
export function issueBody(input: RequestInput): string {
  const longest = Math.max(2, ...[...input.change.matchAll(/`+/g)].map((m) => m[0].length));
  const fence = "`".repeat(longest + 1);
  return [
    "Submitted through the website's request form.",
    "",
    "**What should change**",
    "",
    `${fence}text`,
    input.change,
    fence,
    "",
    "**Sources given**",
    "",
    ...input.sources.map((url) => `- ${url}`),
  ].join("\n");
}

export async function verifyTurnstile(
  token: string,
  secret: string,
  ip: string | undefined,
  fetcher: typeof fetch = fetch,
): Promise<boolean> {
  if (token === "") return false;
  const body = new FormData();
  body.set("secret", secret);
  body.set("response", token);
  if (ip !== undefined) body.set("remoteip", ip);
  const response = await fetcher(TURNSTILE_VERIFY, { method: "POST", body });
  const outcome = (await response.json().catch(() => ({}))) as { success?: boolean };
  return outcome.success === true;
}

export async function createIssue(
  input: RequestInput,
  github: { token: string; repo: string },
  fetcher: typeof fetch = fetch,
): Promise<string> {
  const response = await fetcher(`https://api.github.com/repos/${github.repo}/issues`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${github.token}`,
      accept: "application/vnd.github+json",
      "content-type": "application/json",
      "user-agent": "ownerfinder-website",
      "x-github-api-version": "2022-11-28",
    },
    body: JSON.stringify({
      title: `Request: ${input.subject.replaceAll("@", "(at)")}`,
      body: issueBody(input),
      labels: ["request"],
    }),
  });
  if (!response.ok) throw new Error(`GitHub refused the issue: ${response.status}`);
  return ((await response.json()) as { html_url: string }).html_url;
}

function isHttpsUrl(text: string): boolean {
  try {
    return new URL(text).protocol === "https:";
  } catch {
    return false;
  }
}
