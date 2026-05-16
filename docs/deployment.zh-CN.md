# 部署运维

[English](./deployment.md) | 简体中文

生产环境跑在 Cloudflare Workers，通过 OpenNext 适配。当前架构在每次推送 `main` 时**并行触发**两条自动化轨道 — 而且**两者不是冗余备份**。

## 两条并行轨道

| 系统 | 角色 | 触发 | 失败影响 |
|---|---|---|---|
| **GitHub Actions `ci.yml`** | 质量门禁 — lint / type-check / test / build / cf:build | 每次 push 与 PR | 仅红叉，**不**阻塞部署 |
| **Cloudflare Workers Builds** | 真正的生产构建 + 部署 | 每次 push（控制台 Git 集成） | 站点不更新 |

两者读同一 commit，但需要**独立配置环境变量**。CI 红叉不代表部署失败，CI 绿勾也不代表部署成功。

## 环境变量工作流

三个位置，互不感知。

### 1. 本地 `.env.local`

`npm run dev` 与本地 `cf:preview` 使用。

```bash
cp .env.example .env.local
# 填真实值
```

- `.env.example` — 模板，进仓库，仅占位符。
- `.env.local` — 真实值，gitignored。

如果你曾把真实值提交到 `.env.example`，**先去各服务控制台吊销那些凭证**。它们已经在 git 历史里。

### 2. GitHub 仓库 → Settings → Secrets and variables → Actions

CI（`ci.yml`、`ai-content-check.yml`）使用。

- **Variables**（非敏感，日志可见）：
  - `NEXT_PUBLIC_UMAMI_SCRIPT_URL`
  - `NEXT_PUBLIC_UMAMI_WEBSITE_ID`
  - `NEXT_PUBLIC_GA_ID`
- **Secrets**（脱敏，日志不可见）：
  - `ANTHROPIC_API_KEY` — 仅手动跑 `ai-content-check.yml` 时需要

### 3. Cloudflare Workers 项目 → Settings → Variables and Secrets

真正的生产构建与运行时使用。

- 同样的 `NEXT_PUBLIC_*` 变量在这里**再配置一次**。CF Workers Builds **不会**读 GitHub Variables。
- 服务端密钥（如有）以 Secrets 形式配置，不要用 Variables。

## 首次部署步骤

### 步骤 1：吊销已泄漏凭证

如果 `.env.example` 曾经写过真实值，视同已泄露：

- Cloudflare API token → CF 控制台 → My Profile → API Tokens → 吊销
- OpenAI key → platform.openai.com → API keys → 吊销
- 其他已提交的密钥 → 在源头吊销

### 步骤 2：本地校验

```bash
npm install
npm run lint && npm run type-check && npm run test && npm run build
npm run cf:preview   # Worker 预览在 127.0.0.1:8787
```

访问 `/`、`/zh-CN`、`/en`、`/zh-CN/about`、`/en/about`、`/api/health`。全部应返回 200。

### 步骤 3：配置 GitHub Variables / Secrets

按上面表格在 GitHub 仓库设置里加好。

### 步骤 4：接入 Cloudflare Workers Builds

1. Cloudflare 控制台 → **Workers & Pages** → **Create** → **Import a repository**。
2. 选 GitHub 仓库 → `main` 分支。
3. Build command：`npm run cf:build`
4. Deploy command：`npx opennextjs-cloudflare deploy`
5. **Build variables** 处加上 `NEXT_PUBLIC_*`。

### 步骤 5：触发首次部署

推任意 commit，或控制台点 **Retry build**。

### 步骤 6：验证

```bash
curl https://<your-worker>.workers.dev/api/health
# {"ok":true,"status":"healthy","version":"0.1.0","env":"production","timestamp":"..."}
```

随后验证 locale 路由。

### 步骤 7：自定义域名

CF 控制台 → Worker 项目 → Triggers / Custom Domains → 添加域名。DNS 在 Cloudflare 时 TLS 证书会自动签发。

