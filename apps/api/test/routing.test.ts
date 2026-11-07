import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

describe("routing", () => {
  it("rejects other methods on /health with 405", async () => {
    const res = await exports.default.fetch("https://api.test/health", { method: "POST" });
    expect(res.status).toBe(405);
    expect(res.headers.get("allow")).toBe("GET, HEAD");
    expect(await res.json()).toEqual({ error: "method_not_allowed" });
  });

  it.each(["/lookup/brand:x?country=GB", "/search?q=xx", "/nodes/brand:x", "/criteria"])(
    "rejects POST to %s with 405",
    async (path) => {
      const res = await exports.default.fetch(`https://api.test${path}`, { method: "POST" });
      expect(res.status).toBe(405);
      expect(res.headers.get("allow")).toBe("GET, HEAD");
    },
  );

  it("answers HEAD on a data endpoint with headers only", async () => {
    const res = await exports.default.fetch("https://api.test/criteria", { method: "HEAD" });
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("public, max-age=300");
    expect(await res.text()).toBe("");
  });

  it("answers unknown paths with a JSON 404", async () => {
    const res = await exports.default.fetch("https://api.test/nope");
    expect(res.status).toBe(404);
    expect(res.headers.get("content-type")).toBe("application/json; charset=utf-8");
    expect(await res.json()).toEqual({ error: "not_found" });
  });
});
