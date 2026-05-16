# Deployment

English | [简体中文](./deployment.zh-CN.md)

Production runs on Cloudflare Workers via OpenNext. The current setup has two parallel automated tracks on every push to `main` — and they are NOT redundant.

## Two Parallel Tracks

| System | Role | Trigger | Failure impact |
|---|---|---|---|
| **GitHub Actions `ci.yml`** | Quality gate — lint / type-check / test / build / cf:build | Every push and PR | Red mark only. Does NOT block deploy. |
| **Cloudflare Workers Builds** | Actual production build + deploy | Every push (dashboard Git integration) | Site not updated. |

Both read the same commit but require **separate environment variable configuration**. A failing CI run does not mean the deploy failed; a successful CI run does not mean the deploy succeeded.

## Env Variable Workflow

Three locations. None of them know about the others.

### 1. Local `.env.local`

For `npm run dev` and local `cf:preview`.

```bash
cp .env.example .env.local
# edit with real values
```

- `.env.example` — template, committed, placeholders only.
- `.env.local` — real values, gitignored.

If you committed real values into `.env.example`, **revoke those credentials immediately** in their dashboards before anything else. They are in git history.

### 2. GitHub repo → Settings → Secrets and variables → Actions

For CI (`ci.yml`, `ai-content-check.yml`).

- **Variables** (non-sensitive, visible in logs):
  - `NEXT_PUBLIC_UMAMI_SCRIPT_URL`
  - `NEXT_PUBLIC_UMAMI_WEBSITE_ID`
  - `NEXT_PUBLIC_GA_ID`
- **Secrets** (masked, never in logs):
  - `ANTHROPIC_API_KEY` — only when manually running `ai-content-check.yml`

### 3. Cloudflare Workers project → Settings → Variables and Secrets

For the actual production build and runtime.

- Same `NEXT_PUBLIC_*` variables must be set **again** here. CF Workers Builds does not read GitHub Variables.
- Server-only secrets (if you add any) go here as Secrets, not Variables.

## First-Time Deployment

### Step 1: Revoke any leaked credentials

If `.env.example` ever held real values, treat them as compromised:

- Cloudflare API token → CF dashboard → My Profile → API Tokens → revoke
- OpenAI key → platform.openai.com → API keys → revoke
- Anything else committed → revoke at the source

### Step 2: Local validation

```bash
npm install
npm run lint && npm run type-check && npm run test && npm run build
npm run cf:preview   # Worker preview at 127.0.0.1:8787
```

Hit `/`, `/zh-CN`, `/en`, `/zh-CN/about`, `/en/about`, `/api/health`. All should return 200.

### Step 3: Configure GitHub Variables / Secrets

In the GitHub repo settings, add the variables listed above.

### Step 4: Connect Cloudflare Workers Builds

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Import a repository**.
2. Pick the GitHub repo → `main` branch.
3. Build command: `npm run cf:build`
4. Deploy command: `npx opennextjs-cloudflare deploy`
5. Add `NEXT_PUBLIC_*` under **Build variables**.

### Step 5: Trigger the first deploy

Push any commit, or **Retry build** from the dashboard.

### Step 6: Verify

```bash
curl https://<your-worker>.workers.dev/api/health
# {"ok":true,"status":"healthy","version":"0.1.0","env":"production","timestamp":"..."}
```

Then verify the locale routes.

### Step 7: Custom domain

CF dashboard → Workers project → Triggers / Custom Domains → add your domain. Cloudflare provisions the TLS cert automatically when DNS is on Cloudflare.

## Manual Deployment (Fallback)

When CF Git integration is unavailable or you need an out-of-band push:

```bash
wrangler login        # one-time
npm run cf:deploy
```

This builds locally and pushes the Worker version. It does NOT update the Git integration's state.

## GitHub Actions Workflows

### `ci.yml` — automatic

Runs on every push and PR. Steps (in `.github/workflows/ci.yml`):

1. Checkout
2. Setup Node 20 + npm cache
3. `npm ci`
4. `npm run lint:content` (frontmatter / content schema check)
5. `npm run lint` (ESLint on source)
6. `npm run test`
7. `npm run type-check`
8. `npm run build`
9. `node --import tsx scripts/ci/build-report.ts` (generates `reports/build/`)
10. `actions/upload-artifact@v4` uploads `reports/build/` as the `build-report` artifact (runs `if: always()`)
11. `npm run cf:build` (sanity-check the Worker bundle)

It does **not** deploy. Cloudflare Workers Builds does that.

### `ai-content-check.yml` — manual only

`workflow_dispatch` trigger. Run from the **Actions** tab → AI Content Check → **Run workflow**. Requires `ANTHROPIC_API_KEY` in repo Secrets. This was previously auto-triggered on PR; the auto trigger was removed to stop CI red marks when no key is configured.

## Rollback

CF dashboard → Workers project → **Deployments** → previous version → **Rollback**.

The git history is not affected. To roll back in code as well:

```bash
git revert <bad-commit>
git push origin main
```

The next CF Workers Builds run will deploy the reverted code.

## Common Failure Modes

| Symptom | Cause | Fix |
|---|---|---|
| Built bundle missing Umami / GA scripts after CI | GitHub Variables for `NEXT_PUBLIC_*` not set | Add them under repo Settings (CI won't fail, but the script tags are absent) |
| Deploy succeeds but analytics scripts don't load | CF project missing `NEXT_PUBLIC_*` or enable flags off | Add `NEXT_PUBLIC_ENABLE_UMAMI=true` / `NEXT_PUBLIC_ENABLE_GA=true` plus the ID variables under Workers Settings |
| `/zh-CN/about` returns 500 in CF | A regex rewrite was reintroduced | Inspect `next.config.ts`; remove it. See [Architecture > Locale Routing](./architecture.md#locale-routing) |
| `ai-content-check` action keeps failing | Outdated workflow with auto-trigger and missing API key | Pull latest — workflow is now manual-only |
| Push succeeds but site does not update | CF Git integration not connected, or wrong branch | First-time deployment step 4 |
| Worker exceeds 1MB / hits CPU limits | OpenNext bundle too large or hot path too slow | Profile the build output; reduce dependencies; consider static export for heavy pages |
| Worker preview shows correct content but production is stale | CF cache | Purge cache in CF dashboard, or change a query string for testing |
| `next/font` fails in CF build | Build server can't reach Google fonts | Pre-fetch fonts at install time, or self-host fonts |

## Verification Checklist (Pre-Release)

```bash
# Local
npm run lint
npm run type-check
npm run test
npm run build
npm run cf:preview

# Pages to manually visit
# /
# /zh-CN
# /en
# /zh-CN/about
# /en/about
# /posts
# /api/health
# RSS, sitemap, robots
# /rss.xml
# /sitemap.xml
# /robots.txt
```

After push: watch the **Workers & Pages → your-project → Deployments** tab for the build log.

## Decommissioning

To stop deploys without deleting the repo:

1. CF dashboard → Workers project → **Settings → Build** → disconnect Git integration. Existing Worker stays live.
2. To fully retire: delete the Worker in CF dashboard, then unbind the custom domain.

Do not delete the GitHub repo first; the CF integration won't notice for a while and will keep pointing at a stale commit.
