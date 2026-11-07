import { describe, expect, it, vi } from "vitest";
import { createIssue, issueBody, parseRequestForm, verifyTurnstile } from "./request.server";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [k, v] of Object.entries(fields)) data.set(k, v);
  return data;
}

const VALID = {
  subject: "Add Kraft Heinz",
  change: "Kraft Heinz owns Philadelphia in North America.",
  sources: "https://www.sec.gov/kraft-heinz-10k\nhttps://example.org/report",
};

describe("parseRequestForm", () => {
  it("accepts a subject, a change and one source URL per line", () => {
    expect(parseRequestForm(form(VALID))).toEqual({
      ok: true,
      input: {
        subject: "Add Kraft Heinz",
        change: "Kraft Heinz owns Philadelphia in North America.",
        sources: ["https://www.sec.gov/kraft-heinz-10k", "https://example.org/report"],
      },
    });
  });

  it("explains each problem by field", () => {
    const result = parseRequestForm(
      form({ subject: "x", change: "short", sources: "not a url\nhttp://plain.example" }),
    );
    expect(result).toEqual({
      ok: false,
      errors: {
        subject: "Give a subject of 3 to 200 characters.",
        change: "Describe the change in 10 to 5,000 characters.",
        sources: "Give 1 to 10 sources, each an https web address on its own line.",
      },
    });
  });

  it("requires at least one source", () => {
    expect(parseRequestForm(form({ ...VALID, sources: "  \n " }))).toMatchObject({
      ok: false,
      errors: { sources: expect.any(String) },
    });
  });
});

describe("issueBody", () => {
  it("fences the requester's text so it cannot mention people or break the markdown", () => {
    const body = issueBody({
      subject: "Fix",
      change: "Ping @someone\n```\n# Heading",
      sources: ["https://example.org/a"],
    });
    expect(body).toContain("````text\nPing @someone\n```\n# Heading\n````");
    expect(body).toContain("- https://example.org/a");
  });
});

describe("verifyTurnstile", () => {
  it("asks Cloudflare whether the token is good", async () => {
    const fetcher = vi.fn(async () => Response.json({ success: true }));
    expect(await verifyTurnstile("token-1", "secret-1", "203.0.113.5", fetcher)).toBe(true);
    const [url, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://challenges.cloudflare.com/turnstile/v0/siteverify");
    const sent = init.body as FormData;
    expect([sent.get("secret"), sent.get("response"), sent.get("remoteip")]).toEqual([
      "secret-1",
      "token-1",
      "203.0.113.5",
    ]);
  });

  it("refuses a missing or rejected token", async () => {
    const fetcher = vi.fn(async () => Response.json({ success: false }));
    expect(await verifyTurnstile("", "secret-1", undefined, fetcher)).toBe(false);
    expect(fetcher).not.toHaveBeenCalled();
    expect(await verifyTurnstile("bad", "secret-1", undefined, fetcher)).toBe(false);
  });
});

describe("createIssue", () => {
  const input = {
    subject: "Add Kraft Heinz",
    change: "Details here.",
    sources: ["https://example.org/a"],
  };

  it("opens a labelled issue in the repository and returns its address", async () => {
    const fetcher = vi.fn(async () =>
      Response.json({ html_url: "https://github.com/o/r/issues/7" }, { status: 201 }),
    );
    expect(await createIssue(input, { token: "t", repo: "o/r" }, fetcher)).toBe(
      "https://github.com/o/r/issues/7",
    );
    const [url, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.github.com/repos/o/r/issues");
    expect(init.method).toBe("POST");
    expect(new Headers(init.headers).get("authorization")).toBe("Bearer t");
    expect(new Headers(init.headers).get("user-agent")).toBeTruthy();
    expect(JSON.parse(String(init.body))).toMatchObject({
      title: "Request: Add Kraft Heinz",
      labels: ["request"],
    });
  });

  it("keeps mentions out of the title, which is not fenced", async () => {
    const fetcher = vi.fn(async () => Response.json({ html_url: "u" }, { status: 201 }));
    await createIssue({ ...input, subject: "Ask @someone" }, { token: "t", repo: "o/r" }, fetcher);
    const [, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(String(init.body)).title).toBe("Request: Ask (at)someone");
  });

  it("fails loudly when GitHub refuses", async () => {
    const fetcher = vi.fn(async () => new Response("no", { status: 403 }));
    await expect(createIssue(input, { token: "t", repo: "o/r" }, fetcher)).rejects.toThrow("403");
  });
});
