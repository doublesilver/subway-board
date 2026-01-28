#!/bin/bash
# ============================================
# gagisiro.com - Raspberry Pi 배포 스크립트
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   gagisiro.com 배포 시작${NC}"
echo -e "${BLUE}========================================${NC}"

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${RED}[ERROR] root 사용자로 실행하지 마세요${NC}"
    exit 1
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}[ERROR] Docker가 설치되어 있지 않습니다${NC}"
    echo -e "${YELLOW}설치: curl -fsSL https://get.docker.com | sh${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}[ERROR] Docker Compose가 설치되어 있지 않습니다${NC}"
    exit 1
fi

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

echo -e "${BLUE}[1/6] 환경 변수 확인${NC}"

# Check .env file
if [ ! -f ".env" ]; then
    if [ -f ".env.pi.example" ]; then
        echo -e "${YELLOW}[WARN] .env 파일이 없습니다. .env.pi.example을 복사합니다${NC}"
        cp .env.pi.example .env
        echo -e "${RED}[IMPORTANT] .env 파일을 편집하여 필수 값을 설정하세요!${NC}"
        echo -e "${YELLOW}nano .env${NC}"
        exit 1
    else
        echo -e "${RED}[ERROR] .env 파일과 .env.pi.example 모두 없습니다${NC}"
        exit 1
    fi
fi

# Validate required environment variables
source .env
REQUIRED_VARS=("POSTGRES_PASSWORD" "JWT_SECRET" "ADMIN_KEY")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ] || [ "${!var}" == "CHANGE_THIS"* ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo -e "${RED}[ERROR] 다음 환경 변수를 설정하세요:${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo -e "  - ${YELLOW}$var${NC}"
    done
    echo -e "${YELLOW}nano .env${NC}"
    exit 1
fi

echo -e "${GREEN}[OK] 환경 변수 확인 완료${NC}"

echo -e "${BLUE}[2/6] 필요한 디렉토리 생성${NC}"
mkdir -p data/postgres
mkdir -p logs/backend
echo -e "${GREEN}[OK] 디렉토리 생성 완료${NC}"

echo -e "${BLUE}[3/6] Docker 이미지 빌드${NC}"
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

$COMPOSE_CMD -f docker-compose.pi.yml build --no-cache
echo -e "${GREEN}[OK] 이미지 빌드 완료${NC}"

echo -e "${BLUE}[4/6] 기존 컨테이너 정리${NC}"
$COMPOSE_CMD -f docker-compose.pi.yml down --remove-orphans 2>/dev/null || true
echo -e "${GREEN}[OK] 정리 완료${NC}"

echo -e "${BLUE}[5/6] 컨테이너 시작${NC}"
$COMPOSE_CMD -f docker-compose.pi.yml up -d
echo -e "${GREEN}[OK] 컨테이너 시작됨${NC}"

echo -e "${BLUE}[6/6] 헬스 체크 대기 (60초)${NC}"
sleep 10

# Check container status
echo -e "${BLUE}컨테이너 상태:${NC}"
$COMPOSE_CMD -f docker-compose.pi.yml ps

# Wait for health checks
MAX_ATTEMPTS=12
ATTEMPT=1
while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
    if curl -sf http://localhost:5000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}[OK] Backend API 정상${NC}"
        break
    fi
    echo -e "${YELLOW}[WAIT] Backend 헬스 체크 대기중... ($ATTEMPT/$MAX_ATTEMPTS)${NC}"
    sleep 5
    ATTEMPT=$((ATTEMPT + 1))
done

if [ $ATTEMPT -gt $MAX_ATTEMPTS ]; then
    echo -e "${RED}[ERROR] Backend 헬스 체크 실패${NC}"
    echo -e "${YELLOW}로그 확인: docker-compose -f docker-compose.pi.yml logs backend${NC}"
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}   배포 완료!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Backend API: http://localhost:5000"
echo -e "Frontend:    http://localhost:3000"
echo -e "API Docs:    http://localhost:5000/api-docs"
echo ""
echo -e "${YELLOW}Tailscale Funnel 설정:${NC}"
echo -e "  tailscale funnel 5000"
echo -e "  tailscale funnel 3000"
echo ""
echo -e "${YELLOW}로그 확인:${NC}"
echo -e "  $COMPOSE_CMD -f docker-compose.pi.yml logs -f"
