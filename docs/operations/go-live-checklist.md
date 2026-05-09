# Digest Automation Go-Live Checklist

Use this checklist for production activation day.

## A) Environment + Security

- [ ] `DIGEST_CRON_TOKEN` set in production environment.
- [ ] Token is strong (>= 32 chars) and not committed in git.
- [ ] Scheduler secret storage is configured (not hard-coded in command).
- [ ] Base URL used by scheduler points to production domain.

## B) Database + Migrations

- [ ] Latest migrations applied successfully.
- [ ] `intervention_tasks` table exists and is queryable.
- [ ] `intervention_audit_logs` table exists and is queryable.
- [ ] `intervention_daily_digests` table exists and is queryable.

## C) Endpoint Validation

- [ ] Dry-run call succeeds (`dryRun: true`) for intended scope.
- [ ] Unauthorized request without token returns `401`.
- [ ] Live call succeeds with token and returns summaries.
- [ ] `type=digest` export endpoint returns CSV for authenticated tenant.

## D) Scheduler Activation

- [ ] Daily trigger created (documented schedule + timezone).
- [ ] First scheduled run completed without errors.
- [ ] Retry/failure behavior of scheduler is configured.
- [ ] Ops owner assigned for cron failures.

## E) Dashboard Verification

- [ ] Daily digest card shows fresh digest.
- [ ] Digest freshness badge is `Fresh`.
- [ ] Digest run history shows cron entries.
- [ ] Cron health badge is `On-time`.
- [ ] 7-day automation share begins trending upward.

## F) Sign-off

- [ ] Product owner sign-off
- [ ] Ops owner sign-off
- [ ] School pilot coordinator sign-off
