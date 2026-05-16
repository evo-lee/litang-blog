# 内容管线

[English](./content-pipeline.md) | 简体中文

Markdown / MDX 从磁盘文件到渲染页面的完整路径。

## 源文件

```
content/
├── posts/         *.md 或 *.mdx — 文章
├── pages/         *.mdx — 长内容页（about 等）
└── taxonomy/
    └── tags.json  标签显示名
```

### Locale 变体

无 locale 后缀的文件默认为 `zh-CN`。文件名扩展前加 `.en` 即英文变体：

```
content/pages/about.mdx          → zh-CN
content/pages/about.en.mdx       → en
content/posts/blog_v4.md         → zh-CN
content/posts/blog_v4.en.md      → en（存在的话）
```

请求 `/en/about` 时优先找 `about.en.mdx`，不存在则回退 `about.mdx`。回退是有意为之 — 翻译滞后不会拖垮站点。

## 文章 frontmatter Schema

定义在 `lib/content/frontmatter.ts`，用 Zod。不确定时直接读源文件。

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `title` | string | 是 | 长度 ≥ 1 |
| `description` | string | 是 | 长度 ≥ 1；列表 / OG 用 |
| `date` | 可转日期字符串 | 是 | `z.coerce.date()` — 建议 `YYYY-MM-DD`；任何 `new Date()` 能解析的字符串均可 |
| `updated` | 可转日期字符串 | 否 | 同 `date` |
| `tags` | string[] | 否 | 默认 `[]` |
| `category` | string | 否 | 主分类 |
| `draft` | boolean | 否 | 默认 `false`；草稿不入列表 |
| `featured` | boolean | 否 | 默认 `false`；可置顶首页 |
| `author` | string | 否 | 覆盖站点作者 |
| `canonical` | URL string | 否 | 跨站规范地址 |
| `summary` | string | 否 | 人工摘要，RSS / OG 用 |
| `seoTitle` | string | 否 | 覆盖 `<title>` |
| `seoDescription` | string | 否 | 覆盖 meta description |
| `cover` | string | 否 | 封面图路径或 token |
| `coverAlt` | string | 否 | 封面 alt |
| `thumbnail` | string | 否 | 列表缩略图 |
| `thumbnailAlt` | string | 否 | 缩略图 alt |
| `imageCredit` | string | 否 | 图片来源说明 |
| `ogImage` | string | 否 | 显式 OG 图 |

### 示例

```yaml
---
title: 我的笔记
description: 一篇关于构建管线的短笔记。
date: 2026-04-12
updated: 2026-04-15
tags: [build, cloudflare]
category: engineering
draft: false
featured: false
cover: /images/build.png
coverAlt: 构建管线示意图
seoTitle: 走进构建管线
---

来自内容管线的问候。
```

### 页面 Schema

页面（`content/pages/*`）用更小的 schema：`title`（必填）、`description`（必填）、`draft`（默认 `false`）、`updated`（可选，可转日期）。正文即页面内容。

## 生成产物

`npm run content:build` 产出：

### `content/.generated/runtime-data.json`

结构（简化）：

```ts
{
  generatedAt: string;            // ISO 时间戳
  posts: PostListEntry[];         // 列表用轻量项
  postMap: { [slug:locale]: FullPost };   // 详情页用完整内容
  pages: PageVariant[];
}
```

通过 `lib/content/runtime.ts` 读取：

```ts
import { getRuntimePosts, getRuntimePostBySlug } from '@/lib/content/runtime';

const zhPosts = getRuntimePosts('zh-CN');
const enPosts = getRuntimePosts('en');
const post = getRuntimePostBySlug('blog_v4', 'zh-CN');
```

**禁止**手改 `runtime-data.json` — 每次构建都会重写。

### `public/search-index.json`

预先构建的 Fuse.js 语料。客户端首次搜索交互时懒加载：

```ts
import { searchDocuments } from '@/lib/search/client';
const results = await searchDocuments('cloudflare');
```

## 渲染流程（`build-runtime-data.ts` 内部）

1. `glob` 扫描 `content/posts/**` 与 `content/pages/**`。
2. 从文件名后缀检测 locale（`.en.md` → `en`，否则默认）。
3. `gray-matter` 解析 frontmatter。
4. Zod schema 校验 frontmatter。校验失败 → 构建中断，错误包含文件路径。
5. `remark` + 插件把 Markdown 渲染成 HTML：
   - `remark-gfm` 表格、删除线、任务列表
   - `rehype-slug` 标题 id
   - `rehype-autolink-headings` 锚点链接
   - `rehype-pretty-code` + `shiki` 代码高亮
6. 派生摘要；解析封面（显式 > 正文首图 > 默认）。
7. 结果按 `slug:locale` 合并入快照。

MDX 文件走同一条构建期 `unified` 管线（`remark-parse` + `remark-mdx` + `remark-rehype`）。MDX 语法可被解析，但 **MDX 正文不支持 JSX 组件** — 无客户端 MDX runtime。需要组件嵌入时请改 `lib/content/processor.ts` 加自定义 transformer。

## 写作流程

加一篇文章：

```bash
# 1. 建文件
cat > content/posts/2026-05-15-my-note.md <<'EOF'
---
title: 我的笔记
description: 一段短笔记。
date: 2026-05-15
tags: [notes]
---

来自内容管线的问候。
EOF

# 2. 重建
npm run content:build

# 3. /posts 看是否出现，/posts/2026-05-15-my-note 阅读
npm run dev
```

加英文变体：

```bash
cp content/posts/2026-05-15-my-note.md content/posts/2026-05-15-my-note.en.md
# 编辑英文版
npm run content:build
```

改标签显示名：编辑 `content/taxonomy/tags.json`，重建。

## 草稿

frontmatter 设 `draft: true`。该文章会被过滤出运行时快照，所以从以下消失：

- 列表（`/posts`、首页）
- 文章详情路由
- RSS / sitemap
- 搜索索引

`lib/content/posts.ts` 只在 `content:build` 跑时 `NODE_ENV === 'development'` 才保留草稿。默认的 `npm run content:build` **不会**设 `NODE_ENV`，所以 dev 下草稿也被过滤。本地预览草稿：

```bash
NODE_ENV=development npm run content:build
next dev --turbopack    # 跳过会重跑 content:build 的 wrapper
```

## 内容 Lint

```bash
npm run lint:content
```

执行 `scripts/ci/lint-content.ts`，在进入构建前截获 frontmatter 错误。

## 图片处理

图片可以：

- 仓库本地（`public/images/...`）— 用相对路径引用
- 走 `app/image/[variant]/[token]/route.ts` — 提供尺寸变体

封面解析顺序见 [架构 > 图片分发](./architecture.zh-CN.md#图片分发)。

## 常见错误

| 错误 | 现象 | 解决 |
|---|---|---|
| YAML 末尾有多余空格 | 构建报晦涩的 parser 错 | 确保 frontmatter 单独一行 `---` 结束 |
| 日期格式非常规 | schema 走 `new Date(...)` 强转，可能解析出意料外的值 | 坚持 ISO `2026-05-15`，行为可预期 |
| `tags: notes`（字符串） | Zod 要数组 | `tags: [notes]` |
| 英文变体命名 `my-post-en.md` | loader 无法识别 locale | 用扩展名前的 `.en`：`my-post.en.md` |
| 编辑后忘了 `npm run content:build` | dev 看不到新内容 | 重新构建；`dev` 启动时会自动跑 |
| 手改了 `runtime-data.json` | 下次构建丢失改动 | 改源文件，永远别改生成文件 |