## 手动部署（兜底）

CF Git 集成不可用，或需要带外推送时：

```bash
wrangler login        # 一次性
npm run cf:deploy
```

本地构建后推送 Worker 版本。**不会**更新 Git 集成的状态。

## GitHub Actions 工作流

### `ci.yml` — 自动

每次 push 和 PR 触发。步骤（`.github/workflows/ci.yml`）：

1. Checkout
2. Setup Node 20 + npm 缓存
3. `npm ci`
4. `npm run lint:content`（frontmatter / 内容 schema 校验）
5. `npm run lint`（源代码 ESLint）
6. `npm run test`
7. `npm run type-check`
8. `npm run build`
9. `node --import tsx scripts/ci/build-report.ts`（生成 `reports/build/`）
10. `actions/upload-artifact@v4` 上传 `reports/build/` 为 `build-report` artifact（`if: always()`）
11. `npm run cf:build`（验证 Worker bundle）

它**不**部署。部署由 Cloudflare Workers Builds 负责。

### `ai-content-check.yml` — 仅手动

`workflow_dispatch` 触发。从 **Actions** 标签 → AI Content Check → **Run workflow**。需要在仓库 Secrets 配置 `ANTHROPIC_API_KEY`。之前是 PR 自动触发，因没配 key 总报红，已改为手动。

## 回滚

CF 控制台 → Worker 项目 → **Deployments** → 选历史版本 → **Rollback**。

不影响 git 历史。如果要在代码层面也回滚：

```bash
git revert <bad-commit>
git push origin main
```

下次 CF Workers Builds 跑会部署 revert 后的代码。

## 常见故障

| 现象 | 原因 | 解决 |
|---|---|---|
| CI 构建产物缺 Umami / GA 脚本 | GitHub Variables 没配 `NEXT_PUBLIC_*` | 仓库 Settings 加上（CI 不报错，但 script 标签缺失） |
| 部署成功但分析脚本没加载 | CF 项目缺 `NEXT_PUBLIC_*` 或开关未开 | Workers Settings 加 `NEXT_PUBLIC_ENABLE_UMAMI=true` / `NEXT_PUBLIC_ENABLE_GA=true` 与对应 ID 变量 |
| CF 上 `/zh-CN/about` 返回 500 | 又加了正则 rewrite | 查 `next.config.ts` 删掉。见 [架构 > Locale 路由](./architecture.zh-CN.md#locale-路由) |
| `ai-content-check` 一直失败 | 旧工作流自动触发但缺 API key | 拉最新 — 已改为仅手动 |
| Push 成功但站点不更新 | CF Git 集成未连接，或分支错 | 首次部署步骤 4 |
| Worker 超 1MB 或 CPU 超限 | OpenNext 产物太大或热路径慢 | 分析构建输出；裁依赖；考虑静态导出重型页面 |
| Worker 预览正常但生产是旧的 | CF 缓存 | 控制台 Purge cache，或加 query string 测试 |
| CF 构建报 `next/font` 失败 | 构建机访问不了 Google 字体 | 安装期预拉字体，或自托管字体 |

## 发布前校验清单

```bash
# 本地
npm run lint
npm run type-check
npm run test
npm run build
npm run cf:preview

# 手动访问页面
# /
# /zh-CN
# /en
# /zh-CN/about
# /en/about
# /posts
# /api/health
# RSS、sitemap、robots
# /rss.xml
# /sitemap.xml
# /robots.txt
```

推送后：到 **Workers & Pages → 你的项目 → Deployments** 看构建日志。

## 下线

不删仓库但停部署：

1. CF 控制台 → Worker 项目 → **Settings → Build** → 断开 Git 集成。已有 Worker 继续在线。
2. 完全退役：CF 控制台删 Worker，再解绑自定义域名。

不要先删 GitHub 仓库；CF 集成一段时间内不会感知，会继续指向陈旧 commit。
