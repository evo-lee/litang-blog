# Installation & Usage

English | [简体中文](./installation.zh-CN.md)

Detailed setup. For the 5-minute version see [Quick Start](./quick-start.md).

## 1. System Requirements

| Tool | Version | Why |
|---|---|---|
| Node.js | `>=20` | Required by Next.js 15 and `node --import tsx` for TS scripts |
| npm | bundled | Used for install and scripts |
| Git | any recent | Clone, commit, push |
| Wrangler | latest (optional) | Local Cloudflare Worker preview / manual deploy |

Verify:

```bash
node --version    # v20.x or later
npm --version
```

`next/font` may need outbound network access during a production build to fetch Google font metadata. If you are behind a strict proxy and the build hangs, that is the most common cause.

## 2. Clone & Install

```bash
git clone https://github.com/evo-lee/litang-blog.git
cd litang-blog
npm install
```

`npm install` also runs `husky` via the `prepare` script, installing the pre-commit hook (`lint-staged` runs ESLint + Prettier on staged files).

## 3. Environment Variables

```bash
cp .env.example .env.local
```

- `.env.example` is a **template**. Real values must never be committed there.
- `.env.local` is gitignored; this is where real keys live for local dev.
- Production secrets belong in the **Cloudflare dashboard**, not the repo.

Minimum keys to start the dev server: none. The site runs without any env vars. The keys below only enable specific features:

| Variable | Purpose | When required |
|---|---|---|
| `NEXT_PUBLIC_ENABLE_HETI` | Heti Chinese typography toggle | Default `true` |
| `NEXT_PUBLIC_ENABLE_UMAMI` | Umami analytics loader | `true` to load |
| `NEXT_PUBLIC_UMAMI_SCRIPT_URL` | Umami script URL | When Umami enabled |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | Umami site id | When Umami enabled |
| `NEXT_PUBLIC_ENABLE_GA` | GA4 loader toggle | `true` to load |
| `NEXT_PUBLIC_GA_ID` | GA4 measurement id `G-XXXX` | When GA enabled |
| `AI_PROVIDER` | `anthropic` or `openai` | Only for `scripts/ai/*` |
| `ANTHROPIC_API_KEY` | Anthropic key | When `AI_PROVIDER=anthropic` |
| `OPENAI_API_KEY` | OpenAI key | When `AI_PROVIDER=openai` |
| `OPENAI_BASE_URL` | OpenAI-compatible endpoint | Optional (e.g. a proxy) |
| `CLOUDFLARE_API_TOKEN` | Wrangler auth | Only for manual `cf:deploy` |
| `CLOUDFLARE_ACCOUNT_ID` | Wrangler account | Only for manual `cf:deploy` |

`NEXT_PUBLIC_*` values are inlined into the client bundle at build time — treat them as public. Anything secret must NOT use the `NEXT_PUBLIC_` prefix.

## 4. Commands Reference

| Command | What it does |
|---|---|
| `npm run dev` | `content:build` then Next.js dev server with Turbopack |
| `npm run content:build` | Rebuild `runtime-data.json` and `search-index.json` |
| `npm run build` | `content:build` → `next build` → `ensure-next-export-errors` |
| `npm run start` | Serve the production Next.js output |
| `npm run lint` | ESLint |
| `npm run type-check` | `content:build` → `next typegen` → `tsc --noEmit` |
| `npm test` | `node --test` against `tests/**/*.test.ts` |
| `npm run lint:content` | Validate content frontmatter |
| `npm run cf:build` | Build for Cloudflare via OpenNext |
| `npm run cf:preview` | Build + local Worker preview at `127.0.0.1:8787` |
| `npm run cf:deploy` | Build + deploy to Cloudflare Workers |
| `npm run cf:versions:upload` | Build + upload a Worker version without promoting it |
| `npm run ai:proofread -- --file content/posts/my-post.md` | AI proofreading report |
| `npm run ai:summarize` | AI summary report |
| `npm run ai:seo-suggest` | AI SEO suggestions |
| `npm run ai:typography-review` | Chinese typography review |
| `npx prettier --write .` | Format all files |

## 5. Standard Validation Suite

Before committing changes that touch code:

```bash
npm run lint && npm run type-check && npm run build
```

If the change touches routing, locale behavior, OpenNext, Cloudflare config, or Workers, also:

```bash
npm run cf:preview
```

Then hit `/`, `/zh-CN`, `/en`, `/zh-CN/about`, `/en/about` and verify there are no 500s.

## 6. Project Layout

```
app/
  (site)/          unprefixed routes — default zh-CN
  [locale]/        /en /zh-CN routes — wrap (site) pages
  api/health/      health endpoint
  image/[variant]/[token]/   Cloudflare-style image route
  rss.xml/         RSS feed
  robots.ts        robots.txt
  sitemap.ts       sitemap.xml
components/        article, site shell, search, SEO, analytics
content/
  posts/           Markdown/MDX post sources
  pages/           Markdown/MDX page sources (about, etc.)
  taxonomy/        tag metadata
  .generated/      generated artifacts (do not hand-edit)
lib/
  content/         loaders, runtime access, frontmatter schema
  i18n/            locale config, messages, route helpers
  seo/             metadata, OG, JSON-LD
  cloudflare/      image variant + loader helpers
  search/          client search types and index loader
  analytics/       providers + dispatch
  typography/      Heti integration
scripts/
  content/         build-runtime-data, build-search-index
  ci/              build guards and content linter
  ai/              advisory AI tools
config/            ops + typography notes
reports/           AI report output placeholders
tests/             regression tests
```

## 7. Common First-Time Issues

| Symptom | Fix |
|---|---|
| `tsx: not found` when running scripts | `npm install` again — `tsx` is a devDependency |
| `next/font` build hangs | Check outbound network; allow `fonts.googleapis.com` |
| Husky pre-commit fails on staged TS | Read the ESLint output; or `git commit --no-verify` for emergencies (then fix) |
| `runtime-data.json` invalid JSON | A new content file has bad frontmatter — re-run `npm run content:build` and read the error |
| `Cannot find module '@/...'` | TypeScript path alias — check `tsconfig.json` `paths`, re-run `npm run type-check` |
