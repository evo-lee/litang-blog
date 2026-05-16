# 架构

[English](./architecture.md) | 简体中文

各部分如何拼起来。具体文件路径就地标注，深入主题给出跳转。

## 技术栈

- **框架** — Next.js 15、App Router、React 19
- **运行时适配器** — `@opennextjs/cloudflare`（OpenNext）→ Cloudflare Workers
- **内容** — Markdown / MDX 在构建期由 `unified` 管线处理（`remark-parse`、`remark-mdx`、`remark-gfm`、`remark-rehype`、`rehype-slug`、`rehype-autolink-headings`、`rehype-pretty-code`、`shiki`）。HTML 直接渲染进快照 — 无客户端 MDX runtime，MDX 正文不支持 JSX 组件。
- **样式** — Tailwind 4，文章内额外叠加 Heti（中文排版）
- **搜索** — 构建时生成 JSON 索引，浏览器端跑 Fuse.js
- **校验** — frontmatter 用 Zod
- **分析** — Umami + GA4，均由公开 feature flag 控制

## 总体流程

```
作者写 Markdown                   content/posts/*.md
        │
        ▼
npm run content:build             scripts/content/build-runtime-data.ts
        │                          ↓
        │   Zod 校验 frontmatter
        │   remark 渲染 Markdown → HTML
        │   按 locale 收集文章/页面
        ▼
content/.generated/runtime-data.json   ← 由 lib/content/runtime.ts 读取
public/search-index.json                ← 由浏览器端搜索读取
        │
        ▼
next build                        渲染 RSC + 静态 + 动态路由
        │
        ▼
opennextjs-cloudflare build       为 Workers 包装产物
        │
        ▼
Cloudflare Workers Builds         部署到 *.workers.dev / 自定义域
```

Worker 在请求期**绝不**读文件系统。所有内容访问走快照。

## 渲染模型

App Router + RSC。多数路由服务端渲染。部分路由因 locale 走 search param 或 runtime 内容访问而是动态的。

- locale 前缀路由（`app/[locale]/*`）能枚举处用 `generateStaticParams`。
- 无前缀路由（`app/(site)/*`）默认 `zh-CN`。
- Worker 同时服务静态 HTML 与动态响应；OpenNext 负责桥接。

## Locale 路由

两套路由树：

| 路由树 | 路径示例 | locale 来源 |
|---|---|---|
| `app/(site)/` | `/`、`/posts`、`/about` | 硬编码默认 `zh-CN` |
| `app/[locale]/` | `/zh-CN`、`/en`、`/en/about` | 路径段 |

locale 包装页内部把 `__locale` 透传给规范页面组件，两套树共用同一组 UI 组件。

内容变体解析：请求 `/en/about` 优先找 `content/pages/about.en.mdx`，不存在则回退 `content/pages/about.mdx`。

### 千万别这么干

```ts
// next.config.ts — 不要写
async rewrites() {
  return [{ source: '/:locale(en|zh-CN)/:path*', destination: '/:path*' }];
}
```

OpenNext / Cloudflare 预览在这种 rewrite 模式下返回 `500`。具体的 `app/[locale]/` 目录就是为绕过它而存在。重新引入正则会把生产打挂。

支持的 locale 在 `lib/i18n/config.ts`：

```ts
export const APP_LOCALES = ['zh-CN', 'en'] as const;
export const DEFAULT_LOCALE: AppLocale = 'zh-CN';
```

locale 前缀助手 `lib/i18n/routes.ts`。UI 文案 `lib/i18n/messages.ts`。

## 构建时内容管线

`next dev`、`next build`、所有 Cloudflare 构建前会跑两个脚本：

1. **`scripts/content/build-runtime-data.ts`** — 读 `content/posts/**` 与 `content/pages/**`，用 `lib/content/frontmatter.ts`（Zod）校验，渲染 Markdown / MDX，按 locale 收集，写出 `content/.generated/runtime-data.json`。
2. **`scripts/content/build-search-index.ts`** — 产出 `public/search-index.json` 供浏览器端搜索。

运行时读取走 `lib/content/runtime.ts`（`getRuntimePosts`、`getRuntimePostBySlug` 等）。**禁止**在请求期加 `fs.readdir` — Worker 没文件系统。

详细 schema 与示例见 [内容管线](./content-pipeline.zh-CN.md)。

## 图片分发

- `app/image/[variant]/[token]/route.ts` — 返回指定尺寸变体。
- `lib/cloudflare/loader.ts` — 自定义 Next.js image loader 生成正确的 token / variant URL。
- 封面优先级：frontmatter 显式 `cover` → 正文首图 → 默认封面。
- loader 在 `next.config.ts` 配置。

这套管线让站点把图片放仓库 / R2 同时不把原图暴露为规范 URL。

## 中文排版（Heti）

`lib/typography/` 集成 Heti CSS，**仅作用于 `.heti` 容器内**（文章正文）。代码块、表格、导航、UI 外壳被有意排除，避免 Heti 标点变换破坏代码语法或布局。

由 `NEXT_PUBLIC_ENABLE_HETI` 开关控制。

## SEO

- `lib/seo/` — metadata、OG 图、JSON-LD 助手。
- 路由：`app/rss.xml/route.ts`、`app/robots.ts`、`app/sitemap.ts`。
- 文章级覆写：frontmatter 中 `seoTitle`、`seoDescription`、`canonical`、`ogImage`。

## 分析

`lib/analytics/` 提供事件登记 + 派发。Umami 与 GA4 仅在对应 `NEXT_PUBLIC_ENABLE_*` 为 `true` 时加载。公开 flag = 客户端可见，视同公开。

## 搜索

`public/search-index.json` 构建时生成。客户端首次交互时懒加载，Fuse.js 在浏览器端跑模糊搜索。无服务端往返。

## 关键文件入口

| 文件 | 作用 |
|---|---|
| `lib/site.ts` | 站点名、baseUrl、导航 id |
| `lib/i18n/config.ts` | 支持的 locale、默认 locale |
| `lib/i18n/messages.ts` | 多语 UI 文案 |
| `lib/i18n/routes.ts` | locale 前缀助手 |
| `lib/content/frontmatter.ts` | 文章 / 页面的 Zod schema |
| `lib/content/runtime.ts` | 快照读取入口 |
| `lib/cloudflare/loader.ts` | 图片 loader |
| `next.config.ts` | Next 配置 — 图片 loader、output tracing |
| `open-next.config.ts` | OpenNext 适配器配置 |
| `wrangler.jsonc` | Worker 入口、assets 绑定、兼容标志 |

## 容易踩的坑

- 在 `next.config.ts` 加 locale 正则 rewrite → Cloudflare 预览 500。
- 手改 `content/.generated/runtime-data.json` → 下次构建被覆盖。
- 请求期读文件系统 → Worker 运行时崩。
- 把密钥放进 `NEXT_PUBLIC_*` → 泄漏到客户端 bundle。
- 在 `.heti` 容器外应用 Heti 样式 → 代码块和表格变形。
