#!/bin/bash
# ============================================
# gagisiro.com - 데이터베이스 백업 스크립트
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_DIR/data/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Load environment variables
if [ -f "$PROJECT_DIR/.env" ]; then
    source "$PROJECT_DIR/.env"
fi

POSTGRES_DB="${POSTGRES_DB:-subway_board}"
POSTGRES_USER="${POSTGRES_USER:-gagisiro}"
CONTAINER_NAME="gagisiro-db"

echo -e "${YELLOW}[BACKUP] 데이터베이스 백업 시작: $DATE${NC}"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${RED}[ERROR] 컨테이너 ${CONTAINER_NAME}이 실행 중이 아닙니다${NC}"
    exit 1
fi

# Create backup
BACKUP_FILE="$BACKUP_DIR/${POSTGRES_DB}_${DATE}.sql.gz"
docker exec "$CONTAINER_NAME" pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$BACKUP_FILE"

if [ -f "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}[OK] 백업 완료: $BACKUP_FILE ($BACKUP_SIZE)${NC}"
else
    echo -e "${RED}[ERROR] 백업 실패${NC}"
    exit 1
fi

# Clean old backups (keep last 7 days)
echo -e "${YELLOW}[CLEANUP] 7일 이상 된 백업 삭제${NC}"
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete 2>/dev/null || true

# List backups
echo -e "${YELLOW}현재 백업 목록:${NC}"
ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null || echo "백업 없음"

echo -e "${GREEN}[DONE] 백업 작업 완료${NC}"
