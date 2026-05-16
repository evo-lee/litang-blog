# Quick Start

English | [简体中文](./quick-start.zh-CN.md)

Get a local dev server running in 5 minutes. For a full setup walkthrough see [Installation](./installation.md).

## Prerequisites

- Node.js `>=20`
- npm (bundled with Node)
- Git

Optional:
- Cloudflare Wrangler — only needed for `cf:preview` / `cf:deploy`
- An AI provider key — only needed for `scripts/ai/*`

## Five Commands

```bash
git clone https://github.com/evo-lee/litang-blog.git
cd litang-blog
npm install
cp .env.example .env.local      # template only — fill placeholders, real values stay local
npm run dev
```

Open <http://localhost:3000>.

What `npm run dev` does:

1. `npm run content:build` — parses `content/posts/**` and `content/pages/**`, validates frontmatter with Zod, renders Markdown/MDX, writes:
   - `content/.generated/runtime-data.json`
   - `public/search-index.json`
2. `next dev --turbopack` — starts the Next.js dev server.

## Verify

| URL | Expected |
|---|---|
| `/` | Home (default `zh-CN`) |
| `/zh-CN` | Same content, locale-prefixed |
| `/en` | English variants where available, otherwise Chinese fallback |
| `/posts` | Posts list |
| `/api/health` | `{"ok":true,"status":"healthy","version":...,"env":...,"timestamp":...}` |

## Next Steps

- **Write a post** — drop a Markdown file into `content/posts/` then re-run `npm run content:build`. See [Content Pipeline](./content-pipeline.md).
- **Change the site title or nav** — edit `lib/site.ts` and `lib/i18n/messages.ts`. See [Customization](./customization.md).
- **Deploy** — connect the repo to Cloudflare Workers Builds. See [Deployment](./deployment.md).

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| `Module not found` after `git pull` | Run `npm install` again — `package-lock.json` changed |
| Blank page, console says `runtime-data.json` missing | Run `npm run content:build` |
| `EADDRINUSE :::3000` | Kill the existing dev server, or `PORT=3001 npm run dev` |
| Cloudflare preview 500 on `/en` or `/zh-CN/about` | A regex rewrite was reintroduced in `next.config.ts`. Remove it — see [Architecture](./architecture.md#locale-routing) |
