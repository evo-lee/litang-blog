# 自定义

[English](./customization.md) | 简体中文

如何修改站点显示的文字、外观、跳转。每节给出具体文件和字段。多数改动重启 `npm run dev` 即可；仅构建时生效的会标注。

## 站点标识（标题、作者、Base URL）

**文件：** `lib/site.ts`

```ts
export const siteConfig = {
  name: '刻意进化',                             // 用作 aria-label / SEO 元数据；**不是**顶栏可见文字
  title: "evo-lee's blog · lee刻意进化",        // <title> 默认值、OG site_name
  description: 'AI 时代，是否要主动学习与进化完全掌握在自己手中。',  // meta description
  baseUrl: 'https://litang.one',                // 绝对 URL，用于 canonical、sitemap、RSS、OG
  locale: 'zh-CN',                              // 默认 locale 字符串
  author: 'evolee',                             // 文章默认作者
  nav: [...],                                   // 见下方"导航" — 这里的 label 字段不参与渲染
} as const;
```

顶栏可见文字在 `components/site/Nav.tsx`。要改品牌字样或导航 UI，编辑该组件。`siteConfig.name` 只喂 aria 标签和 SEO 元数据。

改完重启 `npm run dev`。类型安全 — `tsc` 会抓出 `nav[].id` 拼错。

## 导航

**文件：** `lib/site.ts`（`nav` — 定义 id 与 href）+ `lib/i18n/messages.ts`（`messages.<locale>.nav.<id>` — 真正渲染的字符串）+ `components/site/Nav.tsx`（UI 组件）。

```ts
// lib/site.ts
nav: [
  { id: 'home', href: '/', label: '首页' },     // `label` 是历史字段 — 不会被 UI 读取
  { id: 'posts', href: '/posts', label: '文章' },
  { id: 'projects', href: '/projects', label: '作品' },
  { id: 'about', href: '/about', label: '关于' },
],
```

中英文可见导航文字都从 `lib/i18n/messages.ts` 取：

```ts
'zh-CN': { nav: { home: '首页', posts: '文章', projects: '作品', about: '关于' } },
en:      { nav: { home: 'Home', posts: 'Posts', projects: 'Projects', about: 'About' } },
```

加导航项：

1. `lib/site.ts` 的 `nav` 加一项。`id` 选稳定值。
2. `lib/i18n/messages.ts` 的 `messages['zh-CN'].nav` 与 `messages.en.nav` 加上 `<id>`。
3. 在 `app/(site)/<id>/page.tsx` 与 `app/[locale]/<id>/page.tsx` 建路由。

改可见 label：编辑 `messages.<locale>.nav.<id>`，**两种语言都要改**。`lib/site.ts` 的 `label` 字段渲染时不读。

## UI 文案 / 多语字符串

**文件：** `lib/i18n/messages.ts`

