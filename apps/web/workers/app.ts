import { createRequestHandler, RouterContextProvider } from "react-router";
import { cloudflareContext } from "../app/context";

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

export default {
  async fetch(request, env, ctx) {
    const context = new RouterContextProvider();
    // Cloudflare's guess at the visitor's country, used only as a default.
    const country = (request as Request & { cf?: { country?: string } }).cf?.country;
    context.set(cloudflareContext, country === undefined ? { env, ctx } : { env, ctx, country });
    return requestHandler(request, context);
  },
} satisfies ExportedHandler<Env>;
