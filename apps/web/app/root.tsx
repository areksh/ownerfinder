import {
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import type { Route } from "./+types/root";
import { FOOTER, NAV, SITE_NAME } from "./copy";

/**
 * Plain, fast and accessible (docs/website.md): system fonts, one accent
 * colour with AA contrast on white, a visible focus ring.
 */
const STYLES = `
:root { color-scheme: light; --accent: #0b5394; --muted: #555; }
* { box-sizing: border-box; }
body { font-family: system-ui, sans-serif; line-height: 1.5; margin: 0; color: #1a1a1a; background: #fff; }
.wrap { max-width: 42rem; margin: 0 auto; padding: 0 1rem; }
header, footer { border-color: #ddd; border-style: solid; border-width: 0; }
header { border-bottom-width: 1px; }
footer { border-top-width: 1px; margin-top: 3rem; color: var(--muted); font-size: 0.9rem; }
header nav ul { display: flex; flex-wrap: wrap; gap: 0 1.25rem; list-style: none; padding: 0; }
a { color: var(--accent); }
a:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible { outline: 3px solid #f9a825; outline-offset: 2px; }
.skip { position: absolute; left: -999px; }
.skip:focus { left: 1rem; top: 1rem; background: #fff; padding: 0.5rem; }
input, select, button { font: inherit; padding: 0.3rem 0.5rem; }
button { background: var(--accent); color: #fff; border: 0; border-radius: 3px; cursor: pointer; }
article { border-left: 3px solid #ddd; padding-left: 1rem; margin: 1.5rem 0; }
dt { font-weight: 600; margin-top: 0.75rem; }
dd { margin-left: 0; }
`;

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Kept out of search results until the public beta and its name. */}
        <meta name="robots" content="noindex" />
        <Meta />
        <Links />
        <style>{STYLES}</style>
      </head>
      <body>
        <a className="skip" href="#main">
          {NAV.skip}
        </a>
        <header>
          <div className="wrap">
            <nav aria-label="Main">
              <ul>
                <li>
                  <Link to="/">{SITE_NAME}</Link>
                </li>
                <li>
                  <Link to="/methodology">{NAV.methodology}</Link>
                </li>
                <li>
                  <Link to="/data">{NAV.data}</Link>
                </li>
                <li>
                  <Link to="/request">{NAV.request}</Link>
                </li>
              </ul>
            </nav>
          </div>
        </header>
        <main id="main" className="wrap">
          {children}
        </main>
        <footer>
          <div className="wrap">
            <p>
              {FOOTER}{" "}
              <a href="https://github.com/areksh/ownerfinder">Source code and data on GitHub</a>.
            </p>
          </div>
        </footer>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const status = isRouteErrorResponse(error) ? error.status : 500;
  const heading =
    status === 404
      ? "Page not found"
      : status === 400
        ? "That question could not be answered"
        : "Something went wrong";
  const detail =
    status === 404
      ? "The page you asked for does not exist."
      : status === 400 && isRouteErrorResponse(error) && typeof error.data === "string"
        ? `${error.data.charAt(0).toUpperCase()}${error.data.slice(1)}.`
        : "Please try again in a moment.";
  return (
    <>
      {/* React hoists this into <head>; route meta() does not run for errors. */}
      <title>{heading}</title>
      <h1>{heading}</h1>
      <p>{detail}</p>
    </>
  );
}
