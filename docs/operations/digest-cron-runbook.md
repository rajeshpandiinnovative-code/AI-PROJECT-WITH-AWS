# Digest Cron Rollout Runbook

This runbook covers production setup and verification for daily intervention digest automation.

## 1) Pre-check

- Confirm latest code is deployed.
- Confirm DB migrations are applied, including:
  - `0005_intervention_tasks`
  - `0006_intervention_audit_logs`
  - `0007_intervention_daily_digests`
- Confirm endpoint is reachable: `POST /api/interventions/digest`.

## 2) Environment setup

Set a strong secret token in production:

- `DIGEST_CRON_TOKEN=<long-random-secret>`

Recommended: at least 32 chars, mixed letters/numbers/symbols.

## 3) Dry-run validation (no writes)

Run a dry-run first to verify targeting:

```bash
npm run digest:cron -- --dryRun --baseUrl https://your-domain.com
```

Expected result:

- HTTP 200
- JSON payload with `dryRun: true`
- `processedSchools` > 0 (or matching your intended scope)

Single-school dry-run:

```bash
npm run digest:cron -- --dryRun --baseUrl https://your-domain.com --schoolId <school-uuid>
```

## 4) Live execution validation

Run once manually (live mode):

```bash
npm run digest:cron -- --baseUrl https://your-domain.com --limit 200
```

Expected result:

- HTTP 200 with per-school summary
- New records in `intervention_daily_digests`
- New audit rows with `daily_digest_generate_cron`

## 5) Scheduler setup

Schedule daily (example: 6:00 AM):

- Linux cron: `0 6 * * *`
- GitHub Actions cron: `0 0 * * *` (UTC; adjust timezone)
- Windows Task Scheduler: daily trigger + command

Command template:

```bash
npm run digest:cron -- --baseUrl https://your-domain.com --limit 200
```

## 6) Post-setup checks

Verify in app dashboard:

- Daily digest card shows recent update.
- Digest freshness is `Fresh`.
- Digest run history shows `Daily digest (cron)`.
- Cron health badge shows `On-time`.

Verify health endpoint:

- `/api/health` includes `checks.digestAutomation.ok: true`.

## 7) Incident quick actions

If cron stops:

1. Check `DIGEST_CRON_TOKEN` in scheduler and app env.
2. Run dry-run command first.
3. Run one live command manually.
4. Check dashboard badges and run history.
5. Check API logs for token mismatch or DB errors.
