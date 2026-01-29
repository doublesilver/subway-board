#!/bin/bash
#
# Remote Backup Script using rclone
# Uploads local backups to Google Drive or other cloud storage
#
# Prerequisites:
#   1. Install rclone: curl https://rclone.org/install.sh | sudo bash
#   2. Configure rclone: rclone config
#      - Create a remote named 'gdrive' for Google Drive
#      - Or 's3' for AWS S3, etc.
#
# Usage: ./backup-remote.sh [local|remote|both]
#

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-$HOME/backups}"
REMOTE_NAME="${REMOTE_NAME:-gdrive}"
REMOTE_PATH="${REMOTE_PATH:-gagisiro-backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
LOG_FILE="/var/log/backup-remote.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    local message="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
    echo -e "$message" | tee -a "$LOG_FILE"
}

log_success() {
    log "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    log "${RED}[ERROR]${NC} $1"
}

log_warning() {
    log "${YELLOW}[WARNING]${NC} $1"
}

# Check if rclone is installed
check_rclone() {
    if ! command -v rclone &> /dev/null; then
        log_error "rclone is not installed. Please install it first:"
        echo "  curl https://rclone.org/install.sh | sudo bash"
        exit 1
    fi
}

# Check if remote is configured
check_remote() {
    if ! rclone listremotes | grep -q "^${REMOTE_NAME}:$"; then
        log_error "Remote '${REMOTE_NAME}' is not configured."
        echo "Please run 'rclone config' to set up your remote storage."
        exit 1
    fi
}

# Upload backups to remote
upload_backups() {
    log "Starting upload to ${REMOTE_NAME}:${REMOTE_PATH}..."

    if [ ! -d "$BACKUP_DIR" ]; then
        log_error "Backup directory not found: $BACKUP_DIR"
        exit 1
    fi

    # Count files to upload
    local file_count=$(find "$BACKUP_DIR" -name "*.sql" -o -name "*.gz" | wc -l)

    if [ "$file_count" -eq 0 ]; then
        log_warning "No backup files found in $BACKUP_DIR"
        exit 0
    fi

    log "Found $file_count backup files to sync"

    # Sync backups to remote
    rclone sync "$BACKUP_DIR" "${REMOTE_NAME}:${REMOTE_PATH}" \
        --progress \
        --transfers 4 \
        --checkers 8 \
        --contimeout 60s \
        --timeout 300s \
        --retries 3 \
        --low-level-retries 10 \
        --log-file="$LOG_FILE" \
        --log-level INFO

    if [ $? -eq 0 ]; then
        log_success "Upload completed successfully"
    else
        log_error "Upload failed"
        exit 1
    fi
}

# Clean up old remote backups
cleanup_remote() {
    log "Cleaning up backups older than ${RETENTION_DAYS} days on remote..."

    rclone delete "${REMOTE_NAME}:${REMOTE_PATH}" \
        --min-age "${RETENTION_DAYS}d" \
        --progress \
        --log-file="$LOG_FILE" \
        --log-level INFO

    log_success "Remote cleanup completed"
}

# Clean up old local backups
cleanup_local() {
    log "Cleaning up local backups older than ${RETENTION_DAYS} days..."

    find "$BACKUP_DIR" -type f \( -name "*.sql" -o -name "*.gz" \) \
        -mtime "+${RETENTION_DAYS}" -delete

    log_success "Local cleanup completed"
}

# List remote backups
list_remote() {
    log "Listing remote backups..."
    rclone ls "${REMOTE_NAME}:${REMOTE_PATH}" --human-readable
}

# Restore from remote
restore_from_remote() {
    local restore_file="$1"

    if [ -z "$restore_file" ]; then
        log "Available backups on remote:"
        list_remote
        echo ""
        echo "Usage: $0 restore <filename>"
        exit 1
    fi

    log "Downloading $restore_file from remote..."

    rclone copy "${REMOTE_NAME}:${REMOTE_PATH}/${restore_file}" "$BACKUP_DIR" \
        --progress \
        --log-file="$LOG_FILE" \
        --log-level INFO

    if [ $? -eq 0 ]; then
        log_success "Downloaded: ${BACKUP_DIR}/${restore_file}"
        echo ""
        echo "To restore the database, run:"
        echo "  docker exec -i postgres psql -U \$POSTGRES_USER -d \$POSTGRES_DB < ${BACKUP_DIR}/${restore_file}"
    else
        log_error "Download failed"
        exit 1
    fi
}

# Show usage
usage() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  upload      Upload local backups to remote storage"
    echo "  cleanup     Clean up old backups (both local and remote)"
    echo "  list        List backups on remote storage"
    echo "  restore     Download a backup from remote storage"
    echo "  full        Full backup: local backup + upload + cleanup"
    echo ""
    echo "Environment variables:"
    echo "  BACKUP_DIR      Local backup directory (default: ~/backups)"
    echo "  REMOTE_NAME     rclone remote name (default: gdrive)"
    echo "  REMOTE_PATH     Remote path/folder (default: gagisiro-backups)"
    echo "  RETENTION_DAYS  Days to keep backups (default: 30)"
}

# Main
main() {
    local command="${1:-upload}"

    check_rclone

    case "$command" in
        upload)
            check_remote
            upload_backups
            ;;
        cleanup)
            check_remote
            cleanup_local
            cleanup_remote
            ;;
        list)
            check_remote
            list_remote
            ;;
        restore)
            check_remote
            restore_from_remote "$2"
            ;;
        full)
            check_remote
            # Run local backup first
            if [ -f "$HOME/side/scripts/backup-db.sh" ]; then
                log "Running local backup..."
                bash "$HOME/side/scripts/backup-db.sh"
            fi
            upload_backups
            cleanup_local
            cleanup_remote
            ;;
        help|--help|-h)
            usage
            ;;
        *)
            log_error "Unknown command: $command"
            usage
            exit 1
            ;;
    esac
}

main "$@"
