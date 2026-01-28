#!/bin/bash
# ============================================
# Railway DB -> 로컬 PostgreSQL 마이그레이션 스크립트
# 사용법: ./migrate-from-railway.sh
# ============================================

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 현재 디렉토리 확인
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_DIR/backups"

# 백업 디렉토리 생성
mkdir -p "$BACKUP_DIR"

echo "============================================"
echo "  Railway DB -> 로컬 PostgreSQL 마이그레이션"
echo "============================================"
echo

# Railway DB URL 확인
if [ -z "$RAILWAY_DATABASE_URL" ]; then
    log_warn "RAILWAY_DATABASE_URL 환경변수가 설정되지 않았습니다."
    echo
    read -p "Railway DATABASE_URL을 입력하세요: " RAILWAY_DATABASE_URL
fi

if [ -z "$RAILWAY_DATABASE_URL" ]; then
    log_error "Railway DATABASE_URL이 필요합니다."
    exit 1
fi

# 로컬 DB 정보 확인
LOCAL_DB_USER="${POSTGRES_USER:-gagisiro}"
LOCAL_DB_NAME="${POSTGRES_DB:-gagisiro}"
LOCAL_DB_PASSWORD="${POSTGRES_PASSWORD}"

if [ -z "$LOCAL_DB_PASSWORD" ]; then
    log_warn "POSTGRES_PASSWORD 환경변수가 설정되지 않았습니다."
    echo
    read -sp "로컬 PostgreSQL 비밀번호를 입력하세요: " LOCAL_DB_PASSWORD
    echo
fi

# 타임스탬프
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DUMP_FILE="$BACKUP_DIR/railway_dump_$TIMESTAMP.sql"

echo
log_info "1단계: Railway DB에서 데이터 덤프 중..."
echo

# Railway DB에서 덤프
if pg_dump "$RAILWAY_DATABASE_URL" \
    --no-owner \
    --no-privileges \
    --clean \
    --if-exists \
    -f "$DUMP_FILE"; then
    log_info "덤프 완료: $DUMP_FILE"
    log_info "파일 크기: $(du -h "$DUMP_FILE" | cut -f1)"
else
    log_error "Railway DB 덤프 실패"
    exit 1
fi

echo
log_info "2단계: 로컬 PostgreSQL 컨테이너 확인 중..."
echo

# Docker Compose가 실행 중인지 확인
if ! docker ps | grep -q "gagisiro-db"; then
    log_warn "PostgreSQL 컨테이너가 실행 중이 아닙니다. 시작합니다..."
    cd "$PROJECT_DIR"
    docker compose -f docker-compose.pi.yml up -d postgres

    # 컨테이너가 준비될 때까지 대기
    log_info "PostgreSQL이 준비될 때까지 대기 중..."
    sleep 10

    for i in {1..30}; do
        if docker exec gagisiro-db pg_isready -U "$LOCAL_DB_USER" -d "$LOCAL_DB_NAME" > /dev/null 2>&1; then
            log_info "PostgreSQL 준비 완료!"
            break
        fi
        echo -n "."
        sleep 2
    done
    echo
fi

echo
log_info "3단계: 로컬 DB로 데이터 복원 중..."
echo

# 로컬 DB로 복원
if docker exec -i gagisiro-db psql -U "$LOCAL_DB_USER" -d "$LOCAL_DB_NAME" < "$DUMP_FILE"; then
    log_info "데이터 복원 완료!"
else
    log_error "데이터 복원 실패"
    exit 1
fi

echo
log_info "4단계: 데이터 검증 중..."
echo

# 테이블 목록 확인
echo "=== 테이블 목록 ==="
docker exec gagisiro-db psql -U "$LOCAL_DB_USER" -d "$LOCAL_DB_NAME" -c "\dt"

# 각 테이블의 레코드 수 확인
echo
echo "=== 레코드 수 ==="
docker exec gagisiro-db psql -U "$LOCAL_DB_USER" -d "$LOCAL_DB_NAME" -c "
SELECT
    schemaname,
    relname as table_name,
    n_live_tup as row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;
"

echo
echo "============================================"
log_info "마이그레이션 완료!"
echo "============================================"
echo
log_info "덤프 파일 위치: $DUMP_FILE"
log_info "이 파일은 백업으로 보관하세요."
echo
log_warn "Railway DB 연결을 해제하려면:"
echo "  1. .env 파일에서 DATABASE_URL을 로컬 DB로 변경"
echo "  2. docker compose -f docker-compose.pi.yml restart backend"
echo
