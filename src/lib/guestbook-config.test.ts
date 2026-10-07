import { describe, expect, it } from "vitest";
import { guestbookEnabled, turnstileSiteKey } from "./guestbook-config";

describe("guestbook setup configuration", () => {
  it("disables the form when the Turnstile site key is missing", () => {
    expect(guestbookEnabled(undefined)).toBe(false);
  });

  it("disables the form for the old placeholder key", () => {
    expect(guestbookEnabled("YOUR_TURNSTILE_SITE_KEY")).toBe(false);
  });

  it("enables the form and returns the configured site key", () => {
    expect(guestbookEnabled("0x-real-public-site-key")).toBe(true);
    expect(turnstileSiteKey("0x-real-public-site-key")).toBe("0x-real-public-site-key");
  });
});
