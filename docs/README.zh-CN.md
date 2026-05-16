# litang-blog 项目文档

[English](./README.md) | 简体中文

`litang-blog` 站点的 Wiki 风格文档，随代码版本控制，GitHub 与本地均可渲染。

## 目录

| 主题 | 何时阅读 |
|---|---|
| [快速开始](./quick-start.zh-CN.md) | 第一次克隆 — 5 分钟内跑起开发服务器 |
| [安装与使用](./installation.zh-CN.md) | 详细安装：Node、依赖、内容构建、环境变量 |
| [架构](./architecture.zh-CN.md) | 渲染模型、locale 路由、Worker 运行时如何协同 |
| [内容管线](./content-pipeline.zh-CN.md) | Markdown/MDX 撰写、frontmatter 字段、生成产物 |
| [自定义](./customization.zh-CN.md) | 修改站点标题、导航、文案、默认语言、功能开关 |
| [部署运维](./deployment.zh-CN.md) | Cloudflare Workers Builds、GitHub Actions、环境变量、回滚 |
| [AI 编辑工具](./ai-tools.zh-CN.md) | `scripts/ai/*` 的校对、摘要、SEO、排版建议 |

## 推荐阅读顺序

- **首次使用** — 快速开始 → 安装 → 自定义
- **代码贡献者** — 架构 → 内容管线 → 部署
- **写作 / 编辑流程** — 内容管线 → AI 编辑工具
- **运维 / 上线** — 部署 → 自定义（环境变量、功能开关）

## 约定

- 文件路径相对仓库根目录（例如 `lib/site.ts`）。
- 命令默认在仓库根目录执行，特殊情况会注明。
- 双语文件后缀为 `.en.mdx` / `.zh-CN.md`。默认语言 `zh-CN`，英文缺失时回退到中文。
- 生产部署走 Cloudflare Workers Builds（Git 集成），**不是** GitHub Actions。CI 只是质量门禁，不负责部署。

## 不在本文档范围

这些文档描述已落地的实现。架构演进、设计思考请看 `content/posts/blog_v4.md`（架构长文）和 `AGENTS.md` / `CLAUDE.md`（Agent 工作规则）。
