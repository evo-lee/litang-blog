# Content Pipeline

English | [简体中文](./content-pipeline.zh-CN.md)

How Markdown / MDX gets from a file on disk into a rendered page.

## Source Files

```
content/
├── posts/         *.md or *.mdx — articles
├── pages/         *.mdx — long-form pages (about, etc.)
└── taxonomy/
    └── tags.json  tag display labels
```

### Locale Variants

A file with no locale suffix is the default (`zh-CN`). A file with `.en` before the extension is the English variant:

```
content/pages/about.mdx          → zh-CN
content/pages/about.en.mdx       → en
content/posts/blog_v4.md         → zh-CN
content/posts/blog_v4.en.md      → en (if present)
```

When `/en/about` is requested, the loader looks for `about.en.mdx`. If absent, it falls back to `about.mdx`. The fallback is deliberate — translation can lag without the site breaking.

## Frontmatter Schema (Posts)

Defined in `lib/content/frontmatter.ts` using Zod. Authoritative source — read it directly when in doubt.

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | yes | Min length 1 |
| `description` | string | yes | Min length 1; shown in listings / OG |
| `date` | date-coercible string | yes | `z.coerce.date()` — prefer `YYYY-MM-DD`; any string `new Date()` accepts works |
| `updated` | date-coercible string | no | Same coercion as `date` |
| `tags` | string[] | no | Default `[]` |
| `category` | string | no | Single primary category |
| `draft` | boolean | no | Default `false`; drafts excluded from listings |
| `featured` | boolean | no | Default `false`; can pin to home |
| `author` | string | no | Override site author |
| `canonical` | URL string | no | Cross-post canonical |
| `summary` | string | no | Hand-written summary, used by RSS / OG |
| `seoTitle` | string | no | Override `<title>` |
| `seoDescription` | string | no | Override meta description |
| `cover` | string | no | Cover image path or token |
| `coverAlt` | string | no | Cover alt text |
| `thumbnail` | string | no | Listing thumbnail |
| `thumbnailAlt` | string | no | Thumbnail alt text |
| `imageCredit` | string | no | Photo credit |
| `ogImage` | string | no | Explicit OG image |

### Example

```yaml
---
title: My Note
description: A short note about the build pipeline.
date: 2026-04-12
updated: 2026-04-15
tags: [build, cloudflare]
category: engineering
draft: false
featured: false
cover: /images/build.png
coverAlt: Build pipeline diagram
seoTitle: Inside the build pipeline
---

Hello from the content pipeline.
```

### Page Schema

Pages (`content/pages/*`) use a smaller schema: `title` (required), `description` (required), `draft` (default `false`), `updated` (optional date-coercible). The body is the page.

## Generated Artifacts

`npm run content:build` produces:

### `content/.generated/runtime-data.json`

Shape (simplified):

```ts
{
  generatedAt: string;            // ISO timestamp
  posts: PostListEntry[];         // light entries for listings
  postMap: { [slug:locale]: FullPost };   // full content for detail pages
  pages: PageVariant[];
}
```

Read via `lib/content/runtime.ts`:

```ts
import { getRuntimePosts, getRuntimePostBySlug } from '@/lib/content/runtime';

const zhPosts = getRuntimePosts('zh-CN');
const enPosts = getRuntimePosts('en');
const post = getRuntimePostBySlug('blog_v4', 'zh-CN');
```

**Do not** hand-edit `runtime-data.json` — it is rewritten on every build.

### `public/search-index.json`

Pre-built Fuse.js corpus. The client lazy-loads it on first search interaction:

```ts
import { searchDocuments } from '@/lib/search/client';
const results = await searchDocuments('cloudflare');
```

## Render Pipeline (Inside `build-runtime-data.ts`)

1. `glob` files under `content/posts/**` and `content/pages/**`.
2. Detect locale from filename suffix (`.en.md` → `en`, otherwise default).
3. `gray-matter` parses front matter from the file body.
4. Zod schema validates the front matter. Invalid front matter → build fails, error includes the file path.
5. `remark` + plugins render Markdown to HTML:
   - `remark-gfm` for tables, strikethrough, task lists
   - `rehype-slug` for heading ids
   - `rehype-autolink-headings` for anchor links
   - `rehype-pretty-code` + `shiki` for syntax highlighting
6. Excerpt is derived; cover image is resolved (explicit > first body image > default).
7. Result is merged into the snapshot keyed by `slug:locale`.

MDX files use the same build-time `unified` pipeline (`remark-parse` + `remark-mdx` + `remark-rehype`). The MDX syntax is parsed but **MDX bodies cannot reference JSX components** — there is no client-side MDX runtime. If you need component embedding, render through `lib/content/processor.ts` and add custom transformers.

## Authoring Workflow

Add a post:

```bash
# 1. Create the file
cat > content/posts/2026-05-15-my-note.md <<'EOF'
---
title: My Note
description: A short note.
date: 2026-05-15
tags: [notes]
---

Hello from the content pipeline.
EOF

# 2. Rebuild
npm run content:build

# 3. Visit /posts to confirm it appears, /posts/2026-05-15-my-note to read it
npm run dev
```

Add an English variant:

```bash
cp content/posts/2026-05-15-my-note.md content/posts/2026-05-15-my-note.en.md
# Edit the English variant
npm run content:build
```

Update a tag's display label: edit `content/taxonomy/tags.json`, rebuild.

## Drafts

Set `draft: true` in frontmatter. The post is filtered out of the generated runtime snapshot — so it disappears from:

- listings (`/posts`, home)
- post detail routes
- RSS / sitemap
- search index

`lib/content/posts.ts` keeps drafts only when `NODE_ENV === 'development'` at the moment `content:build` runs. The default `npm run content:build` does **not** set `NODE_ENV`, so drafts stay filtered even in dev. To preview drafts locally:

```bash
NODE_ENV=development npm run content:build
next dev --turbopack    # skip the wrapper that re-runs content:build
```

## Linting Content

```bash
npm run lint:content
```

Runs `scripts/ci/lint-content.ts`. Catches frontmatter errors before they reach the build.

## Image Handling

Images can be:

- Repo-local (`public/images/...`) — referenced by relative path
- Routed through `app/image/[variant]/[token]/route.ts` — for serving sized variants

Cover resolution order is documented in [Architecture > Image Delivery](./architecture.md#image-delivery).

## Common Mistakes

| Mistake | Symptom | Fix |
|---|---|---|
| Trailing whitespace in YAML | Build fails with cryptic parser error | Ensure frontmatter ends with `---` on its own line |
| Date in an unusual format | Schema coerces via `new Date(...)`; surprising parses are possible | Stick to ISO `2026-05-15` to keep behavior predictable |
| `tags: notes` (string) | Zod expects array | `tags: [notes]` |
| English variant filename `my-post-en.md` | Loader can't detect locale | Use `.en` before extension: `my-post.en.md` |
| Forgot `npm run content:build` after editing | Old content in dev | Rebuild; `dev` does it automatically on start |
| Hand-edited `runtime-data.json` | Changes lost on next build | Edit the source file; never the generated one |
