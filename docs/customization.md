# Customization

English | [简体中文](./customization.zh-CN.md)

How to change what the site says, looks like, and links to. Each section names the exact file and the exact field. After most edits you only need to restart `npm run dev`; build-time-only edits are flagged.

## Site Identity (Title, Author, Base URL)

**File:** `lib/site.ts`

```ts
export const siteConfig = {
  name: '刻意进化',                             // aria-label / SEO metadata; NOT the visible header text
  title: "evo-lee's blog · lee刻意进化",        // <title> default, OG site_name
  description: 'AI 时代，是否要主动学习与进化完全掌握在自己手中。',  // meta description
  baseUrl: 'https://litang.one',                // absolute URL for canonical, sitemap, RSS, OG
  locale: 'zh-CN',                              // default locale string
  author: 'evolee',                             // default author for posts
  nav: [...],                                   // see "Navigation" below — labels here are unused for display
} as const;
```

Visible header text lives in `components/site/Nav.tsx`. To change the brand wordmark or visible nav UI, edit that component. `siteConfig.name` only feeds aria labels and SEO meta.

After editing: restart `npm run dev`. The change is type-safe — `tsc` will catch typos in `nav[].id`.

## Navigation

**Files:** `lib/site.ts` (`nav` — defines ids and hrefs) + `lib/i18n/messages.ts` (`messages.<locale>.nav.<id>` — the strings actually rendered) + `components/site/Nav.tsx` (the UI component).

```ts
// lib/site.ts
nav: [
  { id: 'home', href: '/', label: '首页' },     // `label` is a legacy field — NOT shown in the UI
  { id: 'posts', href: '/posts', label: '文章' },
  { id: 'projects', href: '/projects', label: '作品' },
  { id: 'about', href: '/about', label: '关于' },
],
```

The visible nav text for both Chinese and English comes from `lib/i18n/messages.ts`:

```ts
'zh-CN': { nav: { home: '首页', posts: '文章', projects: '作品', about: '关于' } },
en:      { nav: { home: 'Home', posts: 'Posts', projects: 'Projects', about: 'About' } },
```

To add a nav item:

1. Add an entry to `nav` in `lib/site.ts`. Pick a stable `id`.
2. Add `<id>` under `messages['zh-CN'].nav` and `messages.en.nav` in `lib/i18n/messages.ts`.
3. Create the route at `app/(site)/<id>/page.tsx` and `app/[locale]/<id>/page.tsx`.

To rename a visible label: edit `messages.<locale>.nav.<id>` for **both** locales. The `label` field in `lib/site.ts` is not read by the rendered nav.

## UI Copy / Localized Strings

**File:** `lib/i18n/messages.ts`

Structure:

```ts
const messages = {
  'zh-CN': {
    nav: { home: '首页', ... },
    home: { eyebrow: '...', titleTop: '...', lede: '...', ticker: [...] },
    posts: { title: '全部文章', ... },
    projects: { ... },
    post: { back: '← 返回文章列表', ... },
    about: { fallbackTitle: '关于我' },
  },
  en: { /* mirror keys */ },
}
```

To change a phrase: edit both `zh-CN` and `en` entries. They have the same shape. Missing keys in `en` are not auto-filled — type errors will catch most mistakes.

## Default Locale

**File:** `lib/i18n/config.ts`

```ts
export const APP_LOCALES = ['zh-CN', 'en'] as const;
export const DEFAULT_LOCALE: AppLocale = 'zh-CN';
```

Changing the default also changes which content variant `/` serves. Verify with `npm run cf:preview` because OpenNext is sensitive to routing changes.

To add a third locale (`ja` for example):

1. Add `'ja'` to `APP_LOCALES`.
2. Add a `ja:` block to `messages` in `lib/i18n/messages.ts`.
3. Add the locale to wherever the `[locale]` route enumerates statics (`generateStaticParams`).
4. Use `.ja.md` / `.ja.mdx` suffixes for content variants.
5. Rebuild and verify `/ja`.

## Home Page Content

**File:** `app/(site)/page.tsx` and `app/[locale]/page.tsx` (the latter wraps the former)

The home page reads from `lib/i18n/messages.ts` (`home.*`). To change:

- Hero copy → `messages.<locale>.home.titleTop / titleEm / lede`
- Ticker strip → `messages.<locale>.home.ticker[]`
- Section labels → `messages.<locale>.home.articlesTitle / projectsTitle / ...`

