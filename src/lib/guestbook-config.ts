export const TURNSTILE_PLACEHOLDER = "YOUR_TURNSTILE_SITE_KEY";

export function turnstileSiteKey(siteKey: string | undefined): string | undefined {
  const normalized = siteKey?.trim();
  return normalized && normalized !== TURNSTILE_PLACEHOLDER ? normalized : undefined;
}

export function guestbookEnabled(siteKey: string | undefined): boolean {
  return Boolean(turnstileSiteKey(siteKey));
}
