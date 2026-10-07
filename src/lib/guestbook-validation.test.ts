import { describe, expect, it } from "vitest";
import { validateGuestbookInput, MAX_MESSAGE_LENGTH, MAX_NAME_LENGTH } from "./guestbook-validation";

describe("validateGuestbookInput", () => {
  it("trims and accepts ordinary guestbook entries", () => {
    expect(validateGuestbookInput({ name: " Ada ", message: " Hello! ", website: "" })).toEqual({ ok: true, name: "Ada", message: "Hello!" });
  });
  it("rejects a filled honeypot", () => {
    expect(validateGuestbookInput({ name: "Bot", message: "Hello", website: "spam" })).toEqual({ ok: false, error: "Submission rejected." });
  });
  it("rejects empty content and values of wrong types", () => {
    expect(validateGuestbookInput({ name: " ", message: "Hello" }).ok).toBe(false);
    expect(validateGuestbookInput({ name: 5, message: "Hello" }).ok).toBe(false);
  });
  it("enforces field length limits", () => {
    expect(validateGuestbookInput({ name: "n".repeat(MAX_NAME_LENGTH + 1), message: "Hi" }).ok).toBe(false);
    expect(validateGuestbookInput({ name: "A", message: "m".repeat(MAX_MESSAGE_LENGTH + 1) }).ok).toBe(false);
  });
  it("removes control characters from submitted content", () => {
    expect(validateGuestbookInput({ name: "Ad\u0000a", message: "Hi\u0000there" })).toEqual({ ok: true, name: "Ada", message: "Hithere" });
  });
});
