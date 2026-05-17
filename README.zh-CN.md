# litang-blog

[English](./README.md) | 简体中文

> **完整文档**见 [Wiki](https://github.com/evo-lee/litang-blog/wiki/Home.zh-CN)：
> [快速开始](https://github.com/evo-lee/litang-blog/wiki/quick-start.zh-CN) ·
> [安装与使用](https://github.com/evo-lee/litang-blog/wiki/installation.zh-CN) ·
> [架构](https://github.com/evo-lee/litang-blog/wiki/architecture.zh-CN) ·
> [内容管线](https://github.com/evo-lee/litang-blog/wiki/content-pipeline.zh-CN) ·
> [自定义](https://github.com/evo-lee/litang-blog/wiki/customization.zh-CN) ·
> [部署运维](https://github.com/evo-lee/litang-blog/wiki/deployment.zh-CN) ·
> [AI 工具](https://github.com/evo-lee/litang-blog/wiki/ai-tools.zh-CN)
>
> 源文件位于 [`docs/`](./docs/README.zh-CN.md),Wiki 自动同步。

## 项目整体说明

`litang-blog` 是一个基于 Next.js 15 App Router 和 OpenNext for Cloudflare Workers
的个人内容站点。它面向随笔、技术文章、读书笔记、项目页和长页面，同时保持边缘运行兼容、不依赖数据库。

当前实现使用构建期生成的内容产物作为运行时数据源，用真实 locale 路由保证 Cloudflare 兼容，并通过统一 helper 管理 SEO、图片、分析、搜索和中文排版。

## 功能覆盖

- 基于 Markdown/MDX 的内容系统，frontmatter 使用 Zod 校验。
- 运行时内容快照生成到 `content/.generated/runtime-data.json`。
- 客户端搜索索引生成到 `public/search-index.json`。
- `/en` 和 `/zh-CN` 使用 `app/[locale]/` 下的真实路由。
- 不带前缀的 `app/(site)/` 路由使用默认中文 locale。
- 当前页面：首页、文章列表、文章详情、项目页、关于页。
- 内容按 locale 解析，英文内容缺失时回退到中文内容。
- SEO 路由与 helper 覆盖 metadata、JSON-LD、RSS、sitemap、robots。
- Cloudflare 图片路由和自定义图片 loader helper。
- 文章渲染、目录、代码复制按钮、站点骨架和本地化导航。
- 基于生成式搜索索引的搜索栏。
- Umami 和 GA4 分析通过 public feature flag 控制。
- AI 编辑 CLI：校对、摘要、SEO 建议、排版审查。
- `/api/health` 健康检查。

## 项目结构

- `app/(site)/`：不带 locale 前缀的站点路由，默认使用 `zh-CN`。
- `app/[locale]/`：`/en` 和 `/zh-CN` 的具体本地化路由。
- `app/api/health/route.ts`：健康检查接口。
- `app/image/[variant]/[token]/route.ts`：公开图片路由。
- `app/rss.xml/route.ts`、`app/robots.ts`、`app/sitemap.ts`：metadata 路由。
- `components/`：文章、站点骨架、分析、SEO、开发辅助组件。
- `content/posts/`：文章源内容。
- `content/pages/`：页面源内容，例如 `about.mdx` 和 `about.en.mdx`。
- `content/.generated/`：生成后的运行时内容和封面元数据。
- `content/taxonomy/`：分类法源数据。
- `lib/content/`：内容解析、处理、运行时访问和封面解析。
- `lib/i18n/`：locale 配置、路由 helper、文案和服务端 locale 工具。
- `lib/seo/`：metadata、Open Graph 和结构化数据 helper。
- `lib/cloudflare/`：图片变体和 loader 工具。
- `lib/search/`：客户端搜索类型和索引加载。
- `lib/analytics/`：分析事件注册表、provider 和事件上报。
- `lib/typography/`：中文排版集成和排除策略。
- `scripts/content/`：运行时快照和搜索索引构建脚本。
- `scripts/ci/`：仓库检查和构建输出保护脚本。
- `scripts/ai/`：AI 编辑辅助 CLI。
- `config/`：运维和排版说明。
- `reports/`：构建和 AI 报告输出占位。
- `tests/`：聚焦的回归测试。

## 环境依赖

- Node.js `>=20`
- npm
- Cloudflare Wrangler，用于 Worker 预览和部署
- 可选：AI 编辑工具需要对应 API key

`next/font` 在生产构建或 Cloudflare 构建时可能需要网络访问，用于获取 Google font metadata。

## 常用命令

安装依赖：

```bash
npm install
```

生成内容产物：

```bash
npm run content:build
```

启动本地开发：

```bash
npm run dev
```

`dev` 会先执行 `content:build`，再启动带 Turbopack 的 Next.js 开发服务。

构建并启动生产版 Next.js 输出：

```bash
npm run build
npm run start
```

执行常规校验：

```bash
npm run lint
npm run test
npm run lint:content
npm run type-check
npm run build
```

执行 Cloudflare 兼容构建和预览：

```bash
npm run cf:build
npm run cf:preview
```

手动部署到 Cloudflare：

```bash
npm run cf:deploy
```

只上传 Worker version、不立即部署：

```bash
npm run cf:versions:upload
```

## 配置说明

### 站点个性化（Fork 友好）

**所有个人信息集中在 `lib/site.ts` 一个文件**。Fork 后改这一个文件即可完成大部分换肤：身份、作者、社交链接、footer 文案、SEO 默认值、导航、feature flag。所有消费方（`lib/seo/constants.ts`、`components/site/Footer.tsx`、`components/site/Nav.tsx`、sitemap、robots、RSS）都从这里 import。

### 构建与基础设施

修改构建或部署行为前，先看这些文件：

- `package.json`：脚本入口和工具链。
- `next.config.ts`：Next.js 和图片设置。
- `open-next.config.ts`：OpenNext Cloudflare 适配设置。
- `wrangler.jsonc`：Cloudflare Worker 预览和部署配置。
- `eslint.config.js`、`.prettierrc`、`tsconfig.json`：源码质量设置。

运行时和工具变量：

- `NEXT_PUBLIC_ENABLE_HETI`：启用文章范围内的中文排版增强。
- `NEXT_PUBLIC_ENABLE_UMAMI`：启用 Umami 分析脚本。
- `NEXT_PUBLIC_UMAMI_SCRIPT_URL`：Umami 脚本地址。
- `NEXT_PUBLIC_UMAMI_WEBSITE_ID`：Umami 网站 ID。
- `NEXT_PUBLIC_ENABLE_GA`：启用 GA4。
- `NEXT_PUBLIC_GA_ID`：GA4 measurement ID。
- `AI_PROVIDER`：`anthropic` 或 `openai`。
- `ANTHROPIC_API_KEY`：`AI_PROVIDER=anthropic` 时需要。
- `ANTHROPIC_BASE_URL`：可选，Anthropic 兼容接口地址。
- `OPENAI_API_KEY`：`AI_PROVIDER=openai` 时需要。
- `OPENAI_BASE_URL`：可选，OpenAI 兼容接口地址。

## Locale 路由

支持的 locale 定义在 `lib/i18n/config.ts`：

- `zh-CN`：默认 locale。
- `en`：英文 locale。

本项目有意在 `app/[locale]/` 下使用具体路由文件实现本地化路径。不要在
`next.config.ts` 重新加入 `/:locale(en|zh-CN)` 这种 regex rewrite；OpenNext
Cloudflare 预览曾在这个模式下返回 Worker `500`。

修改路由、locale 检测、导航或部署配置时，需要在 Cloudflare preview 中验证：

- `/`
- `/zh-CN`
- `/en`
- `/zh-CN/about`
- `/en/about`

## 部署

### 工作原理

`.env*` 文件**只供本地开发用**，已被 `.gitignore` 排除。真正的部署链路是 **Cloudflare Workers Builds**（CF 控制台的 Git 集成）。每次 push 到 `main` 时 Cloudflare 端会拉代码、跑构建、从该项目的 Build variables 注入 `NEXT_PUBLIC_*` 后部署。

GitHub Actions 只负责质量门禁：

| Workflow | 角色 | 失败影响 |
|---|---|---|
| `ci.yml` | 质量门禁 — lint / type-check / test / build | 仅红叉，不阻断部署 |
| Cloudflare Workers Builds | push 到 `main` 时构建并部署 | 站点未更新 |

### 变量分类

按三类管理。放错位置是最常见的部署事故。

**1. 构建期公开变量 (`NEXT_PUBLIC_*`) — GitHub Variables**

这类变量在构建时被 webpack 直接替换进 JS bundle。每次 CI 都是干净环境，必须每次重新注入。没有"配一次就行"的概念 — 如果 `deploy.yml` 这次没注入，构出来的 bundle 里值就是 `undefined`，会直接覆盖上次成功的部署。

仓库 → Settings → Secrets and variables → Actions → **Variables** 标签：

| Key | 示例 |
|---|---|
| `NEXT_PUBLIC_UMAMI_SCRIPT_URL` | `https://cloud.umami.is/script.js` |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | 你的 Umami ID |
| `NEXT_PUBLIC_GA_ID` | `G-XXXXXXXX` |
| `NEXT_PUBLIC_ENABLE_UMAMI` | `true` |
| `NEXT_PUBLIC_ENABLE_GA` | `true` |
| `NEXT_PUBLIC_ENABLE_HETI` | `true` |

**2. Cloudflare Workers Builds Build variables — Cloudflare 控制台**

部署用的真实构建在 Cloudflare 端跑。把 1) 表里同样的 `NEXT_PUBLIC_*` 配到该 Worker 项目的 Build variables，bundle 才有值。

Cloudflare 控制台 → Workers & Pages → 选项目 → **Settings → Builds → Build variables**。

**3. CI 专用敏感值 — GitHub Secrets**

仅手动 AI workflow 需要。仓库 → Settings → Secrets and variables → Actions → **Secrets** 标签：

| Key | 用途 |
|---|---|
| `ANTHROPIC_API_KEY` | 手动跑 `ai-content-check` workflow 时需要 |

**4. Cloudflare Worker 运行时 secret — Cloudflare 控制台**

Worker 代码内通过 `env.X` 读取。跨部署保留。当前本项目**不需要**任何运行时 secret：analytics key 是构建期 bundle 进去的（类 1），AI key 仅 CI 脚本用（类 3），无数据库、无后端鉴权。仅当 Worker 代码本身需要时再加。

### 首次配置

1. **本地开发** — `cp .env.example .env.local`，填值，供 `npm run dev` 和 `npm run cf:preview` 用。**不要提交** `.env.local`
2. **接 Cloudflare Workers Builds** — CF 控制台 → Workers & Pages → Create → Import a repository → 选仓库、`main` 分支。Build command：`npm run cf:build`。Deploy command：`npx opennextjs-cloudflare deploy`
3. **配 Cloudflare Build variables** — 上表所有 `NEXT_PUBLIC_*` 加到 Worker 项目的 Build settings
4. **配 GitHub Variables** — 同样的 `NEXT_PUBLIC_*`，让 `ci.yml` 构建步骤能跑通
5. **push 到 `main`** — Cloudflare 自动部署。在 Worker 的 **Deployments** 标签看进度
6. **验证** — 访问 `/api/health` 及上面列出的 locale 路由

### 手动部署（备用）

需要绕开 CI 直接从本机部署时：

```bash
# 需先 wrangler login，或 shell 中已 export CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID
npm run cf:deploy
```

此命令使用本地 `.env.local` 注入 `NEXT_PUBLIC_*`。

### GitHub Actions 工作流

- `ci.yml`：每次 push / PR 自动跑 lint / type-check / test / build。**不部署**
- `ai-content-check.yml`：**仅手动触发**。需 Secrets 中配 `ANTHROPIC_API_KEY`
- `sync-wiki.yml`：把 `docs/` 同步到 GitHub wiki

### 常见错误排查

| 现象 | 原因 | 解决 |
|---|---|---|
| Cloudflare 构建报 `NEXT_PUBLIC_*` 未定义 | Cloudflare 端 Build variables 未配 | Worker 项目 → Settings → Builds 里补 |
| 部署成功但 analytics 脚本不加载 | Build variables 没配或值错 | 重新核对 Cloudflare Build variables |
| push 到 `main` 不触发部署 | 未接 Cloudflare Git 集成 | CF 控制台 → Workers & Pages → Import repository |
| `/zh-CN/about` 返回 500 | 重新引入了 regex rewrite | 检查 `next.config.ts`，参考 Locale 路由小节 |

## 设计逻辑

### 构建期内容校验

Markdown 内容在页面读取前完成解析、校验、渲染和摘要提取。非法 frontmatter 应该在内容生成或构建阶段失败，而不是部署后才暴露。

### Worker 安全的运行时数据

Cloudflare Workers 不适合依赖运行时文件系统遍历，所以站点会在开发、构建、Cloudflare 预览和部署前生成运行时 JSON 快照和搜索索引。

### 真实 locale 路由

带 locale 前缀的页面使用真实 App Router 路由实现，保证 OpenNext 和 Cloudflare Workers 输出兼容。

### SEO 与图片策略集中治理

路由应该使用共享 helper 处理 canonical URL、metadata、结构化数据和图片变体，不要在页面里复制临时规则。

### 渐进增强

中文排版、分析、搜索和开发辅助都是可选增强层。它们不应该阻塞核心页面渲染。

## 使用示例

### 新增文章

在 `content/posts/` 下创建 Markdown 或 MDX 文件：

```md
---
title: My Note
description: A short note.
date: 2026-03-27
tags: [notes]
featured: false
draft: false
---

Hello from the content pipeline.
```

然后重新生成内容：

```bash
npm run content:build
```

### 新增本地化页面内容

英文页面变体使用 locale 后缀：

```text
content/pages/about.mdx
content/pages/about.en.mdx
```

如果英文内容不存在，会回退到默认中文内容。

### 读取运行时文章

```ts
import { getRuntimePosts } from '@/lib/content/runtime';

const chinesePosts = getRuntimePosts('zh-CN');
const englishPosts = getRuntimePosts('en');
```

### 按 slug 读取运行时文章

```ts
import { getRuntimePostBySlug } from '@/lib/content/runtime';

const post = getRuntimePostBySlug('blog_v4', 'zh-CN');
```

### 执行本地搜索

```ts
import { searchDocuments } from '@/lib/search/client';

const results = await searchDocuments('cloudflare');
```

### 上报分析事件

```ts
import { trackEvent } from '@/lib/analytics/track';

trackEvent('open_search', {
  source: 'header',
});
```

### 运行 AI 编辑工具

```bash
npm run ai:proofread -- --file content/posts/blog_v4.md
```

简化写法：

```bash
npm run ai -- blog_v4.md
```

## 文档同步规则

当项目事实、命令、路由、部署方式或 agent 工作说明变化时，同步维护：

- `README.md`
- `README.zh-CN.md`
- `AGENTS.md`
- `CLAUDE.md`

不要添加仓库里不存在的文档链接。
