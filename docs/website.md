# Website

The website (`apps/web`) is a server-rendered React Router app on Workers.
It reads the API (docs/api.md) through a service binding, so pages work
without client-side JavaScript; scripts only improve them. It sets no
cookies and loads nothing from third parties except the Turnstile check
on the request form.

## Pages

| Path            | What it shows                                                                                                                                                  |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`             | What the service does, a search box, and the three possible answers explained.                                                                                 |
| `/search?q=`    | Matching companies and brands, each linking to its check page.                                                                                                 |
| `/check/<id>`   | The answer for one brand or company: the outcome, every path with its links and sources, and controls for country, date, stake threshold and passive holdings. |
| `/profile/<id>` | One company or brand: what holds it and what it holds over time, its listing evidence if listed, and sources.                                                  |
| `/methodology`  | How answers are produced, what the outcomes and grades mean, and the limits of the data.                                                                       |
| `/data`         | How to download the data and its licence.                                                                                                                      |
| `/request`      | A form to request a company, brand or correction, which opens a GitHub issue for the curator.                                                                  |

The check page takes the API's lookup parameters in its query string
(`country`, `date`, `minStakePct`, `includePassive`, and `criteria`
repeated once per chosen criterion), so every
answer has a shareable URL. Without `country`, it uses the visitor's
country as Cloudflare reports it for the request, falling back to `GB`;
the chosen country is always shown and can be changed.

## Wording

The outcome headline is worded so it cannot be read as a verdict the data
does not support:

| Outcome   | Headline                            | Always followed by                                                         |
| --------- | ----------------------------------- | -------------------------------------------------------------------------- |
| `linked`  | "Linked to a listed company"        | which listed companies, and how, link by link with sources.                |
| `no-link` | "No link to a listed company found" | "This means none is recorded, not that none exists." and the owners found. |
| `unknown` | "Not in our records"                | that nothing is recorded for that country and date, and how to request it. |

Beside a linked answer, each listed company it reaches has a "Why ... is
on the list" section: every piece of evidence for the chosen criteria,
named by criterion, with its status in words and its sources cited by
number (docs/listings.md). Company profiles show the same evidence. The
check page offers one checkbox per criterion; ticking none counts no
criterion, so nothing is listed.

| Status     | Shown as                                          |
| ---------- | ------------------------------------------------- |
| `alleged`  | "Alleged; not established"                        |
| `found`    | "Found by a court, regulator or official inquiry" |
| `settled`  | "Settled without admission"                       |
| `admitted` | "Admitted by the company"                         |

Each link is described in plain words from its type: owns, holds a stake
of N% in, controls the board of, owns the brand, makes or sells it under
licence, distributes it, or, for an affiliation, "related to ..., but not owned
by it" under the grade "Related company". Licence coverage and curator notes are shown
beside the link. Approximate answers say that a date in the sources is
only known to the month or year. A link whose start is sourced
(`startKnown`) is "since" its date; any other is "known from" its date,
"when it began is not recorded". An unknown answer that has a later
record says so: "Our earliest record of who holds it there is from ...,
which may be later than when that began."

All interface text lives in one module (`app/copy.ts`) so it can be
translated later; English (British) only for now.

## Request form

The form asks what is being requested, what should change, and at least
one source URL; it asks for no personal details. Submissions are checked
with Cloudflare Turnstile, then become a GitHub issue labelled `request`
in the project repository, which the curator reviews like any other
issue. The Worker needs two secrets, `TURNSTILE_SECRET_KEY` and
`GITHUB_TOKEN` (a fine-grained token limited to creating issues in this
repository), and the variable `TURNSTILE_SITE_KEY`. Until they are set,
the page says requests are closed and links to the repository's issues.

## Data download

`/data/graph.json` is the built dump (`pnpm data:build`), copied into the
site's static assets at build time and published under the ODbL 1.0.

## Quality

- WCAG 2.2 AA: semantic HTML, labelled controls, visible focus, a skip
  link, sufficient contrast, usable without JavaScript.
- Light pages: system fonts, no images, no client-side data fetching for
  the main answer.
- Tests: component tests (Testing Library with happy-dom) for the answer
  rendering; end-to-end checks with Playwright and axe-core against the
  website and API running locally on the real data.