Featured posts on the home page come from runtime posts with `featured: true` in frontmatter. To pin a post: edit its frontmatter.

## About Page

**File:** `content/pages/about.mdx` (zh-CN), `content/pages/about.en.mdx` (en)

This is content, not code. Edit the MDX directly, then `npm run content:build`. The page route (`app/(site)/about/page.tsx`) only renders the loaded content.

## Posts Page Behavior

**File:** `app/(site)/posts/page.tsx` and the post detail at `app/(site)/posts/[slug]/page.tsx`

Listing logic is server-side using `getRuntimePosts(locale)`. To change sort / filter behavior: edit the page file. Frontmatter fields `draft`, `featured`, `date`, `tags` are what you have to work with.

## Per-Post Meta (Title, Description, Cover, SEO)

These come from frontmatter — no code change needed.

```yaml
---
title: Visible page title
description: Used in listings and OG
seoTitle: Override of the HTML <title>
seoDescription: Override of the meta description
cover: /images/cover.png
ogImage: /images/og-card.png
canonical: https://example.com/the-canonical-url
---
```

After editing, `npm run content:build` (or restart `npm run dev`).

## Feature Flags

Set in `.env.local` (dev) or the Cloudflare dashboard (prod).

| Flag | Default when unset | Disable explicitly |
|---|---|---|
| `NEXT_PUBLIC_ENABLE_HETI` | **on** — Heti CJK typography applies inside articles | Set to `false` |
| `NEXT_PUBLIC_ENABLE_UMAMI` | **off** — Umami script not loaded | Set to `true` to enable (also needs `NEXT_PUBLIC_UMAMI_*`) |
| `NEXT_PUBLIC_ENABLE_GA` | **off** — GA4 not loaded | Set to `true` to enable (also needs `NEXT_PUBLIC_GA_ID`) |

These are inlined into the client bundle at build time. Toggling requires a rebuild.

## Tags

**File:** `content/taxonomy/tags.json`

Maps tag slugs (used in frontmatter) to display labels. Add entries when you introduce a new tag.

## Colors / Fonts / Layout

- Global CSS — `app/globals.css`
- Tailwind config — Tailwind 4 reads CSS-first; check `app/globals.css` for `@theme` blocks and PostCSS config in `postcss.config.mjs`.
- Reading typography — `lib/typography/` and Heti CSS. Stay inside `.heti` containers.

UI components live in `components/`. Renaming or restructuring components is out of scope for "customization" — that's refactor work.

## SEO Defaults

**File:** `lib/seo/`

- Default title pattern, OG image fallback, JSON-LD shape — defined here.
- Per-post overrides come from frontmatter (see [Content Pipeline](./content-pipeline.md)).

## Analytics

**File:** `lib/analytics/`

- Event registry — `lib/analytics/event-registry.ts`
- Providers — `lib/analytics/providers.ts`
- Dispatch — `lib/analytics/track.ts`

To add an event:

```ts
trackEvent('open_search', { source: 'header' });
```

Register it in the event registry first so the type system enforces correct payload shape.

## Quick Reference — "I want to change X"

| Goal | File | Build? |
|---|---|---|
| Visible header brand text | `components/site/Nav.tsx` | `dev` reload |
| `siteConfig.name` (aria + SEO) | `lib/site.ts` `siteConfig.name` | `dev` reload |
| `<title>` default | `lib/site.ts` `siteConfig.title` | `dev` reload |
| Base URL (canonical etc.) | `lib/site.ts` `siteConfig.baseUrl` | rebuild for sitemap/RSS |
| Add nav item | `lib/site.ts` + `lib/i18n/messages.ts` + new route file | `dev` reload |
| Home hero copy | `lib/i18n/messages.ts` | `dev` reload |
| About page body | `content/pages/about*.mdx` | `npm run content:build` |
| Post title or cover | frontmatter | `npm run content:build` |
| Add new locale | `lib/i18n/config.ts` + messages + routes | full rebuild |
| Default locale | `lib/i18n/config.ts` | `cf:preview` to verify |
| Tag display label | `content/taxonomy/tags.json` | `content:build` |
| Heti / Umami / GA on-off | `.env.local` / CF dashboard | rebuild |
| Default OG image | `lib/seo/` | rebuild |
| Theme colors | `app/globals.css` | `dev` reload |
