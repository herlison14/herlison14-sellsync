#!/usr/bin/env bash
# Incremental PostgreSQL backup → S3
# Usage: BACKUP_S3_BUCKET=my-bucket bash scripts/backup-db.sh
# Cron example (daily at 03:00): 0 3 * * * /path/to/backup-db.sh >> /var/log/sellsync-backup.log 2>&1

set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_URL="${DATABASE_URL:?DATABASE_URL is required}"
S3_BUCKET="${BACKUP_S3_BUCKET:?BACKUP_S3_BUCKET is required}"
S3_PREFIX="${BACKUP_S3_PREFIX:-sellsync/db}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
DUMP_FILE="/tmp/sellsync_backup_${TIMESTAMP}.sql.gz"

echo "[backup] Starting PostgreSQL dump at ${TIMESTAMP}"

pg_dump "${DB_URL}" \
  --format=plain \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  | gzip -9 > "${DUMP_FILE}"

DUMP_SIZE=$(du -sh "${DUMP_FILE}" | cut -f1)
echo "[backup] Dump size: ${DUMP_SIZE}"

echo "[backup] Uploading to s3://${S3_BUCKET}/${S3_PREFIX}/${TIMESTAMP}.sql.gz"
aws s3 cp "${DUMP_FILE}" "s3://${S3_BUCKET}/${S3_PREFIX}/${TIMESTAMP}.sql.gz" \
  --sse AES256 \
  --storage-class STANDARD_IA

rm -f "${DUMP_FILE}"
echo "[backup] Local file cleaned up"

# Prune backups older than RETENTION_DAYS
echo "[backup] Pruning backups older than ${RETENTION_DAYS} days"
CUTOFF=$(date -d "-${RETENTION_DAYS} days" +%Y%m%d 2>/dev/null || date -v -"${RETENTION_DAYS}"d +%Y%m%d)
aws s3 ls "s3://${S3_BUCKET}/${S3_PREFIX}/" \
  | awk '{print $4}' \
  | grep -E '^[0-9]{8}_' \
  | while read -r key; do
    FILE_DATE="${key:0:8}"
    if [[ "${FILE_DATE}" < "${CUTOFF}" ]]; then
      echo "[backup] Deleting old backup: ${key}"
      aws s3 rm "s3://${S3_BUCKET}/${S3_PREFIX}/${key}"
    fi
  done

echo "[backup] Done at $(date +%Y%m%d_%H%M%S)"
