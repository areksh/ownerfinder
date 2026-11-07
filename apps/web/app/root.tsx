import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";

const bodyStyle = {
  fontFamily: "system-ui, sans-serif",
  lineHeight: 1.5,
  maxWidth: "40rem",
  margin: "0 auto",
  padding: "2rem 1rem",
};

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
      </head>
      <body style={bodyStyle}>
        {children}
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
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  const heading = notFound ? "Page not found" : "Something went wrong";
  return (
    <main>
      {/* React hoists this into <head>; route meta() does not run for errors. */}
      <title>{heading}</title>
      <h1>{heading}</h1>
      <p>{notFound ? "The page you asked for does not exist." : "Please try again in a moment."}</p>
    </main>
  );
}
