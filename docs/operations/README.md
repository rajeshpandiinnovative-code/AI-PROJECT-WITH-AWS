# Operations Docs Index

Use these docs for rollout, automation, and ongoing monitoring of intervention and digest workflows.

## Billing

- `billing.md` — Stripe checkout, webhooks, env vars, trial vs paid.

## Runbooks

- `digest-cron-runbook.md`
  - Production setup for digest scheduler
  - Dry-run and live execution validation
  - Scheduler configuration and incident quick actions

## Checklists

- `go-live-checklist.md`
  - Launch-day checks across env, DB, endpoint, scheduler, and dashboard
- `post-go-live-monitoring-checklist.md`
  - First 48-hour monitoring and stabilization checklist

## Recommended order

1. Follow `digest-cron-runbook.md` for setup.
2. Execute `go-live-checklist.md` during activation.
3. Track first 48 hours via `post-go-live-monitoring-checklist.md`.
