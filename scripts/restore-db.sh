#!/usr/bin/env bash
# ─── Database Rollback / Restore Script ─────────────────────────────────────
# Restores a previously created backup into the database.
# Usage: ./scripts/restore-db.sh [path/to/backup.sql.gz]
# ────────────────────────────────────────────────────────────────────────────

set -euo pipefail

BACKUP_FILE="${1:-./backups/latest.sql.gz}"

echo "=================================================="
echo "⚠️  TGlobal Emergency Database Restore"
echo "Target Backup: ${BACKUP_FILE}"
echo "=================================================="

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "❌ ERROR: Backup file '${BACKUP_FILE}' not found!"
  exit 1
fi

DB_CONN="${DIRECT_URL:-${DATABASE_URL:-}}"
if [ -z "${DB_CONN}" ] && [ -f "./backend/.env" ]; then
  DB_CONN=$(grep -E "^DIRECT_URL=" ./backend/.env | cut -d '=' -f2- | tr -d '"' | tr -d "'" || true)
  if [ -z "${DB_CONN}" ]; then
    DB_CONN=$(grep -E "^DATABASE_URL=" ./backend/.env | cut -d '=' -f2- | tr -d '"' | tr -d "'" || true)
  fi
fi

if [ -z "${DB_CONN}" ]; then
  echo "❌ ERROR: Database connection string not found!"
  exit 1
fi

CLEAN_CONN=$(echo "${DB_CONN}" | sed 's/?.*//')

echo "Restoring database from ${BACKUP_FILE}..."

if command -v psql >/dev/null 2>&1; then
  gunzip -c "${BACKUP_FILE}" | psql "${CLEAN_CONN}"
else
  docker run -i --rm postgres:16-alpine psql "${CLEAN_CONN}" < <(gunzip -c "${BACKUP_FILE}")
fi

echo "✅ Database restored successfully from ${BACKUP_FILE}!"
