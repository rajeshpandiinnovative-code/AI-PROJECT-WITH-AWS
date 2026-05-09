# Post Go-Live Monitoring Checklist (48 Hours)

Use this checklist during the first 48 hours after enabling scheduler.

## Hour 0-2 (Immediate)

- [ ] Confirm latest cron run appears in dashboard.
- [ ] Confirm digest freshness remains `Fresh`.
- [ ] Confirm no spike in `Delayed` or `Never ran` cron health.
- [ ] Confirm audit row exists for `daily_digest_generate_cron`.

## Hour 2-12

- [ ] Verify one digest record is created for each expected school scope.
- [ ] Spot-check digest summary counts (open, overdue, critical) for realism.
- [ ] Verify exports (`tracker`, `audit`, `digest`) are downloadable by authenticated users.
- [ ] Verify health endpoint includes `digestAutomation.ok: true`.

## Hour 12-24

- [ ] Review intervention tracker for stale or missing updates.
- [ ] Check automation share in digest history card.
- [ ] Ensure no repeated 401/503 from cron endpoint in logs.
- [ ] Confirm manual fallback command works if cron fails.

## Hour 24-48

- [ ] Confirm second day digest run completed on schedule.
- [ ] Compare day-to-day digest stability (no abnormal swings unless expected).
- [ ] Validate runbook still matches actual deployment behavior.
- [ ] Capture lessons learned and update runbook/checklists.

## Incident Response Mini-Playbook

If cron misses a run:

1. Check token mismatch/config drift.
2. Run dry-run command to validate scope.
3. Execute one manual live run.
4. Confirm dashboard freshness and history recover.
5. Open issue with timestamp + root cause note.
