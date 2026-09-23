# Guestbook setup and moderation

The guestbook UI and rest of the Astro site are static and continue to deploy to S3 via the existing workflow. The separate Cloudflare Worker in `src/worker.ts` handles only `/api/guestbook` and `/api/guestbook/` when requested through the configured Worker route. The API is always `Cache-Control: no-store`; reads query D1 on every request and new entries are inserted pending approval (`approved = 0`). Cloudflare Workers' built-in Rate Limiting binding is a best-effort per-location throttle, not a globally coordinated IP quota.

## First-time Cloudflare setup

**Setup blocker:** `src/pages/index.astro` still contains `YOUR_TURNSTILE_SITE_KEY`. The guestbook cannot accept submissions until a real Turnstile site key is configured there and the matching secret is stored on the Worker. Do not treat the guestbook as production-ready before completing these steps.

1. Create a D1 database named `guestbook` in the Cloudflare account and replace `REPLACE_WITH_D1_DATABASE_ID` in `wrangler.toml` with its ID.
2. Apply `migrations/0001_guestbook.sql` with `npx wrangler d1 migrations apply guestbook --remote`.
3. Create a Turnstile widget restricted to `www.mathewhartley.com` (and any intentionally configured preview hostnames). Set its site key in the `data-sitekey` on `src/pages/index.astro` instead of `YOUR_TURNSTILE_SITE_KEY`.
4. Before deployment, replace `YOUR_TURNSTILE_SITE_KEY` in `src/pages/index.astro` with the real widget site key. The placeholder blocks submissions. Create the widget for `www.mathewhartley.com`; the Worker checks the returned hostname. Do not deploy until the real site key is configured.
5. Ensure `www.mathewhartley.com` remains proxied through Cloudflare so the Worker route can run in front of the existing S3 origin. The route is narrow: the Worker returns a no-store 404 for any other path and does not proxy/fetch those paths. The Worker does not call `fetch()` for API requests or access the Cache API. Every Worker response, including errors, has `Cache-Control: no-store`; verify no Cache Rule or Workers Cache setting overrides it for this API route.
6. Deploy the Worker code/route first with `npx wrangler deploy`. This requires a Cloudflare API token with Workers and route permissions, plus `CLOUDFLARE_ACCOUNT_ID`; credentials are not stored here. Wrangler config routes only `www.mathewhartley.com/api/guestbook*` on the `mathewhartley.com` zone.
7. Set `TURNSTILE_SECRET_KEY` as a Worker secret with `npx wrangler secret put TURNSTILE_SECRET_KEY`. This command creates a new version and deploys it, so run it after configuring the site key and only after deciding the Worker is ready to be live.
8. Confirm `GUESTBOOK_ORIGIN` is exactly `https://www.mathewhartley.com`. Rate-limit bindings and limits are declared in `wrangler.toml`. They are best-effort per-edge-location throttles, not a global per-IP quota.
9. Verify `GET https://www.mathewhartley.com/api/guestbook` returns JSON and `Cache-Control: no-store`. Submit a test entry; it should return 201 with `Cache-Control: no-store` and remain absent from public reads until approved. Verify other static paths still serve from S3 with their existing cache behavior.

The S3 static deployment in `.github/workflows/deploy.yml` is unchanged. This repository does not currently have Cloudflare credentials configured in GitHub, so Worker deployment is intentionally manual and is not coupled to the S3 deploy workflow. If automated Worker deployment is added later, configure GitHub Actions secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` first and keep it as a separate workflow/job; do not make the S3 deployment depend on them. No D1 resource, Turnstile widget, route, or Worker is created/deployed by this PR.

## Moderation

List pending entries from the D1 console or `npx wrangler d1 execute guestbook --remote --command "SELECT id, name, message, created_at FROM guestbook_entries WHERE approved = 0 ORDER BY id DESC"`. Review the text before approving. Approve an entry by ID with `UPDATE guestbook_entries SET approved = 1 WHERE id = <id>;`; remove one with `DELETE FROM guestbook_entries WHERE id = <id>;`. Never interpolate visitor-provided values into SQL; only use a reviewed numeric row ID.

## Safeguards

Name is limited to 40 characters and message to 500. New submissions are never immediately public. The API checks same-origin requests, requires a server-verified Turnstile token bound to the configured origin hostname, uses a honeypot, rate-limits reads to 60 requests per IP/minute and submissions to 3 per IP/minute, bounds request bodies, rejects malformed input, and fails closed when a rate limiter errors. Entries render as text nodes, not HTML, which prevents stored HTML/script injection. The listing returns only the latest 50 approved entries. The IP is used transiently for the rate limit and optional Turnstile verification; it is not saved in D1.
