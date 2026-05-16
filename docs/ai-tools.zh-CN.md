# AI 编辑工具

[English](./ai-tools.md) | 简体中文

`scripts/ai/*` 是一组**建议性**编辑 CLI。读取一份内容文件，请 LLM（Anthropic 或 OpenAI 兼容端点）审阅，把结构化报告写入 `reports/ai/`。**绝不**会改动内容本身。

## 设计意图

- **建议性，不权威** — AI 建议由你审，由手工应用。
- **仓库本地** — 报告写到 `reports/ai/`，默认 gitignored，要进 git 时自己改。
- **每个工具一个职责** — proofread、summarize、SEO、typography。没有"全包"模式。
- **provider 无关** — Anthropic 或任何 OpenAI 兼容 API 均可。

## Provider 配置

写在 `.env.local`：

```bash
# Anthropic
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_BASE_URL=https://api.anthropic.com    # 可选，走代理时
ANTHROPIC_MODEL=claude-3-5-sonnet-latest        # 可选

# OpenAI 兼容（含代理）
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4.1-mini
OPENAI_BASE_URL=https://api.openai.com/v1       # 改成代理 / Azure 等
```

一次只选一个 provider。切换 = 改 `.env.local`。

## 工具

### `ai:proofread`

拼写、语法、标点、用词。保守，不会重写整段。

```bash
npm run ai:proofread -- --file content/posts/my-post.md
```

System prompt 概要："Review content files for spelling, grammar, punctuation style, and wording clarity. Prefer concise, reviewable suggestions and do not rewrite entire articles."

输出：`reports/ai/proofread-<timestamp>.md` 与 `.json`（`reports/ai/` 下扁平）。

### `ai:summarize`

审阅或提议 frontmatter `summary` / `description` 的简短摘要。

```bash
npm run ai:summarize -- --file content/posts/my-post.md
```

System prompt 概要："Keep suggestions factual, short, and faithful to the source content."

输出：`reports/ai/summarize-<timestamp>.md` 与 `.json`。

### `ai:seo-suggest`

审阅 `seoTitle` / `seoDescription` 质量，原值偏弱时给出替代方案。

```bash
npm run ai:seo-suggest -- --file content/posts/my-post.md
```

System prompt 概要："Keep suggestions concrete and bounded."

输出：`reports/ai/seo-suggest-<timestamp>.md` 与 `.json`。

### `ai:typography-review`

长文中英混排的审阅 — 段落节奏、标题层级、标点一致性、可读性。

```bash
npm run ai:typography-review -- --file content/posts/my-post.md
```

System prompt 概要："Review long-form mixed Chinese-English technical writing for paragraph flow, heading hierarchy, punctuation consistency, and readability."

输出：`reports/ai/typography-review-<timestamp>.md` 与 `.json`。

### `ai`（快捷入口）

`scripts/ai/index.ts` 是调度器。默认工具 `proofread`。支持三种输入模式：

```bash
# 1. 文件或 slug（解析到 content/posts/ 与 content/pages/）
npm run ai -- blog_v4.md
npm run ai -- about.en.mdx

# 2. --tool 切换工具
npm run ai -- --tool summarize blog_v4.md
npm run ai -- --tool typography-review blog_v4.md

# 3. --glob 批量
npm run ai -- --glob "content/posts/*.md"

# 4. --changed-files 跑当前分支变更
npm run ai -- --changed-files

# 加 --dry-run 跳过写报告，建议仅打 stdout
npm run ai -- --tool seo-suggest --dry-run blog_v4.md
```

`--tool` 取值：`proofread` | `summarize` | `seo-suggest` | `typography-review`。

## Prompts

每个工具的完整 prompt 在 `prompts/`：

- `prompts/proofread.md`
- `prompts/summarize.md`
- `prompts/seo-suggest.md`
- `prompts/typography-review.md`

改这些文件来调行为。`scripts/ai/shared/tool-contexts.ts` 中的 TS 包装按路径引用它们。

## 架构

```
scripts/ai/
├── index.ts                  快捷调度器
├── proofread.ts              ┐
├── summarize.ts              ├ 薄入口
├── seo-suggest.ts            │  每个调用 runTool(ctx)
├── typography-review.ts      ┘
└── shared/
    ├── client.ts             provider 客户端抽象
    ├── file-resolver.ts      解析 --file 参数
    ├── reporter.ts           写报告到 reports/ai/
    ├── run-tool.ts           编排 读取 → prompt → 写
    ├── schema-validator.ts   校验 AI 输出形状
    ├── tool-contexts.ts      各工具的 system prompt + prompt 文件
    └── types.ts              共享类型
```

加新 AI 工具：

1. 在 `tool-contexts.ts` 的 `AI_TOOL_CONTEXTS` 加一条 `ToolContext`。
2. 写 `prompts/<tool>.md`。
3. 建 `scripts/ai/<tool>.ts`（复制 `proofread.ts`，改 context key）。
4. 在 `package.json` 加 `ai:<tool>` 脚本。

## 成本控制

- 每次请求大致传"文件内容 + prompt"。5000 字的中文文章对 `claude-3-5-sonnet-latest` 一般花几美分 — 但批量乘 N 篇要算账。
- 批量时把 `ANTHROPIC_MODEL` / `OPENAI_MODEL` 切到便宜档。
- 各入口脚本（`ai:proofread` 等）不传目标时默认走 `--changed-files`。明确目标用 `--file` / `--glob` / 位置参数 slug。大 diff 上跑 `--changed-files` 注意账单。

## CI 集成

`ai-content-check.yml` GitHub Action — **仅手动触发**（`workflow_dispatch`）。对改动的内容文件跑 AI 工具，然后：

- 写 workflow summary 到运行页面
- 上传 `reports/ai/` 为构建 artifact（权限 `pull-requests: read`，**不会**在 PR 评论）

**不会**在 PR 自动跑。曾经自动触发，但没配 `ANTHROPIC_API_KEY` 的贡献者总看到红叉，遂改为手动。需要时去 **Actions** 标签触发。

## 报告

`reports/ai/<tool>-<timestamp>.{json,md}` — `reports/ai/` 下扁平。每次跑同时写 JSON（原始）与 Markdown（渲染）。内容：

- `tool` 与 `generatedAt`（时间戳）
- `mode`（`file` / `glob` / `changed-files`）
- `dryRun` 标志
- `files`（被审阅文件）
- `summary`（一段总览）
- `suggestions[]` — 每项含 `title`、`file`、`severity`、可选 `line`、`detail`

报告是建议。读、选择性应用、提交内容改动（**不**提交报告，除非要留审计痕迹）。

## 限制 / 注意

- LLM 输出非确定性。同一输入多次跑结果可能不同。
- proofread 偶尔会"纠正"你刻意的风格选择。看了再改，别全盘照单。
- typography-review 偏向主流可读性，可能向"中性散文"靠拢，磨掉你的风格。少用。
- Provider key 永远不进仓库。仅 `.env.local`、CI Secrets、或个人 `direnv` 配置。
