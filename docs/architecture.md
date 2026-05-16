# Architecture

English | [简体中文](./architecture.zh-CN.md)

How the pieces fit. Concrete file paths inline; cross-references for deep dives.

## Stack

- **Framework** — Next.js 15, App Router, React 19
- **Runtime adapter** — `@opennextjs/cloudflare` (OpenNext) → Cloudflare Workers
- **Content** — Markdown / MDX parsed by a `unified` pipeline at build time (`remark-parse`, `remark-mdx`, `remark-gfm`, `remark-rehype`, `rehype-slug`, `rehype-autolink-headings`, `rehype-pretty-code`, `shiki`). HTML is rendered into the snapshot — no client-side MDX runtime, no JSX components inside MDX bodies.
- **Styling** — Tailwind 4 + scoped Heti CSS for CJK typography
- **Search** — Fuse.js over a build-time-generated JSON index
- **Validation** — Zod for frontmatter schemas
- **Analytics** — Umami + GA4, both behind public feature flags

## High-Level Flow

```
Author writes Markdown            content/posts/*.md
        │
        ▼
npm run content:build             scripts/content/build-runtime-data.ts
        │                          ↓
        │   Zod validates frontmatter
        │   remark renders Markdown → HTML
        │   pages and posts collected by locale
        ▼
content/.generated/runtime-data.json   ← read by lib/content/runtime.ts
public/search-index.json                ← read by client search UI
        │
        ▼
next build                        renders RSC + static + dynamic routes
        │
        ▼
opennextjs-cloudflare build       wraps output for Workers
        │
        ▼
Cloudflare Workers Builds         deploys to *.workers.dev / custom domain
```

The Worker **never** reads the filesystem at request time. All content access goes through the snapshot.

## Rendering Model

App Router with React Server Components. Most routes are server-rendered. Some are dynamic because locale is passed through search params or runtime content access.

- Locale-prefixed routes (`app/[locale]/*`) are statically enumerated via `generateStaticParams` where applicable.
- Unprefixed routes (`app/(site)/*`) default to `zh-CN`.
- The Worker runtime serves both static HTML and dynamic responses; OpenNext handles the bridging.

## Locale Routing

Two route trees:

| Tree | Path examples | Locale source |
|---|---|---|
| `app/(site)/` | `/`, `/posts`, `/about` | Hard-coded default `zh-CN` |
| `app/[locale]/` | `/zh-CN`, `/en`, `/en/about` | Path segment |

The locale wrapper pages forward `__locale` internally into the canonical page components, so there is one set of UI components serving both trees.

Content variant resolution: a request for `/en/about` looks for `content/pages/about.en.mdx`; if absent it falls back to `content/pages/about.mdx`.

### Do NOT do this

```ts
// next.config.ts — DO NOT
async rewrites() {
  return [{ source: '/:locale(en|zh-CN)/:path*', destination: '/:path*' }];
}
```

OpenNext / Cloudflare preview returns `500` on this rewrite pattern. The concrete `app/[locale]/` directory is the deliberate workaround. Reintroducing the regex will break production.

Supported locales live in `lib/i18n/config.ts`:

```ts
export const APP_LOCALES = ['zh-CN', 'en'] as const;
export const DEFAULT_LOCALE: AppLocale = 'zh-CN';
```

Locale prefix helpers: `lib/i18n/routes.ts`. UI strings: `lib/i18n/messages.ts`.

## Build-Time Content Pipeline

Two scripts run before `next dev`, `next build`, and any Cloudflare build:

1. **`scripts/content/build-runtime-data.ts`** — reads `content/posts/**` and `content/pages/**`, validates frontmatter with `lib/content/frontmatter.ts` (Zod), renders Markdown / MDX, collects locale variants, writes `content/.generated/runtime-data.json`.
2. **`scripts/content/build-search-index.ts`** — produces `public/search-index.json` for the client search.

Runtime access happens through `lib/content/runtime.ts` (`getRuntimePosts`, `getRuntimePostBySlug`, etc.). **Never** add request-time `fs.readdir` calls — the Worker has no filesystem.

Detailed schemas and examples: [Content Pipeline](./content-pipeline.md).

## Image Delivery

- `app/image/[variant]/[token]/route.ts` — request handler that returns a sized variant.
- `lib/cloudflare/loader.ts` — custom Next.js image loader producing the right token / variant URL.
- Cover resolution order: explicit `cover` frontmatter → first body image → default cover.
- The loader is configured in `next.config.ts`.

The pipeline lets the site keep images in the repo / R2 without exposing originals as the canonical URL.

## Chinese Typography (Heti)

`lib/typography/` integrates Heti CSS, but **only inside `.heti` containers** (article body). Code blocks, tables, navigation, UI chrome are intentionally excluded to avoid Heti's punctuation transforms breaking syntax or layout.

Toggle via `NEXT_PUBLIC_ENABLE_HETI`.

## SEO

- `lib/seo/` — metadata, OG image, JSON-LD helpers.
- Routes: `app/rss.xml/route.ts`, `app/robots.ts`, `app/sitemap.ts`.
- Per-post overrides: `seoTitle`, `seoDescription`, `canonical`, `ogImage` frontmatter fields.

## Analytics

`lib/analytics/` provides an event registry + dispatcher. Providers (Umami, GA4) load only when their `NEXT_PUBLIC_ENABLE_*` flag is true. Public flags = client-side; treat them as visible.

## Search

`public/search-index.json` is generated at build time. The client lazy-loads it on first interaction and runs Fuse.js fuzzy search in the browser. No server roundtrip required.

## File Map (Key Entry Points)

| File | Role |
|---|---|
| `lib/site.ts` | Site name, baseUrl, nav ids |
| `lib/i18n/config.ts` | Supported locales, default locale |
| `lib/i18n/messages.ts` | Localized UI strings |
| `lib/i18n/routes.ts` | Locale prefix helpers |
| `lib/content/frontmatter.ts` | Zod schemas for posts / pages |
| `lib/content/runtime.ts` | Runtime snapshot reader |
| `lib/cloudflare/loader.ts` | Image loader |
| `next.config.ts` | Next config — image loader, output tracing root |
| `open-next.config.ts` | OpenNext adapter config |
| `wrangler.jsonc` | Worker entrypoint, assets binding, compat flags |

## Things That Will Bite You

- Adding `next.config.ts` regex rewrites for locale → 500 on Cloudflare preview.
- Hand-editing `content/.generated/runtime-data.json` → overwritten on next build.
- Filesystem reads at request time → break in Worker runtime.
- Putting secrets in `NEXT_PUBLIC_*` → leaked into client bundle.
- Heti styles applied outside `.heti` containers → breaks code blocks and tables.
