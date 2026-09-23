import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("guestbook Worker routes", () => {
  it("routes only the exact endpoint paths, not guestbook-prefixed siblings", () => {
    const config = readFileSync(resolve(process.cwd(), "wrangler.toml"), "utf8");
    expect(config).toContain('pattern = "www.mathewhartley.com/api/guestbook*"');
    expect(config).not.toContain('www.mathewhartley.com/api/guestbook/"');
  });
});
