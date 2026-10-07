import { afterEach, describe, expect, it, vi } from "vitest";
import worker from "../../src/worker";

function mockEnv(overrides: Record<string, unknown> = {}) {
  const run = vi.fn(async () => ({ success: true }));
  const all = vi.fn(async () => ({ results: [{ id: 1, name: "Ada", message: "Hello", created_at: "2026-09-23T00:00:00Z" }] }));
  const bind = vi.fn(() => ({ run, all }));
  const prepare = vi.fn(() => ({ bind, run, all }));
  const env = {
    DB: { prepare },
    TURNSTILE_SECRET_KEY: "test-secret",
    GUESTBOOK_ORIGIN: "https://www.mathewhartley.com",
    GUESTBOOK_RATE_LIMITER: { limit: vi.fn(async () => ({ success: true })) },
    GUESTBOOK_READ_LIMITER: { limit: vi.fn(async () => ({ success: true })) },
    ...overrides,
  };
  return { env, prepare, bind, run, all };
}

function request(
  method: string,
  path = "/api/guestbook",
  body?: unknown,
  origin = "https://www.mathewhartley.com",
) {
  return new Request(`https://www.mathewhartley.com${path}`, {
    method,
    headers: {
      ...(origin ? { Origin: origin } : {}),
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      "CF-Connecting-IP": "192.0.2.1",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function handle(req: Request, env: Record<string, unknown>) {
  return worker.fetch(req, env as never, {} as never);
}

async function expectNoStore(response: Response) {
  expect(response.headers.get("Cache-Control")).toBe("no-store");
}

afterEach(() => vi.unstubAllGlobals());

describe("guestbook Worker route", () => {
  it.each(["/api/guestbook", "/api/guestbook/"])("lists only approved entries at %s and queries D1 on every read", async (path) => {
    const { env, prepare } = mockEnv();
    const first = await handle(request("GET", path), env);
    const second = await handle(request("GET", path), env);
    expect(first.status).toBe(200);
    expect(prepare).toHaveBeenCalledTimes(2);
    expect(prepare).toHaveBeenCalledWith(expect.stringContaining("WHERE approved = 1"));
    expect(await first.json()).toMatchObject({ entries: [{ name: "Ada", message: "Hello" }] });
    await expectNoStore(first);
    await expectNoStore(second);
  });

  it("stores submissions pending after Turnstile verification", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ success: true, hostname: "www.mathewhartley.com" })));
    const { env, prepare, bind, run } = mockEnv();
    const response = await handle(request("POST", "/api/guestbook", {
      name: " Ada ", message: " Hello ", website: "", turnstileToken: "valid-token",
    }), env);
    expect(response.status).toBe(201);
    expect(prepare).toHaveBeenCalledWith(expect.stringContaining("approved) VALUES (?, ?, 0)"));
    expect(bind).toHaveBeenCalledWith("Ada", "Hello");
    expect(run).toHaveBeenCalledOnce();
    await expectNoStore(response);
  });

  it("rejects cross-origin posts before persistence", async () => {
    const { env, prepare } = mockEnv();
    const response = await handle(request("POST", "/api/guestbook", { name: "Ada", message: "Hello" }, "https://attacker.example"), env);
    expect(response.status).toBe(403);
    expect(prepare).not.toHaveBeenCalled();
    await expectNoStore(response);
  });

  it("rejects cross-origin reads", async () => {
    const { env, prepare } = mockEnv();
    const response = await handle(request("GET", "/api/guestbook", undefined, "https://attacker.example"), env);
    expect(response.status).toBe(403);
    expect(prepare).not.toHaveBeenCalled();
    await expectNoStore(response);
  });

  it("rejects oversized request bodies", async () => {
    const { env, prepare } = mockEnv();
    const response = await handle(request("POST", "/api/guestbook", { name: "A", message: "x".repeat(5000) }), env);
    expect(response.status).toBe(413);
    expect(prepare).not.toHaveBeenCalled();
    await expectNoStore(response);
  });

  it("fails closed when the rate limiter errors", async () => {
    const { env, prepare } = mockEnv({ GUESTBOOK_RATE_LIMITER: { limit: async () => { throw new Error("offline"); } } });
    const response = await handle(request("POST", "/api/guestbook", { name: "Ada", message: "Hello" }), env);
    expect(response.status).toBe(503);
    expect(prepare).not.toHaveBeenCalled();
    await expectNoStore(response);
  });

  it("rejects Turnstile results for the wrong hostname", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ success: true, hostname: "attacker.example" })));
    const { env, prepare } = mockEnv();
    const response = await handle(request("POST", "/api/guestbook", {
      name: "Ada", message: "Hello", turnstileToken: "valid-token",
    }), env);
    expect(response.status).toBe(400);
    expect(prepare).not.toHaveBeenCalled();
    await expectNoStore(response);
  });

  it("rejects invalid submissions with no-store", async () => {
    const { env, prepare } = mockEnv();
    const response = await handle(request("POST", "/api/guestbook", { name: "", message: "" }), env);
    expect(response.status).toBe(400);
    expect(prepare).not.toHaveBeenCalled();
    await expectNoStore(response);
  });

  it("returns no-store 429 when the rate limiter rejects a request", async () => {
    const { env, prepare } = mockEnv({ GUESTBOOK_READ_LIMITER: { limit: async () => ({ success: false }) } });
    const response = await handle(request("GET"), env);
    expect(response.status).toBe(429);
    expect(prepare).not.toHaveBeenCalled();
    await expectNoStore(response);
  });

  it.each(["GET", "POST"])("fails closed with no-store 503 when the %s rate limiter is missing", async (method) => {
    const { env, prepare } = mockEnv({
      GUESTBOOK_RATE_LIMITER: undefined,
      GUESTBOOK_READ_LIMITER: undefined,
    });
    const body = method === "POST" ? { name: "Ada", message: "Hello" } : undefined;
    const response = await handle(request(method, "/api/guestbook", body), env);
    expect(response.status).toBe(503);
    expect(prepare).not.toHaveBeenCalled();
    await expectNoStore(response);
  });

  it("returns no-store 503 when a D1 write fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ success: true, hostname: "www.mathewhartley.com" })));
    const { env } = mockEnv({ DB: { prepare: () => ({ run: async () => { throw new Error("offline"); } }) } });
    const response = await handle(request("POST", "/api/guestbook", {
      name: "Ada", message: "Hello", turnstileToken: "valid-token",
    }), env);
    expect(response.status).toBe(503);
    await expectNoStore(response);
  });

  it.each(["PUT", "DELETE", "OPTIONS"])("rejects %s with 405", async (method) => {
    const { env } = mockEnv();
    const response = await handle(request(method), env);
    expect(response.status).toBe(405);
    await expectNoStore(response);
  });

  it.each([
    "/api/guestbook/123",
    "/api/guestbook-extra",
    "/api/guestbook/extra",
    "/API/guestbook",
  ])("returns no-store 404 for non-exact route %s without invoking the API", async (path) => {
    const { env, prepare } = mockEnv();
    const response = await handle(request("GET", path), env);
    expect(response.status).toBe(404);
    expect(prepare).not.toHaveBeenCalled();
    await expectNoStore(response);
  });

  it("returns no-store 404 for non-API paths without proxying", async () => {
    const { env } = mockEnv();
    const response = await handle(request("GET", "/about"), env);
    expect(response.status).toBe(404);
    await expectNoStore(response);
  });

  it("returns no-store 503 when a D1 read fails", async () => {
    const { env } = mockEnv({ DB: { prepare: () => ({ all: async () => { throw new Error("offline"); } }) } });
    const response = await handle(request("GET"), env);
    expect(response.status).toBe(503);
    await expectNoStore(response);
  });
});
