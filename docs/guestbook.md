# Guestbook setup and moderation

The guestbook UI and rest of the Astro site are static and continue to deploy to S3 via the existing workflow. The separate Cloudflare Worker in `src/worker.ts` handles only `/api/guestbook` and `/api/guestbook/` when requested through the configured Worker route. The API is always `Cache-Control: no-store`; reads query D1 on every request and new entries are inserted pending approval (`approved = 0`). Cloudflare Workers' built-in Rate Limiting binding is a best-effort per-location throttle, not a globally coordinated IP quota.

## First-time Cloudflare setup

**Safe by default:** The form stays hidden unless `PUBLIC_TURNSTILE_SITE_KEY` is configured to a real site key. Missing or placeholder values show a setup note instead. Set the matching Turnstile secret on the Worker before deployment; D1's placeholder database ID must also be replaced.

1. Create a D1 database named `guestbook` in the Cloudflare account and replace `REPLACE_WITH_D1_DATABASE_ID` in `wrangler.toml` with its ID.
2. Apply `migrations/0001_guestbook.sql` with `npx wrangler d1 migrations apply guestbook --remote`.
3. Create a Turnstile widget for `www.mathewhartley.com` and set its public site key as the build-time environment variable `PUBLIC_TURNSTILE_SITE_KEY` for Astro. The Worker checks the returned hostname. If the key is missing or still a placeholder, the guestbook form is omitted from the built page and replaced with a short setup note.
4. Ensure `www.mathewhartley.com` remains proxied through Cloudflare so the Worker routes can run in front of the existing S3 origin. The two exact routes cover `/api/guestbook` and `/api/guestbook/`; guestbook-prefixed sibling paths remain served by S3. The Worker does not call `fetch()` for API requests or access the Cache API. Every Worker response, including errors, has `Cache-Control: no-store`; verify no Cache Rule or Workers Cache setting overrides it for these API routes.
5. Confirm `GUESTBOOK_ORIGIN` is exactly `https://www.mathewhartley.com`. Rate-limit bindings and limits are declared in `wrangler.toml`. They are best-effort per-edge-location throttles, not a global per-IP quota.
6. Deploy the Worker code/routes with `npx wrangler deploy`. This requires a Cloudflare API token with Workers and route permissions, plus `CLOUDFLARE_ACCOUNT_ID`; credentials are not stored here. Wrangler config attaches exact routes for `www.mathewhartley.com/api/guestbook` and `www.mathewhartley.com/api/guestbook/` to the `mathewhartley.com` zone.
7. Set `TURNSTILE_SECRET_KEY` with `npx wrangler secret put TURNSTILE_SECRET_KEY`. This creates a new Worker version and deploys it. Since there is no endpoint secret validation, configure it before treating submissions as live; entries still require manual approval.
8. Verify `GET https://www.mathewhartley.com/api/guestbook` returns JSON and `Cache-Control: no-store`. Submit a test entry; it should return 201 with `Cache-Control: no-store` and remain absent from public reads until approved. Verify other static paths still serve from S3 with their existing cache behavior.

The S3 static deployment in `.github/workflows/deploy.yml` is unchanged. This repository does not currently have Cloudflare credentials configured in GitHub, so Worker deployment is intentionally manual and is not coupled to the S3 deploy workflow. If automated Worker deployment is added later, configure GitHub Actions secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` first and keep it as a separate workflow/job; do not make the S3 deployment depend on them. No D1 resource, Turnstile widget, route, or Worker is created/deployed by this PR.

## Moderation

List pending entries from the D1 console or `npx wrangler d1 execute guestbook --remote --command "SELECT id, name, message, created_at FROM guestbook_entries WHERE approved = 0 ORDER BY id DESC"`. Review the text before approving. Approve an entry by ID with `UPDATE guestbook_entries SET approved = 1 WHERE id = <id>;`; remove one with `DELETE FROM guestbook_entries WHERE id = <id>;`. Never interpolate visitor-provided values into SQL; only use a reviewed numeric row ID.

## Safeguards

Name is limited to 40 characters and message to 500. New submissions are never immediately public. The API checks same-origin requests, requires a server-verified Turnstile token bound to the configured origin hostname, uses a honeypot, rate-limits reads to 60 requests per IP/minute and submissions to 3 per IP/minute, bounds request bodies, rejects malformed input, and fails closed when a rate limiter errors. Entries render as text nodes, not HTML, which prevents stored HTML/script injection. The listing returns only the latest 50 approved entries. The IP is used transiently for the rate limit and optional Turnstile verification; it is not saved in D1.
