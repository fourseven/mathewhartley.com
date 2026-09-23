import { stripUnsafeControls, validateGuestbookInput } from "./lib/guestbook-validation";

interface D1Statement {
  bind(...values: (string | number)[]): D1Statement;
  all<T>(): Promise<{ results?: T[] }>;
  run(): Promise<unknown>;
}

interface D1Database {
  prepare(query: string): D1Statement;
}

interface RateLimiter {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

interface Env {
  DB: D1Database;
  TURNSTILE_SECRET_KEY?: string;
  GUESTBOOK_ORIGIN?: string;
  GUESTBOOK_RATE_LIMITER?: RateLimiter;
  GUESTBOOK_READ_LIMITER?: RateLimiter;
}

interface Entry {
  id: number;
  name: string;
  message: string;
  created_at: string;
}

const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

function clientKey(request: Request): string {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  return `guestbook:${ip}`;
}

async function rateLimitStatus(request: Request, limiter: RateLimiter | undefined): Promise<"limited" | "unavailable" | "allowed"> {
  if (!limiter) return "unavailable";
  try {
    return (await limiter.limit({ key: clientKey(request) })).success ? "allowed" : "limited";
  } catch {
    return "unavailable";
  }
}

function expectedOrigin(request: Request, env: Env): string {
  return env.GUESTBOOK_ORIGIN || new URL(request.url).origin;
}

function allowedOrigin(request: Request, env: Env): boolean {
  const origin = request.headers.get("Origin");
  return !origin || origin === expectedOrigin(request, env);
}

function allowedPostOrigin(request: Request, env: Env): boolean {
  return request.headers.get("Origin") === expectedOrigin(request, env);
}

async function readJsonLimited(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Invalid JSON.");

  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > 4096) {
      await reader.cancel();
      throw new RangeError("Submission is too large.");
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}

async function verifyTurnstile(token: unknown, request: Request, env: Env): Promise<boolean> {
  if (!env.TURNSTILE_SECRET_KEY || typeof token !== "string" || !token) return false;
  let hostname: string;
  try {
    const configuredOrigin = env.GUESTBOOK_ORIGIN || new URL(request.url).origin;
    if (new URL(configuredOrigin).origin !== configuredOrigin) return false;
    hostname = new URL(configuredOrigin).hostname;
  } catch {
    return false;
  }

  const body = new FormData();
  body.set("secret", env.TURNSTILE_SECRET_KEY);
  body.set("response", token);
  const ip = request.headers.get("CF-Connecting-IP");
  if (ip) body.set("remoteip", ip);

  let response: Response;
  try {
    response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
    });
  } catch {
    return false;
  }
  if (!response.ok) return false;
  let result: { success?: boolean; hostname?: string };
  try {
    result = (await response.json()) as { success?: boolean; hostname?: string };
  } catch {
    return false;
  }
  return result.success === true && result.hostname === hostname;
}

async function getGuestbook(request: Request, env: Env): Promise<Response> {
  if (!allowedOrigin(request, env)) return json({ error: "Origin not allowed." }, 403);
  const rateStatus = await rateLimitStatus(request, env.GUESTBOOK_READ_LIMITER);
  if (rateStatus === "unavailable") return json({ error: "Guestbook is temporarily unavailable." }, 503);
  if (rateStatus === "limited") return json({ error: "Too many requests. Try again shortly." }, 429);

  try {
    const { results } = await env.DB.prepare(
      "SELECT id, name, message, created_at FROM guestbook_entries WHERE approved = 1 ORDER BY id DESC LIMIT 50",
    ).all<Entry>();
    return json({ entries: results || [] });
  } catch {
    return json({ error: "Guestbook is temporarily unavailable." }, 503);
  }
}

async function postGuestbook(request: Request, env: Env): Promise<Response> {
  if (!allowedPostOrigin(request, env)) return json({ error: "Origin not allowed." }, 403);
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return json({ error: "Expected JSON." }, 415);
  }

  const rateStatus = await rateLimitStatus(request, env.GUESTBOOK_RATE_LIMITER);
  if (rateStatus === "unavailable") return json({ error: "Guestbook is temporarily unavailable." }, 503);
  if (rateStatus === "limited") return json({ error: "Too many submissions. Try again later." }, 429);

  let input: unknown;
  try {
    input = await readJsonLimited(request);
  } catch (error) {
    if (error instanceof RangeError) return json({ error: error.message }, 413);
    return json({ error: "Invalid JSON." }, 400);
  }

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return json({ error: "Invalid submission." }, 400);
  }

  const body = input as Record<string, unknown>;
  const validation = validateGuestbookInput({
    name: typeof body.name === "string" ? stripUnsafeControls(body.name) : body.name,
    message: typeof body.message === "string" ? stripUnsafeControls(body.message) : body.message,
    website: body.website,
  });
  if (!validation.ok) return json({ error: validation.error }, 400);
  if (!(await verifyTurnstile(body.turnstileToken, request, env))) {
    return json({ error: "Please complete the bot check and try again." }, 400);
  }

  try {
    await env.DB.prepare(
      "INSERT INTO guestbook_entries (name, message, approved) VALUES (?, ?, 0)",
    ).bind(validation.name, validation.message).run();
    return json({ message: "Thanks. Your entry is awaiting approval." }, 201);
  } catch {
    return json({ error: "Guestbook is temporarily unavailable." }, 503);
  }
}

const notFound = () => json({ error: "Not found." }, 404);

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname !== "/api/guestbook" && pathname !== "/api/guestbook/") return notFound();

    switch (request.method) {
      case "GET":
        return getGuestbook(request, env);
      case "POST":
        return postGuestbook(request, env);
      default:
        return json({ error: "Method not allowed." }, 405);
    }
  },
};

export default worker;
