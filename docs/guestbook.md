# Guestbook setup and moderation

The guestbook UI is static Astro; `functions/api/guestbook.ts` is the Cloudflare Pages Function and D1 stores entries. The function always inserts entries as pending (`approved = 0`). Only approved entries are returned publicly.

## First-time Cloudflare setup

1. Create a D1 database named `guestbook` in the Cloudflare account.
2. Replace `REPLACE_WITH_D1_DATABASE_ID` in `wrangler.toml` with the database ID.
3. Apply `migrations/0001_guestbook.sql` using `npx wrangler d1 migrations apply guestbook --remote`.
4. Create a Turnstile widget restricted to `www.mathewhartley.com` (and any intended preview hostnames). Put its site key into the `data-sitekey` in `src/pages/index.astro` instead of `YOUR_TURNSTILE_SITE_KEY`.
5. Set the Turnstile secret as a Cloudflare Pages secret named `TURNSTILE_SECRET_KEY`.
6. Deploy the site as a Cloudflare Pages project, with `dist` as its build output. Bind the `guestbook` D1 database as `DB`. Bind `GUESTBOOK_RATE_LIMITER` and `GUESTBOOK_READ_LIMITER` as named in `wrangler.toml` if the bindings are not picked up from config. Set `GUESTBOOK_ORIGIN` to the public origin, exactly including scheme and hostname.
7. Configure the domain and verify `GET /api/guestbook` returns `{"entries":[]}`. Submit a test entry; it should return 201 and remain absent from public reads until approved.

Cloudflare Pages Functions are not invoked by the existing S3 static-site hosting. The backend will not be live until the site is deployed to Pages or the function is adapted to the site's chosen hosting provider. Do not switch production traffic as part of setup without an explicit deployment decision.

## Moderation

List pending entries from the D1 console or `npx wrangler d1 execute guestbook --remote --command "SELECT id, name, message, created_at FROM guestbook_entries WHERE approved = 0 ORDER BY id DESC"`. Review the text before approving. Approve an entry by ID with `UPDATE guestbook_entries SET approved = 1 WHERE id = <id>;`; remove one with `DELETE FROM guestbook_entries WHERE id = <id>;`. Never interpolate visitor-provided values into SQL; only use a reviewed numeric row ID.

## Safeguards

Name is limited to 40 characters and message to 500. New submissions are never immediately public. The API checks same-origin requests, requires a server-verified Turnstile token, uses a honeypot, rate-limits reads to 60 requests per IP/minute and submissions to 3 per IP/minute, bounds request bodies, and rejects malformed input. Entries render as text nodes, not HTML, which prevents stored HTML/script injection. The listing returns only the latest 50 approved entries. The IP is used transiently for the rate limit and optional Turnstile verification; it is not saved in D1.
