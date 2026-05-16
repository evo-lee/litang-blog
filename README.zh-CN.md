# evolee-x

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

`evolee-x` 是一个基于 Next.js 15 App Router 和 OpenNext for Cloudflare Workers
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

### 总览：双轨自动化

本仓库 push 到 `main` 后，两件事**并行独立**运行：

| 系统 | 角色 | 触发 | 失败影响 |
|---|---|---|---|
| GitHub Actions `ci.yml` | 质量门禁 — lint / type-check / test / build / cf:build | 每次 push 和 PR | 仅显示红叉，不阻断部署 |
| Cloudflare Workers Builds | 实际构建并部署到生产 | 每次 push（控制台 Git 集成） | 站点未更新 |

两者读取同一 commit，但环境变量分别配置。**不要混淆**：CI 失败不代表部署失败，反之亦然。

### 环境变量与 Secret 工作流

**`.env.example` 是模板，禁止填真值。**`.env.local` 是本机真值文件，已被 `.gitignore` 排除。生产密钥配在 Cloudflare 控制台，不在仓库。

```bash
# 首次配置：复制模板，仅本机生效
cp .env.example .env.local
# 编辑 .env.local 填入真实值（NEXT_PUBLIC_*、可选 ANTHROPIC_API_KEY 等）
```

三处配置点：

1. **本机 `.env.local`**：本地开发与本地 `cf:preview` 用
2. **GitHub repo → Settings → Secrets and variables → Actions**：CI 用
   - Variables（非敏感）：`NEXT_PUBLIC_UMAMI_SCRIPT_URL` / `NEXT_PUBLIC_UMAMI_WEBSITE_ID` / `NEXT_PUBLIC_GA_ID`
   - Secrets（敏感）：`ANTHROPIC_API_KEY`（仅当手动触发 AI 工作流时需要）
3. **Cloudflare Workers 项目 → Settings → Variables and Secrets**：生产构建与运行时用
   - 同样的 `NEXT_PUBLIC_*` 变量必须重复配置一份

### 首次部署步骤

1. **吊销并禁用任何已泄露密钥**（参考 `.env.example` 警告）
2. **本地校验**：
   ```bash
   npm install
   npm run lint && npm run type-check && npm run test && npm run build
   npm run cf:preview   # 本地 8787 端口预览 Worker 行为
   ```
3. **配 GitHub Vars / Secrets**（如上）
4. **接 Cloudflare Workers Builds**：
   - Cloudflare 控制台 → Workers & Pages → **Create** → **Import a repository**
   - 选 GitHub repo → `main` 分支
   - Build command: `npm run cf:build`
   - Deploy command: `npx opennextjs-cloudflare deploy`
   - 在 Build variables 中加 `NEXT_PUBLIC_*`
5. **触发部署**：再 push 一次任意 commit，或在控制台手动重跑
6. **验证**：访问 `/api/health` + 上面列出的 locale 路由

### 手动部署（备用）

若 Cloudflare Git 集成不可用：

```bash
# 需先 wrangler login
npm run cf:deploy
```

### GitHub Actions 工作流说明

- `ci.yml`：每次 push / PR 自动运行。lint、type-check、test、build。不会自动部署。
- `ai-content-check.yml`：**仅手动触发**（`workflow_dispatch`）。Actions 页面 → AI Content Check → **Run workflow**。需先在 repo Secrets 中配 `ANTHROPIC_API_KEY`。

### 常见错误排查

| 现象 | 原因 | 解决 |
|---|---|---|
| CI build 报 `NEXT_PUBLIC_*` 未定义 | GitHub Vars 未配 | 配 repo Variables |
| Cloudflare 部署成功，分析脚本未加载 | Cloudflare 项目漏配 `NEXT_PUBLIC_*` | 在 Workers Settings 加 |
| `/zh-CN/about` 返回 500 | 重新引入了 regex rewrite | 检查 `next.config.ts`，参考 Locale 路由小节 |
| Action 中 ai-content-check 一直红 | 旧版自动触发，缺 API key | 拉最新代码，已改为手动触发 |
| 推送后站点未更新 | 未接 Cloudflare Git 集成 | 按首次部署步骤 4 配置 |

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
