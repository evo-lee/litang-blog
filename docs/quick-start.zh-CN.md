# 快速开始

[English](./quick-start.md) | 简体中文

5 分钟跑起本地开发服务器。完整安装流程见 [安装与使用](./installation.zh-CN.md)。

## 前置条件

- Node.js `>=20`
- npm（随 Node 一起）
- Git

可选：
- Cloudflare Wrangler — 仅 `cf:preview` / `cf:deploy` 需要
- AI 提供商 API Key — 仅 `scripts/ai/*` 需要

## 五条命令

```bash
git clone https://github.com/evo-lee/litang-blog.git
cd litang-blog
npm install
cp .env.example .env.local      # 仅为模板 — 真实密钥写到 .env.local，禁止提交
npm run dev
```

浏览器打开 <http://localhost:3000>。

`npm run dev` 做了什么：

1. `npm run content:build` — 解析 `content/posts/**` 与 `content/pages/**`，用 Zod 校验 frontmatter，渲染 Markdown/MDX，写出：
   - `content/.generated/runtime-data.json`
   - `public/search-index.json`
2. `next dev --turbopack` — 启动 Next.js 开发服务器。

## 验证

| URL | 期望结果 |
|---|---|
| `/` | 首页（默认 `zh-CN`） |
| `/zh-CN` | 同样内容，带 locale 前缀 |
| `/en` | 有英文变体则取英文，否则回退中文 |
| `/posts` | 文章列表 |
| `/api/health` | `{"ok":true,"status":"healthy","version":...,"env":...,"timestamp":...}` |

## 下一步

- **写文章** — 在 `content/posts/` 放 Markdown 文件，重新执行 `npm run content:build`。详见 [内容管线](./content-pipeline.zh-CN.md)。
- **改站点标题或导航** — 编辑 `lib/site.ts` 和 `lib/i18n/messages.ts`。详见 [自定义](./customization.zh-CN.md)。
- **部署上线** — 把仓库接入 Cloudflare Workers Builds。详见 [部署](./deployment.zh-CN.md)。

## 故障排查

| 现象 | 可能原因 |
|---|---|
| `git pull` 后报 `Module not found` | `package-lock.json` 变了，重跑 `npm install` |
| 页面空白，控制台说 `runtime-data.json` 缺失 | 跑 `npm run content:build` |
| `EADDRINUSE :::3000` | 端口被占，关掉原 dev server，或 `PORT=3001 npm run dev` |
| Cloudflare 预览 `/en` 或 `/zh-CN/about` 报 500 | `next.config.ts` 又加了正则 rewrite。删掉 — 见 [架构](./architecture.zh-CN.md#locale-路由) |
