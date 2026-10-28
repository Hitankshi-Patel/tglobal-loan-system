#!/usr/bin/env bash
# ─── Database Safety Backup Script ──────────────────────────────────────────
# Automatically snapshots the PostgreSQL/Supabase database before deployment.
# Exits with code 1 if backup fails, preventing unsafe deployments.
# ────────────────────────────────────────────────────────────────────────────

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/backup_tglobal_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "=================================================="
echo "🛡️  TGlobal Safety Check: Initiating Database Backup"
echo "Timestamp: ${TIMESTAMP}"
echo "=================================================="

# Determine connection URL (Prefer DIRECT_URL for pg_dump to bypass connection poolers)
DB_CONN="${DIRECT_URL:-${DATABASE_URL:-}}"

if [ -z "${DB_CONN}" ]; then
  # Try loading from .env if available
  if [ -f "./backend/.env" ]; then
    echo "Loading DB connection string from backend/.env..."
    # Extract DIRECT_URL or DATABASE_URL
    DB_CONN=$(grep -E "^DIRECT_URL=" ./backend/.env | cut -d '=' -f2- | tr -d '"' | tr -d "'" || true)
    if [ -z "${DB_CONN}" ]; then
      DB_CONN=$(grep -E "^DATABASE_URL=" ./backend/.env | cut -d '=' -f2- | tr -d '"' | tr -d "'" || true)
    fi
  fi
fi

if [ -z "${DB_CONN}" ]; then
  echo "❌ ERROR: Neither DIRECT_URL nor DATABASE_URL environment variable is set!"
  echo "Aborting deployment to prevent unbacked data loss."
  exit 1
fi

# Remove ?pgbouncer=true or other URL query parameters that might confuse pg_dump
CLEAN_CONN=$(echo "${DB_CONN}" | sed 's/?.*//')

echo "📦 Creating compressed snapshot to: ${BACKUP_FILE}..."

# Execute pg_dump with gzip compression
if command -v pg_dump >/dev/null 2>&1; then
  pg_dump "${CLEAN_CONN}" \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    | gzip -9 > "${BACKUP_FILE}"
else
  # If pg_dump not locally installed, attempt running via docker postgres client
  echo "pg_dump not found on host. Running pg_dump via docker container..."
  docker run --rm \
    -e PGPASSWORD="" \
    postgres:16-alpine \
    pg_dump "${CLEAN_CONN}" --no-owner --no-acl --clean --if-exists \
    | gzip -9 > "${BACKUP_FILE}"
fi

# Validate backup file exists and is non-empty
if [ -s "${BACKUP_FILE}" ]; then
  FILE_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
  echo "✅ SUCCESS: Database backup created successfully!"
  echo "File: ${BACKUP_FILE} (Size: ${FILE_SIZE})"
  
  # Point latest symlink to this file
  ln -sf "backup_tglobal_${TIMESTAMP}.sql.gz" "${BACKUP_DIR}/latest.sql.gz"
  echo "Updated ${BACKUP_DIR}/latest.sql.gz"
  exit 0
else
  echo "❌ CRITICAL: Backup file was created but is empty (0 bytes)!"
  rm -f "${BACKUP_FILE}"
  exit 1
fi
