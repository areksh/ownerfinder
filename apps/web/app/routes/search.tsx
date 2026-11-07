import { data, Link } from "react-router";
import { apiGet, type SearchAnswer } from "../api.server";
import { SearchForm } from "../components/SearchForm";
import { cloudflareContext } from "../context";
import { SEARCH, SITE_NAME } from "../copy";
import type { Route } from "./+types/search";

export async function loader({ request, context }: Route.LoaderArgs) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const { env } = context.get(cloudflareContext);
  const result = await apiGet<SearchAnswer>(env.API, `/search?q=${encodeURIComponent(q)}`);
  if (!result.ok) throw data(result.message, { status: result.status === 400 ? 400 : 502 });
  return result.body;
}

export function meta({ loaderData: answer }: Route.MetaArgs) {
  return [
    { title: answer === undefined ? SITE_NAME : `${SEARCH.results(answer.query)} | ${SITE_NAME}` },
  ];
}

export default function Search({ loaderData }: Route.ComponentProps) {
  const { query, results } = loaderData;
  return (
    <>
      <h1>{SEARCH.results(query)}</h1>
      <SearchForm value={query} />
      {results.length === 0 ? (
        <p>{SEARCH.noResults(query)}</p>
      ) : (
        <ul>
          {results.map((r) => (
            <li key={r.id}>
              <Link to={`/check/${encodeURIComponent(r.id)}`}>{r.name}</Link> (
              {r.kind === "brand" ? "brand" : "company"})
              {r.matched !== r.name && <> - also known as {r.matched}</>}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
