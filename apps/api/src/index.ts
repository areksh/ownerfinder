import { checkHealth } from "./health";
import { json } from "./http";

async function health(request: Request, env: Env): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return json({ error: "method_not_allowed" }, { status: 405, headers: { allow: "GET, HEAD" } });
  }
  const report = await checkHealth(env.DB);
  const response = json(report, {
    status: report.status === "ok" ? 200 : 503,
    headers: { "cache-control": "no-store" },
  });
  return request.method === "HEAD" ? new Response(null, response) : response;
}

export default {
  async fetch(request, env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname === "/health") {
      return health(request, env);
    }
    return json({ error: "not_found" }, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