结构：

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
  en: { /* 镜像 key */ },
}
```

改文案：`zh-CN` 和 `en` 两边都要改，结构相同。`en` 缺 key 不会自动补 — 类型错误能抓住绝大多数遗漏。

## 默认 Locale

**文件：** `lib/i18n/config.ts`

```ts
export const APP_LOCALES = ['zh-CN', 'en'] as const;
export const DEFAULT_LOCALE: AppLocale = 'zh-CN';
```

改默认 locale 也会改 `/` 服务哪种内容变体。改完用 `npm run cf:preview` 验证 — OpenNext 对路由变化敏感。

加第三种 locale（如 `ja`）：

1. `APP_LOCALES` 加 `'ja'`。
2. `lib/i18n/messages.ts` 加 `ja:` 块。
3. `[locale]` 路由静态枚举（`generateStaticParams`）处加上。
4. 内容变体后缀用 `.ja.md` / `.ja.mdx`。
5. 重建，验证 `/ja`。

## 首页内容

**文件：** `app/(site)/page.tsx` 与 `app/[locale]/page.tsx`（后者包装前者）

首页从 `lib/i18n/messages.ts`（`home.*`）取文案。改：

- Hero 文案 → `messages.<locale>.home.titleTop / titleEm / lede`
- Ticker 滚动条 → `messages.<locale>.home.ticker[]`
- 区块标题 → `messages.<locale>.home.articlesTitle / projectsTitle / ...`

首页置顶文章来自 frontmatter `featured: true`。要置顶某文，改它的 frontmatter。

## About 页

**文件：** `content/pages/about.mdx`（zh-CN）、`content/pages/about.en.mdx`（en）

这是内容不是代码。直接改 MDX，然后 `npm run content:build`。页面路由（`app/(site)/about/page.tsx`）只渲染加载出来的内容。

## 文章页行为

**文件：** `app/(site)/posts/page.tsx` 与详情页 `app/(site)/posts/[slug]/page.tsx`

列表逻辑服务端跑，用 `getRuntimePosts(locale)`。要改排序 / 过滤：改 page 文件。可用 frontmatter 字段 `draft`、`featured`、`date`、`tags`。

## 文章 meta（标题、描述、封面、SEO）

走 frontmatter，无需改代码：

```yaml
---
title: 页面可见标题
description: 列表与 OG 用
seoTitle: 覆盖 HTML <title>
seoDescription: 覆盖 meta description
cover: /images/cover.png
ogImage: /images/og-card.png
canonical: https://example.com/the-canonical-url
---
```

改完 `npm run content:build`（或重启 `npm run dev`）。

## 功能开关

写在 `.env.local`（dev）或 Cloudflare 控制台（生产）。

| 开关 | 未设时默认 | 显式关闭 |
|---|---|---|
| `NEXT_PUBLIC_ENABLE_HETI` | **开** — 文章内启用 Heti 中文排版 | 设为 `false` |
| `NEXT_PUBLIC_ENABLE_UMAMI` | **关** — 不加载 Umami | 设为 `true` 启用（还需 `NEXT_PUBLIC_UMAMI_*`） |
| `NEXT_PUBLIC_ENABLE_GA` | **关** — 不加载 GA4 | 设为 `true` 启用（还需 `NEXT_PUBLIC_GA_ID`） |

**这些值构建时内联到客户端 bundle**。切换后必须重建。

## 标签

**文件：** `content/taxonomy/tags.json`

把 frontmatter 中的 tag slug 映射到显示名。新 tag 出现时记得加。

## 颜色 / 字体 / 布局

- 全局 CSS — `app/globals.css`
- Tailwind 配置 — Tailwind 4 走 CSS-first：检查 `app/globals.css` 的 `@theme` 块和 `postcss.config.mjs`。
- 阅读区排版 — `lib/typography/` 与 Heti CSS。务必只作用于 `.heti` 容器。

UI 组件在 `components/`。改组件结构属于重构，不在"自定义"范围内。

## SEO 默认值

**文件：** `lib/seo/`

- 默认标题模式、OG 图回退、JSON-LD 结构在此定义。
- 文章级覆写走 frontmatter（见 [内容管线](./content-pipeline.zh-CN.md)）。

## 分析

**文件：** `lib/analytics/`

- 事件登记 — `lib/analytics/event-registry.ts`
- 提供商 — `lib/analytics/providers.ts`
- 派发 — `lib/analytics/track.ts`

加事件：

```ts
trackEvent('open_search', { source: 'header' });
```

先在事件登记表里登记，类型系统才会强制 payload 形状正确。

## 速查表 — "我想改 X"

| 目标 | 文件 | 构建？ |
|---|---|---|
| 顶栏可见品牌文字 | `components/site/Nav.tsx` | `dev` 重启 |
| `siteConfig.name`（aria + SEO） | `lib/site.ts` `siteConfig.name` | `dev` 重启 |
| `<title>` 默认 | `lib/site.ts` `siteConfig.title` | `dev` 重启 |
| Base URL（canonical 等） | `lib/site.ts` `siteConfig.baseUrl` | sitemap/RSS 需重建 |
| 加导航项 | `lib/site.ts` + `lib/i18n/messages.ts` + 新路由 | `dev` 重启 |
| 首页 Hero 文案 | `lib/i18n/messages.ts` | `dev` 重启 |
| About 页正文 | `content/pages/about*.mdx` | `npm run content:build` |
| 文章标题 / 封面 | frontmatter | `npm run content:build` |
| 加新 locale | `lib/i18n/config.ts` + messages + 路由 | 完整重建 |
| 默认 locale | `lib/i18n/config.ts` | `cf:preview` 验证 |
| 标签显示名 | `content/taxonomy/tags.json` | `content:build` |
| Heti / Umami / GA 开关 | `.env.local` / CF 控制台 | 重建 |
| 默认 OG 图 | `lib/seo/` | 重建 |
| 主题色 | `app/globals.css` | `dev` 重启 |
