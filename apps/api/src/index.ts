import { checkHealth } from "./health.ts";
import { json } from "./http.ts";
import { BadRequest, criteria, lookup, NotFound, node, nodeId, search } from "./routes.ts";

/** Public, read-only data; it changes only when a deploy reloads D1. */
const DATA_HEADERS = {
  "cache-control": "public, max-age=300",
  "access-control-allow-origin": "*",
};

type Handler = (env: Env, url: URL, param: string) => Promise<Response>;

function data(answer: (env: Env, url: URL, param: string) => Promise<unknown>): Handler {
  return async (env, url, param) =>
    json(await answer(env, url, param), { status: 200, headers: DATA_HEADERS });
}

async function health(env: Env): Promise<Response> {
  const report = await checkHealth(env.DB);
  return json(report, {
    status: report.status === "ok" ? 200 : 503,
    headers: { "cache-control": "no-store" },
  });
}

const ROUTES: Array<[RegExp, Handler]> = [
  [/^\/health$/, (env) => health(env)],
  [/^\/search$/, data((env, url) => search(env.DB, url))],
  [/^\/lookup\/([^/]+)$/, data((env, url, param) => lookup(env.DB, nodeId(param), url))],
  [/^\/nodes\/([^/]+)$/, data((env, _url, param) => node(env.DB, nodeId(param)))],
  [/^\/criteria$/, data((env) => criteria(env.DB))],
];

async function route(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  for (const [pattern, handler] of ROUTES) {
    const match = pattern.exec(url.pathname);
    if (match === null) continue;
    if (request.method !== "GET" && request.method !== "HEAD") {
      return json(
        { error: "method_not_allowed" },
        { status: 405, headers: { allow: "GET, HEAD" } },
      );
    }
    try {
      return await handler(env, url, match[1] ?? "");
    } catch (error) {
      if (error instanceof BadRequest) {
        return json({ error: "bad_request", message: error.message }, { status: 400 });
      }
      if (error instanceof NotFound) return json({ error: "not_found" }, { status: 404 });
      console.error("Request failed", error);
      return json({ error: "internal_error" }, { status: 500 });
    }
  }
  return json({ error: "not_found" }, { status: 404 });
}

export default {
  async fetch(request, env): Promise<Response> {
    const response = await route(request, env);
    return request.method === "HEAD" ? new Response(null, response) : response;
  },
} satisfies ExportedHandler<Env>;
