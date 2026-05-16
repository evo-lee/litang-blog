# evolee-x Documentation

English | [简体中文](./README.zh-CN.md)

Wiki-style documentation for the `evolee-x` site. Lives in the repo, version-controlled with the code, rendered both on GitHub and locally.

## Table of Contents

| Topic | When to read |
|---|---|
| [Quick Start](./quick-start.md) | First clone — get the dev server running in 5 minutes |
| [Installation](./installation.md) | Detailed setup: Node, deps, content build, env vars |
| [Architecture](./architecture.md) | How rendering, locale routing, and the Worker runtime fit together |
| [Content Pipeline](./content-pipeline.md) | Authoring Markdown/MDX, frontmatter schema, generated artifacts |
| [Customization](./customization.md) | Change site title, nav, copy, locale defaults, feature flags |
| [Deployment](./deployment.md) | Cloudflare Workers Builds, GitHub Actions, env wiring, rollback |
| [AI Editorial Tools](./ai-tools.md) | `scripts/ai/*` proofreading, summaries, SEO, typography review |

## Reading Order

- **First-time user** — Quick Start → Installation → Customization
- **Contributor** — Architecture → Content Pipeline → Deployment
- **Editorial workflow** — Content Pipeline → AI Editorial Tools
- **Site operator** — Deployment → Customization (env / feature flags)

## Conventions

- File paths are repo-relative (e.g. `lib/site.ts`).
- Commands run from the repo root unless stated otherwise.
- Bilingual files end in `.en.mdx` / `.zh-CN.md`. The default locale is `zh-CN`; English content falls back to Chinese when absent.
- Production deploys go through Cloudflare Workers Builds (Git integration), not GitHub Actions. CI is a quality gate, not a deploy step.

## Out of Scope

These docs describe the project as it ships. Open-ended design discussion lives in `content/posts/blog_v4.md` (architecture essay) and `AGENTS.md` / `CLAUDE.md` (agent operating rules).
