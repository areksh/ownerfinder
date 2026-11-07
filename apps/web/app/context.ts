import { createContext } from "react-router";

/** The Worker's bindings, set per request in workers/app.ts. */
export const cloudflareContext = createContext<{
  env: Env;
  ctx: ExecutionContext;
  country?: string;
}>();
