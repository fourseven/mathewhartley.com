# AGENTS.md

## Project

Personal website/blog built with Astro 6 (static site). Deployed to S3 via `aws s3 sync`. Retro 90s GeoCities visual theme — all CSS, no JS frameworks.

## Commands

- `npm run dev` — dev server on `localhost:4321`
- `npm run build` — static build to `dist/`
- `make deploy` — build + sync to S3 (requires `aws --profile=personal`)
- No tests, no linter, no typecheck step configured

## Architecture

- **Astro content collections** with glob loader: `src/content.config.ts` defines a `blog` collection from `src/content/blog/**/*.md`
- Blog posts are Markdown files named `YYYY-MM-DD-slug.md` with frontmatter: `title`, `date` (coerced to Date), `tags` (comma-separated string, not array)
- Blog post images live in sibling directories (e.g., `src/content/blog/2014-01-05-monotribe-miditribe-io/miditribe.jpg`)
- Routes: `/` (home), `/blog` (list), `/blog/[slug]` (post), `/blog/tag/[tag]` (tag filter), `/works` (projects), `/rss.xml`
- `src/layouts/Base.astro` is the single layout — includes global CSS via `@import`
- `src/components/` exists but is empty — all UI is in pages and the layout

## Gotchas

- `tags` frontmatter field is a plain string (`"AI, Claude Code, Engineering"`), not a YAML array. Code splits on commas manually.
- Content IDs come from the glob loader — they use the filename stem (e.g., `2014-01-05-monotribe-miditribe-io`), which is what `[slug].astro` uses for routing.
- The `.astro/` directory is auto-generated and gitignored; `tsconfig.json` includes `.astro/types.d.ts`.
- Node >= 22.12.0 required.
- No CI pipeline — deploys are manual via `make deploy`.
