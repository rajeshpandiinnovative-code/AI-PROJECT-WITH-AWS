# AWS RDS Manual Snapshot Guide

## Instance Details

- **DB Identifier:** `ai-academy-db`
- **Region:** `eu-north-1` (Stockholm)
- **Engine:** PostgreSQL
- **Endpoint:** `ai-academy-db.cfmuo0i66sns.eu-north-1.rds.amazonaws.com`

## Creating a Manual Snapshot (AWS Console)

1. Open the [AWS RDS Console](https://eu-north-1.console.aws.amazon.com/rds/home?region=eu-north-1#databases:)
2. Select your DB instance: **ai-academy-db**
3. Click **Actions** → **Take snapshot**
4. Enter a snapshot identifier: `ai-academy-pre-restructuring-may2026`
5. Click **Take Snapshot**
6. Wait for status to change from "Creating" to "Available" (typically 2–5 minutes)

## Verifying the Snapshot

1. Navigate to **Snapshots** in the left sidebar
2. Confirm the snapshot shows status: **Available**
3. Note the snapshot ARN for disaster recovery documentation

## Restoring from Snapshot (if needed)

1. Go to **Snapshots** → select your snapshot
2. Click **Actions** → **Restore snapshot**
3. Configure the new instance (same VPC, security group, parameter group)
4. The restored instance will have a new endpoint — update `.env.local` accordingly

## Automated Backups

AWS RDS automated backups are enabled with a 7-day retention window by default. Manual snapshots persist until explicitly deleted and are recommended before any major schema or data changes.

## CLI Alternative

```bash
aws rds create-db-snapshot \
  --db-instance-identifier ai-academy-db \
  --db-snapshot-identifier ai-academy-pre-restructuring-may2026 \
  --region eu-north-1
```
