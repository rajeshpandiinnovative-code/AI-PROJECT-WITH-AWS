# Launch rehearsal (staging → production)

Use this when preparing **India-wide rollout**: validate auth, data, billing, and monitoring before pointing real traffic.

## 1. Staging environment

- [ ] Hosting URL + HTTPS (e.g. Vercel / AWS) with **`NEXT_PUBLIC_APP_URL`** and **`AUTH_URL`** set to that origin.
- [ ] **`DATABASE_URL`** points at staging Postgres; run **`npm run db:migrate`** on staging.
- [ ] **`AUTH_SECRET`** set (long random string); never reuse production secret in dev docs.
- [ ] AI keys: **`GEMINI_API_KEY`**, **`GOOGLE_CLOUD_VISION_API_KEY`**, **`MARKING_RUBRIC`** (or feature flags off where applicable).
- [ ] Optional access flags reviewed: **`PLATFORM_DASHBOARD_WITHOUT_SCHOOL`**, **`REQUIRE_PAID_SUBSCRIPTION`** (`src/lib/env.ts`, `src/lib/subscription.ts`).
- [ ] Stripe **test** keys + webhook secret for staging checkout (`STRIPE_*`); test billing webhooks (Stripe CLI or dashboard).

## 2. Directory and tenants

- [ ] Import UDISE CSV into **`global_schools`**: `npm run import:schools -- --csv <file> --board-type MATRIC` (adjust board).
- [ ] Complete **`/onboarding`** once: claim creates **`schools`** tenant row; confirm UUID login or linked platform user.

## 3. End-to-end user path (manual)

- [ ] **`/register`** → create email account → **`/login`** → **`/dashboard`** (role / subscription behavior as configured).
- [ ] **`/login`** with **School ID** (tenant UUID) if using tenant-only access.
- [ ] **`/pricing`** → checkout (Stripe test) when billing is enforced.
- [ ] **`/visualizations`** public charts load (preview).
- [ ] **`/health`** infra checks green for ops.

## 4. Automation

- [ ] **`npm run qa`** (or CI: lint + `tsc` + build) green locally and on GitHub Actions.
- [ ] **`npm run test:e2e`** passes when Playwright workflow runs (smoke routes).

## 5. Production cutover

- [ ] Production **`DATABASE_URL`** + migrate; secrets in vault; Stripe **live** keys only when ready.
- [ ] Monitoring / analytics (`/api/analytics/event`, admin summary if used).
- [ ] Rollback plan: DB backup, previous deployment tag.
