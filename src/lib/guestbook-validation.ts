export const MAX_NAME_LENGTH = 40;
export const MAX_MESSAGE_LENGTH = 500;

export interface GuestbookInput {
  name: unknown;
  message: unknown;
  website?: unknown;
  turnstileToken?: unknown;
}

export type GuestbookValidation =
  | { ok: true; name: string; message: string }
  | { ok: false; error: string };

export function stripUnsafeControls(value: string): string {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
}

export function validateGuestbookInput(input: GuestbookInput): GuestbookValidation {
  if (typeof input.website === "string" && input.website.trim() !== "") {
    return { ok: false, error: "Submission rejected." };
  }

  if (typeof input.name !== "string" || typeof input.message !== "string") {
    return { ok: false, error: "Name and message are required." };
  }

  const name = stripUnsafeControls(input.name).trim();
  const message = stripUnsafeControls(input.message).trim();

  if (!name || !message) {
    return { ok: false, error: "Name and message are required." };
  }
  if (name.length > MAX_NAME_LENGTH) {
    return { ok: false, error: `Name must be ${MAX_NAME_LENGTH} characters or fewer.` };
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return { ok: false, error: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.` };
  }
  return { ok: true, name, message };
}
