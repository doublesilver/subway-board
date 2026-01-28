#!/bin/bash
# ============================================
# gagisiro.com - 헬스체크 및 알림 스크립트
# 5분마다 실행하여 서비스 상태 확인
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_DIR/logs/healthcheck.log"
ALERT_FILE="$PROJECT_DIR/logs/alert_sent"

# 로그 디렉토리 생성
mkdir -p "$PROJECT_DIR/logs"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

check_service() {
    local name=$1
    local url=$2
    local timeout=${3:-5}

    if curl -sf --max-time "$timeout" "$url" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# 서비스 상태 확인
FRONTEND_OK=false
BACKEND_OK=false
DB_OK=false

if check_service "Frontend" "http://localhost:3000/health"; then
    FRONTEND_OK=true
fi

if check_service "Backend" "http://localhost:5000/health"; then
    BACKEND_OK=true
fi

if docker exec gagisiro-db pg_isready -U gagisiro > /dev/null 2>&1; then
    DB_OK=true
fi

# 모든 서비스 정상
if $FRONTEND_OK && $BACKEND_OK && $DB_OK; then
    log "OK: 모든 서비스 정상"
    # 이전 알림 파일 삭제 (복구됨)
    rm -f "$ALERT_FILE"
    exit 0
fi

# 장애 감지
FAILED_SERVICES=""
$FRONTEND_OK || FAILED_SERVICES="$FAILED_SERVICES Frontend"
$BACKEND_OK || FAILED_SERVICES="$FAILED_SERVICES Backend"
$DB_OK || FAILED_SERVICES="$FAILED_SERVICES Database"

log "ALERT: 장애 감지 -$FAILED_SERVICES"

# 알림 중복 방지 (10분 내 재알림 방지)
if [ -f "$ALERT_FILE" ]; then
    LAST_ALERT=$(cat "$ALERT_FILE")
    NOW=$(date +%s)
    DIFF=$((NOW - LAST_ALERT))

    if [ $DIFF -lt 600 ]; then
        log "알림 스킵 (${DIFF}초 전 발송됨)"
        exit 1
    fi
fi

# 알림 발송 시간 기록
date +%s > "$ALERT_FILE"

# 자동 복구 시도
log "자동 복구 시도 중..."

if ! $BACKEND_OK || ! $FRONTEND_OK; then
    cd "$PROJECT_DIR"
    docker compose -f docker-compose.pi.yml restart backend frontend >> "$LOG_FILE" 2>&1
    log "컨테이너 재시작 완료"
fi

# 복구 후 재확인 (30초 대기)
sleep 30

RECOVERED=true
check_service "Frontend" "http://localhost:3000/health" || RECOVERED=false
check_service "Backend" "http://localhost:5000/health" || RECOVERED=false

if $RECOVERED; then
    log "자동 복구 성공"
    rm -f "$ALERT_FILE"
else
    log "자동 복구 실패 - 수동 확인 필요"
    # 여기에 Discord/Slack webhook 또는 이메일 알림 추가 가능
    # curl -X POST -H 'Content-type: application/json' \
    #   --data '{"text":"🚨 gagisiro.com 서비스 장애:'"$FAILED_SERVICES"'"}' \
    #   "$WEBHOOK_URL"
fi

exit 1
