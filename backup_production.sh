#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────────────────────
# AI Academy Pro — Production Database Backup Script
# ─────────────────────────────────────────────────────────────────────────────

DB_HOST="ai-academy-db.cfmuo0i66sns.eu-north-1.rds.amazonaws.com"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/ai_academy_backup_${TIMESTAMP}.sql"

mkdir -p "$BACKUP_DIR"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  AI Academy Pro — Database Backup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Host:      ${DB_HOST}"
echo "  Database:  ${DB_NAME}"
echo "  User:      ${DB_USER}"
echo "  Output:    ${BACKUP_FILE}"
echo ""

echo "[1/3] Connecting to RDS instance..."
pg_dump \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --username="$DB_USER" \
  --dbname="$DB_NAME" \
  --format=plain \
  --no-owner \
  --no-privileges \
  --if-exists \
  --clean \
  --file="$BACKUP_FILE"

echo "[2/3] Backup written to: ${BACKUP_FILE}"

FILESIZE=$(stat --printf="%s" "$BACKUP_FILE" 2>/dev/null || stat -f%z "$BACKUP_FILE" 2>/dev/null || echo "unknown")
echo "[3/3] File size: ${FILESIZE} bytes"

echo ""
echo "✓ Backup complete at $(date)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
