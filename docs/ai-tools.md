# AI Editorial Tools

English | [简体中文](./ai-tools.zh-CN.md)

`scripts/ai/*` is a set of advisory editorial CLIs. They read a content file, ask an LLM (Anthropic or an OpenAI-compatible endpoint) for review, and write a structured report under `reports/ai/`. They never write to the content itself.

## Design Intent

- **Advisory, not authoritative** — AI suggestions are reviewed by you and applied by hand.
- **Repo-local** — reports go to `reports/ai/`, gitignored by default unless you want them in git.
- **One concern per tool** — proofread, summarize, SEO, typography. No "do everything" mode.
- **Provider-agnostic** — works with Anthropic or any OpenAI-compatible API.

## Provider Setup

Set in `.env.local`:

```bash
# Anthropic
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_BASE_URL=https://api.anthropic.com    # optional, for proxies
ANTHROPIC_MODEL=claude-3-5-sonnet-latest        # optional

# OpenAI-compatible (incl. proxies)
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4.1-mini
OPENAI_BASE_URL=https://api.openai.com/v1       # change for proxies / Azure / etc.
```

Pick one provider per session. Switching providers = change `.env.local`.

## Tools

### `ai:proofread`

Spelling, grammar, punctuation, wording. Conservative — does not rewrite paragraphs.

```bash
npm run ai:proofread -- --file content/posts/my-post.md
```

System prompt summary: "Review content files for spelling, grammar, punctuation style, and wording clarity. Prefer concise, reviewable suggestions and do not rewrite entire articles."

Output: `reports/ai/proofread-<timestamp>.md` and `.json` (flat under `reports/ai/`).

### `ai:summarize`

Reviews or proposes concise summaries for frontmatter `summary` / `description`.

```bash
npm run ai:summarize -- --file content/posts/my-post.md
```

System prompt summary: "Keep suggestions factual, short, and faithful to the source content."

Output: `reports/ai/summarize-<timestamp>.md` and `.json`.

### `ai:seo-suggest`

Reviews `seoTitle` / `seoDescription` quality, proposes alternatives when present values are weak.

```bash
npm run ai:seo-suggest -- --file content/posts/my-post.md
```

System prompt summary: "Keep suggestions concrete and bounded."

Output: `reports/ai/seo-suggest-<timestamp>.md` and `.json`.

### `ai:typography-review`

Long-form review for mixed Chinese-English technical writing — paragraph flow, heading hierarchy, punctuation consistency, readability.

```bash
npm run ai:typography-review -- --file content/posts/my-post.md
```

System prompt summary: "Review long-form mixed Chinese-English technical writing for paragraph flow, heading hierarchy, punctuation consistency, and readability."

Output: `reports/ai/typography-review-<timestamp>.md` and `.json`.

### `ai` (shortcut)

`scripts/ai/index.ts` is a dispatcher. Default tool is `proofread`. Supports three input modes:

```bash
# 1. File or slug (resolved against content/posts/ and content/pages/)
npm run ai -- blog_v4.md
npm run ai -- about.en.mdx

# 2. Switch tool with --tool
npm run ai -- --tool summarize blog_v4.md
npm run ai -- --tool typography-review blog_v4.md

# 3. Batch by glob
npm run ai -- --glob "content/posts/*.md"

# 4. Operate on files changed in the current branch
npm run ai -- --changed-files

# Add --dry-run to skip writing a report (suggestions go to stdout only)
npm run ai -- --tool seo-suggest --dry-run blog_v4.md
```

`--tool` accepts `proofread` | `summarize` | `seo-suggest` | `typography-review`.

## Prompts

Each tool's full prompt lives in `prompts/`:

- `prompts/proofread.md`
- `prompts/summarize.md`
- `prompts/seo-suggest.md`
- `prompts/typography-review.md`

Edit these to tune behavior. The TypeScript wrapper in `scripts/ai/shared/tool-contexts.ts` references them by path.

## Architecture

```
scripts/ai/
├── index.ts                  shortcut dispatcher
├── proofread.ts              ┐
├── summarize.ts              ├ thin entry points
├── seo-suggest.ts            │  each calls runTool(ctx)
├── typography-review.ts      ┘
└── shared/
    ├── client.ts             provider client abstraction
    ├── file-resolver.ts      resolve --file argument
    ├── reporter.ts           write report file under reports/ai/
    ├── run-tool.ts           orchestrate read → prompt → write
    ├── schema-validator.ts   validate AI output shape
    ├── tool-contexts.ts      per-tool system prompts + prompt file
    └── types.ts              shared types
```

To add a new AI tool:

1. Add a `ToolContext` entry to `AI_TOOL_CONTEXTS` in `tool-contexts.ts`.
2. Write `prompts/<tool>.md`.
3. Create `scripts/ai/<tool>.ts` (copy `proofread.ts` and change the context key).
4. Add an `ai:<tool>` script to `package.json`.

## Cost Control

- Each run sends roughly the file content + the prompt. A 5000-word post against `claude-3-5-sonnet-latest` typically costs cents, not dollars — but multiply by the number of posts you batch.
- Set `ANTHROPIC_MODEL` / `OPENAI_MODEL` to a cheaper tier if you are batching.
- Each entry script (`ai:proofread` etc.) defaults to `--changed-files` mode if no target is passed. Use `--file` / `--glob` / a positional slug to target explicitly. Watch your billing when running `--changed-files` against a large diff.

## CI Integration

`ai-content-check.yml` GitHub Action — manual trigger only (`workflow_dispatch`). It runs the AI tools against changed content files and:

- writes a workflow summary to the run page
- uploads `reports/ai/` as a build artifact (`pull-requests: read` permission — does NOT comment on PRs)

It is NOT auto-triggered on PRs. The auto trigger was removed because contributors without `ANTHROPIC_API_KEY` configured saw repeated red marks. Run it from the **Actions** tab when you want it.

## Reports

`reports/ai/<tool>-<timestamp>.{json,md}` — flat layout under `reports/ai/`. Each run writes both a JSON report (raw) and a Markdown rendering. Contents:

- `tool` and `generatedAt` (timestamp)
- `mode` (`file` / `glob` / `changed-files`)
- `dryRun` flag
- `files` (the files inspected)
- `summary` (one-paragraph overview)
- `suggestions[]` — each with `title`, `file`, `severity`, optional `line`, `detail`

These reports are advisory. Read them, apply selectively, commit the content changes — not the reports — unless you have a reason to keep an audit trail.

## Limitations / Caveats

- LLM output is non-deterministic. Same input, different output across runs.
- The proofread tool will sometimes "correct" intentional stylistic choices. Read suggestions, don't blanket-apply.
- The typography-review tool optimizes for mainstream readability; it may push toward neutral prose at the expense of your voice. Use sparingly.
- Provider keys never go in the repo. Local `.env.local`, CI Secrets, or a personal `direnv` setup only.
