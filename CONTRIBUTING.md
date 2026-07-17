# Contributing Guide — crm-portal

How we branch, commit, open PRs, and ship. Read this before your first PR.

This is a **pnpm + Turborepo monorepo**. The deployed app is `apps/web`
(Next.js 15 + Supabase). Merging code also drives **database migrations**
automatically via GitHub Actions — so read the [Database changes](#4-database-changes)
and [How code ships](#6-how-code-ships-cicd) sections carefully.

---

## Table of contents
1. [The branching model](#1-the-branching-model)
2. [One-time local setup](#2-one-time-local-setup)
3. [Day-to-day: branch, commit, push](#3-day-to-day-branch-commit-push)
4. [Database changes (migrations)](#4-database-changes-migrations)
5. [Opening a pull request](#5-opening-a-pull-request)
6. [How code ships (CI/CD)](#6-how-code-ships-cicd)
7. [Promoting to production](#7-promoting-to-production)
8. [Golden rules & gotchas](#8-golden-rules--gotchas)

---

## 1. The branching model

We use two long-lived branches and short-lived work branches:

```
feature/*  ──PR──▶  dev-staging  ──PR──▶  main
 (your work)        (integration)         (production)
```

| Branch | Purpose | Who merges |
|--------|---------|------------|
| `feature/*`, `fix/*`, `chore/*`, `ci/*` | Your work. Short-lived, one per task. | You (via PR) |
| `dev-staging` | Integration branch. Merging here **applies DB migrations to the staging database automatically.** | Reviewer approves your PR |
| `main` | Production. Merging here runs **prod migrations (with approval) then deploys the web app to Railway.** | Team lead promotes |

**Always branch off `dev-staging`, and open your PR back into `dev-staging`.**
Never push directly to `dev-staging` or `main`.

---

## 2. One-time local setup

```bash
# 1. Clone and install
git clone https://github.com/Autonex009/crm-portal.git
cd crm-portal
pnpm install          # Node >= 22, pnpm >= 10 required

# 2. Get the env file
# Ask a teammate for `.env.local` (it is gitignored — never commit it).
# Place it at the repo root.

# 3. Run the app
pnpm dev              # all apps, web at http://localhost:3000
# or just the web app:
pnpm --filter @crm/web dev
```

Handy scripts (run from repo root):

| Command | What it does |
|---------|--------------|
| `pnpm dev` | Run all apps in parallel |
| `pnpm build` | Build everything |
| `pnpm typecheck` | Type-check all packages |
| `pnpm lint` | Lint all packages |

---

## 3. Day-to-day: branch, commit, push

```bash
# Start from an up-to-date dev-staging
git checkout dev-staging
git pull origin dev-staging

# Create your work branch
git checkout -b feature/short-description

# ...make changes...

# Stage and commit (see commit conventions below)
git add <files>          # add specific files, not `git add .` blindly
git commit -m "feat: add contact bulk-import"

# Push and set upstream
git push -u origin feature/short-description
```

### Branch naming
`feature/…` new work · `fix/…` bug fix · `chore/…` tooling/deps · `ci/…` pipeline changes.
Use short, kebab-case descriptions: `feature/lead-scoring`, `fix/kanban-drag`.

### Commit message conventions
We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <short summary in imperative mood>

<optional body explaining what & why>
```

Types: `feat`, `fix`, `chore`, `ci`, `docs`, `refactor`, `test`.

Good examples:
- `feat: add archive action to companies list`
- `fix: allow soft-delete under RLS select policies`
- `ci: apply prod migrations before Railway deploy`

Keep commits focused. Prefer several small commits over one giant one.

---

## 4. Database changes (migrations)

The schema lives in **`supabase/migrations/`** as timestamped SQL files. This is
the source of truth the CI applies. **Do not** hand-edit already-applied
migrations or use the legacy `packages/db/migrations/` folder.

### Creating a migration

```bash
# Creates supabase/migrations/<timestamp>_add_widget_table.sql
pnpm --dir packages/db exec supabase migration new add_widget_table
```

Then write your SQL in that file. Make it **idempotent and reversible-safe**:
- Use `IF EXISTS` / `IF NOT EXISTS`, `CREATE OR REPLACE`.
- One logical change per migration.
- Never edit a migration that's already been merged — add a new one instead.

### ⚠️ Read this before touching migrations

> **The staging database is currently the SAME database as production**
> (Supabase project `rylspyewlnbijdihurqo`). That means **the moment your
> migration merges to `dev-staging`, it is live in production.** There is no
> safety buffer today. Treat every migration as a production change: review it
> carefully, keep it backward-compatible, and coordinate destructive changes
> (drops, type changes, NOT NULL) with the team.

Because of this, **don't run `supabase db push` against the remote yourself.**
Let CI apply migrations on merge (see next section). If you need to test schema
changes locally, use a local Supabase stack or your own dev project — never the
shared remote.

### Checking migration status

```bash
pnpm --dir packages/db exec supabase migration list --linked
```

---

## 5. Opening a pull request

```bash
# From your pushed branch:
gh pr create --base dev-staging --title "feat: ..." --body "..."
# or open it from the GitHub UI.
```

Your PR should:
- **Target `dev-staging`** (not `main`).
- Have a clear title (Conventional Commit style) and a description of *what* and *why*.
- Call out any **database migration** explicitly in the description.
- Pass review. Get at least one approval before merging.

Merge using the repo's standard merge (squash or merge-commit per team norm).

---

## 6. How code ships (CI/CD)

Two GitHub Actions pipelines run automatically. You don't trigger them manually.

### On merge to `dev-staging` → `.github/workflows/db-migrate-staging.yml`
- Runs **only if** the merge changed `supabase/migrations/**` or `supabase/config.toml`.
- Applies migrations to the staging Supabase project (`rylspyewlnbijdihurqo`)
  via `supabase db push`.
- A code-only merge (no migration change) does nothing to the DB.

### On merge to `main` → `.github/workflows/deploy.yml`
Three stages, in order:
1. **changes** — detects whether migrations changed.
2. **migrate** — if so, applies them to the production project **behind a manual
   approval gate** (the `production` GitHub Environment). A reviewer must click
   *Approve* before the DB is touched.
3. **deploy** — builds and deploys `apps/web` to Railway, **only if** the
   migration step succeeded or was skipped. A failed/rejected migration blocks
   the deploy.

> Watch runs in the repo's **Actions** tab. If a run is waiting, it's probably
> the production approval gate — an approver needs to review it.

---

## 7. Promoting to production

Production releases are a `dev-staging` → `main` merge, done by a maintainer:

```
Open a PR:  base = main,  head = dev-staging
```

On merge:
1. If migrations are included, the **production approval gate** pauses the run —
   an approver reviews and approves in the Actions tab.
2. Migrations apply to production.
3. The web app deploys to Railway.

Do not merge to `main` unless the change has been validated on `dev-staging`.

---

## 8. Golden rules & gotchas

- **Never commit secrets.** `.env.local` is gitignored — keep it that way. CI
  reads secrets from **GitHub repo secrets**, never from files. If you ever paste
  a token/password into a tracked file, assume it's compromised and rotate it.
- **`.env.development` is currently tracked in git** and holds live keys — do not
  add more secrets to it; it's being cleaned up.
- **Migrations are effectively production changes today** (shared DB). Backward-
  compatible, idempotent, reviewed. Coordinate anything destructive.
- **Don't `db push` to the remote from your machine.** Let CI do it on merge.
- **Branch from `dev-staging`, PR into `dev-staging`.** Only maintainers touch `main`.
- **Keep PRs small and focused.** Easier to review = faster to merge.
- **Pull before you branch** so you're not starting from stale code.

Questions? Ask in the team channel before force-pushing or merging anything you're
unsure about.
