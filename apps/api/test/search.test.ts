import { env } from "cloudflare:test";
import { exports } from "cloudflare:workers";
import type { Graph } from "@ecf/model";
import { beforeEach, describe, expect, it, vi } from "vitest";
import worker from "../src/index.ts";
import { loadGraph } from "./support/load.ts";

const graph: Graph = {
  entities: [
    { id: "entity:nestle", name: "Nestlé S.A." },
    { id: "entity:henkel", name: "Henkel AG & Co. KGaA" },
  ],
  brands: [
    { id: "brand:persil", name: "Persil", aliases: ["Persil Power"] },
    { id: "brand:pers", name: "Pers" },
    { id: "brand:super-persil", name: "Super Persil" },
    { id: "brand:ben-and-jerrys", name: "Ben & Jerry's", aliases: ["B&J"] },
    { id: "brand:percent", name: "100% Juice" },
  ],
  relationships: [],
  sources: [],
  criteria: [],
  listings: [],
};

beforeEach(() => loadGraph(env.DB, graph));

async function search(q: string) {
  const res = await exports.default.fetch(`https://api.test/search?q=${encodeURIComponent(q)}`);
  return {
    status: res.status,
    body: (await res.json()) as { query: string; results: Array<{ id: string; matched: string }> },
    res,
  };
}

describe("GET /search", () => {
  it("ignores case and accents, both ways", async () => {
    for (const q of ["nestle", "NESTLÉ", "nestlé"]) {
      const { status, body } = await search(q);
      expect(status).toBe(200);
      expect(body.results).toEqual([
        { id: "entity:nestle", kind: "entity", name: "Nestlé S.A.", matched: "Nestlé S.A." },
      ]);
    }
  });

  it("orders exact matches, then prefixes, then the rest", async () => {
    const { body, res } = await search("pers");
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    expect(body.query).toBe("pers");
    expect(body.results.map((r) => r.id)).toEqual([
      "brand:pers",
      "brand:persil",
      "brand:super-persil",
    ]);
  });

  it("matches aliases and says which name matched", async () => {
    const { body } = await search("b&j");
    expect(body.results).toEqual([
      { id: "brand:ben-and-jerrys", kind: "brand", name: "Ben & Jerry's", matched: "B&J" },
    ]);
  });

  it("lists a node matched by its name and an alias once, under the better match", async () => {
    const { body } = await search("persil");
    expect(body.results.filter((r) => r.id === "brand:persil")).toEqual([
      { id: "brand:persil", kind: "brand", name: "Persil", matched: "Persil" },
    ]);
  });

  it("treats % and _ as ordinary characters", async () => {
    expect((await search("0%")).body.results.map((r) => r.id)).toEqual(["brand:percent"]);
    expect((await search("%%")).body.results).toEqual([]);
    expect((await search("__")).body.results).toEqual([]);
  });

  it.each([
    ["no query", "/search"],
    ["a one-letter query", "/search?q=p"],
    ["a query of spaces", "/search?q=%20%20%20"],
    ["a query over 100 characters", `/search?q=${"a".repeat(101)}`],
  ])("rejects %s with 400", async (_name, path) => {
    const res = await exports.default.fetch(`https://api.test${path}`);
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "bad_request" });
  });

  it("returns at most 20 results", async () => {
    const many: Graph = {
      ...graph,
      brands: Array.from({ length: 25 }, (_, i) => ({ id: `brand:fizz-${i}`, name: `Fizz ${i}` })),
    };
    await loadGraph(env.DB, many);
    expect((await search("fizz")).body.results).toHaveLength(20);
  });

  it("answers 500 without detail when the database fails, and logs it", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const failing = {
      prepare: () => ({ bind: () => ({ all: () => Promise.reject(new Error("secret detail")) }) }),
    } as unknown as D1Database;
    const res = await worker.fetch(new Request("https://api.test/search?q=persil"), {
      ...env,
      DB: failing,
    });
    expect(res.status).toBe(500);
    const text = await res.text();
    expect(JSON.parse(text)).toEqual({ error: "internal_error" });
    expect(text).not.toContain("secret detail");
    expect(log).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ message: "secret detail" }),
    );
  });
});
