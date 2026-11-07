import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

describe("routing", () => {
  it("rejects other methods on /health with 405", async () => {
    const res = await exports.default.fetch("https://api.test/health", { method: "POST" });
    expect(res.status).toBe(405);
    expect(res.headers.get("allow")).toBe("GET, HEAD");
    expect(await res.json()).toEqual({ error: "method_not_allowed" });
  });

  it("answers unknown paths with a JSON 404", async () => {
    const res = await exports.default.fetch("https://api.test/nope");
    expect(res.status).toBe(404);
    expect(res.headers.get("content-type")).toBe("application/json; charset=utf-8");
    expect(await res.json()).toEqual({ error: "not_found" });
  });
});
