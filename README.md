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
| `npm run verify` | `check:env` + ESLint + TypeScript |
| `npm run verify:ci` | ESLint + TypeScript (no `.env.local` required; CI-friendly) |
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

## Docs

- Operations notes: `docs/operations/README.md`

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
