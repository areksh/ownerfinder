import { exports } from "cloudflare:workers";
import { describe, expect, it, vi } from "vitest";
import worker from "../src/index";

function failingDb(message = "boom"): D1Database {
  const statement = {
    first: () => Promise.reject(new Error(message)),
  };
  return { prepare: () => statement } as unknown as D1Database;
}

function fetchWithFailingDb(message?: string): Promise<Response> {
  const env = { DB: failingDb(message) } as Env;
  return worker.fetch(new Request("https://api.test/health"), env);
}

describe("GET /health", () => {
  it("reports ok when the database answers", async () => {
    const res = await exports.default.fetch("https://api.test/health");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/json; charset=utf-8");
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await res.json()).toEqual({ status: "ok", database: "ok" });
  });

  it("reports degraded with 503 when the database fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await fetchWithFailingDb();
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ status: "degraded", database: "unavailable" });
  });

  it("does not leak the database error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await fetchWithFailingDb("secret detail");
    expect(res.status).toBe(503);
    expect(await res.text()).not.toContain("secret detail");
  });

  it("answers HEAD with headers only", async () => {
    const res = await exports.default.fetch("https://api.test/health", { method: "HEAD" });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("");
  });
});
