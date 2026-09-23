import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequestGet, onRequestPost } from "./guestbook";

function mockEnv(overrides: Record<string, unknown> = {}) {
  const run = vi.fn(async () => ({ success: true }));
  const all = vi.fn(async () => ({ results: [{ id: 1, name: "Ada", message: "Hello", created_at: "2026-09-23T00:00:00Z" }] }));
  const bind = vi.fn(() => ({ run, all }));
  const prepare = vi.fn(() => ({ bind, run, all }));
  const env = {
    DB: { prepare },
    TURNSTILE_SECRET_KEY: "test-secret",
    GUESTBOOK_ORIGIN: "https://www.mathewhartley.com",
    ...overrides,
  };
  return { env, prepare, bind, run, all };
}

function request(method: string, body?: unknown, origin = "https://www.mathewhartley.com") {
  return new Request("https://www.mathewhartley.com/api/guestbook", {
    method,
    headers: {
      ...(origin ? { Origin: origin } : {}),
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      "CF-Connecting-IP": "192.0.2.1",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

afterEach(() => vi.unstubAllGlobals());

describe("guestbook API", () => {
  it("lists only approved entries", async () => {
    const { env, prepare } = mockEnv();
    const response = await onRequestGet({ request: request("GET"), env } as never);
    expect(response.status).toBe(200);
    expect(prepare).toHaveBeenCalledWith(expect.stringContaining("WHERE approved = 1"));
    expect(await response.json()).toMatchObject({ entries: [{ name: "Ada", message: "Hello" }] });
  });

  it("stores submissions pending after Turnstile verification", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ success: true, hostname: "www.mathewhartley.com" })));
    const { env, prepare, bind, run } = mockEnv();
    const response = await onRequestPost({
      request: request("POST", { name: " Ada ", message: " Hello ", website: "", turnstileToken: "valid-token" }),
      env,
    } as never);
    expect(response.status).toBe(201);
    expect(prepare).toHaveBeenCalledWith(expect.stringContaining("approved) VALUES (?, ?, 0)"));
    expect(bind).toHaveBeenCalledWith("Ada", "Hello");
    expect(run).toHaveBeenCalledOnce();
  });

  it("rejects cross-origin posts before persistence", async () => {
    const { env, prepare } = mockEnv();
    const response = await onRequestPost({
      request: request("POST", { name: "Ada", message: "Hello" }, "https://attacker.example"),
      env,
    } as never);
    expect(response.status).toBe(403);
    expect(prepare).not.toHaveBeenCalled();
  });

  it("rejects oversized request bodies", async () => {
    const { env, prepare } = mockEnv();
    const largeRequest = new Request("https://www.mathewhartley.com/api/guestbook", {
      method: "POST",
      headers: { Origin: "https://www.mathewhartley.com", "Content-Type": "application/json" },
      body: JSON.stringify({ name: "A", message: "x".repeat(5000) }),
    });
    const response = await onRequestPost({ request: largeRequest, env } as never);
    expect(response.status).toBe(413);
    expect(prepare).not.toHaveBeenCalled();
  });

  it("fails closed when the rate limiter errors", async () => {
    const { env, prepare } = mockEnv({ GUESTBOOK_RATE_LIMITER: { limit: async () => { throw new Error("offline"); } } });
    const response = await onRequestPost({ request: request("POST", { name: "Ada", message: "Hello" }), env } as never);
    expect(response.status).toBe(429);
    expect(prepare).not.toHaveBeenCalled();
  });
});
