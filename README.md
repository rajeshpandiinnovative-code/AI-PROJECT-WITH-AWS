# AI Academy Pro

Next.js app for **India-wide school onboarding**, modular learning, scans, interventions, billing, and dashboards (national UDISE directory + tenant schools).

## Prerequisites

- Node.js 20+
- PostgreSQL (connection string in `.env.local`)

## Setup

```bash
npm install
cp .env.example .env.local   # Windows: copy .env.example .env.local
```

Edit `.env.local` with real secrets, then:

```bash
npm run check:env
npm run db:migrate
npm run dev
```

Once **`npm run db:migrate`** succeeds, typical **next moves**:

```bash
npm run seed:verify-school    # optional: inserts demo tenant; School ID in README section “Verify School ID login”
npm run dev
```

Then open the app (default [http://localhost:3000](http://localhost:3000)), sign in at `/login` with email/password or the seeded School UUID, load UDISE directory data with **`npm run import:schools`** when you have a CSV, and run **`npm run verify`** before commits.

If npm reports **Missing script: "db:migrate"**, your shell is not in this repo’s root (where `package.json` lives). From WSL use `cd /mnt/c/Users/<you>/Desktop/ai-academy-pro` (adjust path), then run again.

#### Migration error: `uuid` vs `integer` on `schools.id`

That means the database still has a **legacy** `schools` table (integer PK) while this app expects **UUID** `schools.id` (see `drizzle/0000_*.sql`). Foreign keys like `platform_users.school_id` cannot attach.

**Disposable dev database** (deletes **all** app data and migration history, then you re-run migrations):

```bash
ALLOW_DROP_PUBLIC_SCHEMA=1 npm run db:reset:dev
npm run db:migrate
```

**Production or any DB with data you need:** do not run the reset. You need a planned migration from integer IDs to UUIDs (or restore from a backup that matches this repo’s schema).

You can also migrate **without** relying on cwd by running from anywhere:

```bash
node /full/path/to/ai-academy-pro/migrate.mjs
```

Open [http://localhost:3000](http://localhost:3000).

### Verify School ID login (fixed UUID)

After **`npm run db:migrate`**, create a deterministic tenant for QA:

```bash
npm run seed:verify-school
```

Then sign in at **`http://localhost:3000/login`** (or your `NEXT_PUBLIC_APP_URL`) using **School ID**:

`cafebabe-0000-4000-8000-000000000001`

No password — submit the School ID form only. This inserts a sentinel UDISE `44444444444`; do not use for real schools.

### Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | yes (`check:env`) | PostgreSQL connection |
| `AUTH_SECRET` or `NEXTAUTH_SECRET` | yes | NextAuth JWT signing |
| `GEMINI_API_KEY` | yes (`check:env`) | AI modules |
| `GOOGLE_CLOUD_VISION_API_KEY` | yes (`check:env`) | Scan / vision |
| `MARKING_RUBRIC` | yes (`check:env`) | Grading |
| `NEXT_PUBLIC_APP_URL`, `AUTH_URL` | recommended | Redirects and billing return URLs |
| `PLATFORM_DASHBOARD_WITHOUT_SCHOOL` | optional | Default allows email-only `/dashboard` without a school; set `false` / `0` / `no` to send those users to onboarding (`src/lib/env.ts`) |
| `REQUIRE_PAID_SUBSCRIPTION` | optional | Set `true` to enforce Stripe subscription / trial for APIs and `/dashboard` (`src/lib/subscription.ts`) |
| Stripe (`STRIPE_*`) | if billing | Checkout and webhook (`src/lib/billing-prices.ts`) |

See `.env.example` for commented placeholders.

### National directory vs tenant schools

- **`global_schools`** — UDISE-sourced directory used in “Claim your school” search. Populate with official CSV exports via `npm run import:schools` (see `scripts/import-schools.ts`).
- **`schools`** — Tenant records created when a school is claimed (UUID primary key, billing, district/board). **Export or bulk-load tenants** with the scripts below (UUID preserved on export for migrations).

### Tenant schools CSV (UUID + details)

Export all tenant rows for backup or moving environments:

```bash
npx tsx scripts/export-tenant-schools.ts
npx tsx scripts/export-tenant-schools.ts --out ./data/export/my-schools.csv
```

Import / upsert into `schools` (matches on **`udise_code`**; updates never change an existing UUID):

```bash
npx tsx scripts/import-tenant-schools.ts --csv ./data/export/my-schools.csv
```

Required columns on import: **`udise_code`**, **`name`**, **`board`**. Optional: **`id`** (UUID), **`district`** (defaults to `India`), subscription / Stripe fields, timestamps—same shape as export.

After pulling schema changes, run **`npm run db:migrate`** (includes default `district` for new tenants).

## Scripts

| Command | Meaning |
|---------|---------|
| `npm run dev` | Development server |
| `npm run migrate` | Same as `db:migrate` (shorter alias) |
| `ALLOW_DROP_PUBLIC_SCHEMA=1 npm run db:reset:dev` | Dev-only: wipe `public` + `drizzle` schemas then re-migrate (see troubleshooting below) |
| `npm run verify` | `check:env` + ESLint + TypeScript |
| `npm run verify:ci` | ESLint + TypeScript (no `.env.local` required; CI-friendly) |
| `npm run qa` | Same as `verify:ci`, then prints suggested next commands |
| `npm run lint` | ESLint |
| `npm run build` | Production build |
| `npm run smoke` | Full verification + module banks + build |
| `npm run test:e2e:install` | Download Chromium for Playwright (once per machine) |
| `npm run test:e2e` | Playwright smoke tests (starts dev server unless one is already running) |
| `npm run export:schools:tenants` | CSV export of `schools` (UUID + billing columns) |
| `npm run import:schools:tenants -- --csv ./path.csv` | Upsert tenant `schools` from CSV |
| `npm run seed:verify-school` | Insert demo tenant UUID for `/login` School ID verification |

### End-to-end smoke tests

First-time Playwright browser install:

```bash
npm run test:e2e:install
npm run test:e2e
```

If port `3000` is busy, set `PLAYWRIGHT_BASE_URL` or stop the other server. To attach tests to an already-running dev server without spawning another:

```bash
set PLAYWRIGHT_SKIP_WEBSERVER=1
npm run test:e2e
```

### Manual smoke (auth)

After DB is migrated and users/schools exist:

1. **Email / password** — Sign in at `/login`; platform users without a linked school either see the role dashboard or are sent to onboarding depending on `PLATFORM_DASHBOARD_WITHOUT_SCHOOL`.
2. **Email + linked school** — Same as above with `schoolId` on the platform user; opens school-backed flows where applicable.
3. **School UUID** — Tenant-only login with the school’s UUID from onboarding; dashboard uses the school subscription when enforcement is on.

When `REQUIRE_PAID_SUBSCRIPTION=true`, missing subscription redirects to `/pricing?reason=subscription` from `/dashboard`.

## Cloud deploy (Vercel)

1. **Postgres:** Create a free project on [Neon](https://neon.tech) or [Supabase](https://supabase.com), copy `DATABASE_URL` (often append `?sslmode=require`).
2. **Migrate once from your machine:** `set DATABASE_URL=… && npm run db:migrate` (optional: `npm run seed:verify-school`).
3. **Host:** [Vercel](https://vercel.com) → **Add New Project** → import this GitHub repo. Vercel runs `npm run build`; no extra config required (`vercel.json` pins region **Mumbai `bom1`**).
4. **Environment variables** in the Vercel project (same names as `.env.example`): at minimum `DATABASE_URL`, `AUTH_SECRET`, `GEMINI_API_KEY`, `GOOGLE_CLOUD_VISION_API_KEY`, `MARKING_RUBRIC`, and set **`NEXT_PUBLIC_APP_URL`** + **`AUTH_URL`** to your production URL (`https://<project>.vercel.app`).
5. Redeploy after changing env vars.

CLI (logged in with `npx vercel login`): `npm run deploy:vercel`. Optional GitHub Action: **Actions → Vercel Production (manual)** after adding secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` from `vercel link`.

## Docs

- Operations notes: `docs/operations/README.md`
- **Staging / launch rehearsal:** `docs/operations/launch-rehearsal-checklist.md`
- **CI:** GitHub Actions runs **`verify:ci`** + **`npm run build`** on push/PR (`.github/workflows/ci.yml`); Playwright smoke optional (`.github/workflows/playwright.yml`).

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
