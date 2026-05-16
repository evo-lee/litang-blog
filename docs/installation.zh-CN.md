# 安装与使用

[English](./installation.md) | 简体中文

完整安装步骤。5 分钟快速版见 [快速开始](./quick-start.zh-CN.md)。

## 1. 系统要求

| 工具 | 版本 | 用途 |
|---|---|---|
| Node.js | `>=20` | Next.js 15 与 `node --import tsx` 跑 TS 脚本所需 |
| npm | 随 Node | 安装依赖、跑脚本 |
| Git | 任意较新版本 | clone、commit、push |
| Wrangler | 最新版（可选） | 本地 CF Worker 预览 / 手动部署 |

验证：

```bash
node --version    # v20.x 或以上
npm --version
```

生产构建时 `next/font` 可能需要外网访问拉取 Google 字体元数据。如果你在严格代理环境下构建卡住，这通常就是原因。

## 2. 克隆与安装

```bash
git clone https://github.com/evo-lee/litang-blog.git
cd litang-blog
npm install
```

`npm install` 会通过 `prepare` 脚本顺便装上 `husky` 提交钩子（`lint-staged` 对暂存文件跑 ESLint + Prettier）。

## 3. 环境变量

```bash
cp .env.example .env.local
```

- `.env.example` 是**模板**，禁止填真实密钥。
- `.env.local` 已 gitignore，本地真实密钥写这里。
- 生产密钥应在 **Cloudflare 控制台**配置，**不**应提交进仓库。

启动开发服务器**无需任何环境变量**。下表变量仅对应特定功能：

| 变量 | 用途 | 何时必填 |
|---|---|---|
| `NEXT_PUBLIC_ENABLE_HETI` | Heti 中文排版开关 | 默认 `true` |
| `NEXT_PUBLIC_ENABLE_UMAMI` | Umami 加载开关 | 启用时 `true` |
| `NEXT_PUBLIC_UMAMI_SCRIPT_URL` | Umami 脚本 URL | 启用 Umami |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | Umami 站点 ID | 启用 Umami |
| `NEXT_PUBLIC_ENABLE_GA` | GA4 加载开关 | 启用时 `true` |
| `NEXT_PUBLIC_GA_ID` | GA4 measurement ID `G-XXXX` | 启用 GA |
| `AI_PROVIDER` | `anthropic` 或 `openai` | 仅 `scripts/ai/*` 用 |
| `ANTHROPIC_API_KEY` | Anthropic key | `AI_PROVIDER=anthropic` 时 |
| `OPENAI_API_KEY` | OpenAI key | `AI_PROVIDER=openai` 时 |
| `OPENAI_BASE_URL` | OpenAI 兼容端点 | 可选（如代理） |
| `CLOUDFLARE_API_TOKEN` | Wrangler 鉴权 | 仅手动 `cf:deploy` |
| `CLOUDFLARE_ACCOUNT_ID` | Wrangler 账户 | 仅手动 `cf:deploy` |

带 `NEXT_PUBLIC_` 前缀的值会在构建时**内联到客户端 bundle**，视同公开数据。**任何敏感值不要加 `NEXT_PUBLIC_` 前缀**。

## 4. 命令参考

| 命令 | 作用 |
|---|---|
| `npm run dev` | `content:build` 然后 Turbopack 启 Next.js dev |
| `npm run content:build` | 重建 `runtime-data.json` 与 `search-index.json` |
| `npm run build` | `content:build` → `next build` → `ensure-next-export-errors` |
| `npm run start` | 启动生产 Next.js |
| `npm run lint` | ESLint |
| `npm run type-check` | `content:build` → `next typegen` → `tsc --noEmit` |
| `npm test` | `node --test` 跑 `tests/**/*.test.ts` |
| `npm run lint:content` | 校验内容 frontmatter |
| `npm run cf:build` | OpenNext 构建 CF 版本 |
| `npm run cf:preview` | 构建 + 本地 Worker 预览 `127.0.0.1:8787` |
| `npm run cf:deploy` | 构建 + 部署到 Cloudflare Workers |
| `npm run cf:versions:upload` | 构建 + 上传 Worker 版本但不发布 |
| `npm run ai:proofread -- --file content/posts/my-post.md` | AI 校对 |
| `npm run ai:summarize` | AI 摘要 |
| `npm run ai:seo-suggest` | AI SEO 建议 |
| `npm run ai:typography-review` | 中文排版审阅 |
| `npx prettier --write .` | 全仓格式化 |

## 5. 标准校验组合

提交代码改动前：

```bash
npm run lint && npm run type-check && npm run build
```

涉及路由、locale、OpenNext、Cloudflare 配置、Worker 行为时，额外跑：

```bash
npm run cf:preview
```

然后访问 `/`、`/zh-CN`、`/en`、`/zh-CN/about`、`/en/about` 确认无 500。

## 6. 项目结构

```
app/
  (site)/          无前缀路由 — 默认 zh-CN
  [locale]/        /en /zh-CN 路由 — 包装 (site) 页面
  api/health/      健康检查
  image/[variant]/[token]/   CF 风格图片路由
  rss.xml/         RSS 源
  robots.ts        robots.txt
  sitemap.ts       sitemap.xml
components/        文章、外壳、搜索、SEO、分析组件
content/
  posts/           Markdown/MDX 文章源
  pages/           页面源（about 等）
  taxonomy/        标签元数据
  .generated/      生成产物（请勿手改）
lib/
  content/         加载器、运行时访问、frontmatter schema
  i18n/            locale 配置、消息、路由助手
  seo/             metadata、OG、JSON-LD
  cloudflare/      图片变体与 loader
  search/          客户端搜索类型与索引加载
  analytics/       分析提供商与派发
  typography/      Heti 集成
scripts/
  content/         build-runtime-data、build-search-index
  ci/              CI 守卫与内容 lint
  ai/              AI 辅助工具（仅建议性）
config/            运维与排版说明
reports/           AI 报告输出占位
tests/             回归测试
```

## 7. 初次常见问题

| 现象 | 解决 |
|---|---|
| 运行脚本报 `tsx: not found` | 重跑 `npm install`（`tsx` 是 devDep） |
| `next/font` 构建卡住 | 检查外网，放通 `fonts.googleapis.com` |
| Husky pre-commit 报错 | 看 ESLint 输出修复；紧急情况可 `--no-verify`（之后补修） |
| `runtime-data.json` JSON 损坏 | 某篇内容 frontmatter 有问题，重跑 `npm run content:build` 看报错 |
| 报 `Cannot find module '@/...'` | TS 路径别名问题 — 查 `tsconfig.json` `paths`，重跑 `npm run type-check` |
