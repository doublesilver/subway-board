#!/bin/bash
# ============================================
# gagisiro.com - 리소스 모니터링 스크립트
# ============================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   gagisiro.com 리소스 모니터링${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# System info
echo -e "${YELLOW}[시스템 정보]${NC}"
echo "호스트: $(hostname)"
echo "시간: $(date)"
echo "가동시간: $(uptime -p 2>/dev/null || uptime)"
echo ""

# CPU usage
echo -e "${YELLOW}[CPU 사용량]${NC}"
top -bn1 | grep "Cpu(s)" | awk '{print "CPU: " 100 - $8 "%"}'
echo ""

# Memory usage
echo -e "${YELLOW}[메모리 사용량]${NC}"
free -h | awk 'NR==2{printf "메모리: %s / %s (%.2f%%)\n", $3, $2, $3/$2*100}'
echo ""

# Disk usage
echo -e "${YELLOW}[디스크 사용량]${NC}"
df -h / | awk 'NR==2{print "디스크: " $3 " / " $4 " (" $5 " 사용)"}'
echo ""

# Docker containers
echo -e "${YELLOW}[Docker 컨테이너 상태]${NC}"
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

cd "$PROJECT_DIR"
$COMPOSE_CMD -f docker-compose.pi.yml ps 2>/dev/null || echo "컨테이너 없음"
echo ""

# Container resource usage
echo -e "${YELLOW}[컨테이너 리소스 사용량]${NC}"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" 2>/dev/null | grep gagisiro || echo "gagisiro 컨테이너 없음"
echo ""

# Health check
echo -e "${YELLOW}[헬스 체크]${NC}"

# Backend API
if curl -sf http://localhost:5000/api/health > /dev/null 2>&1; then
    echo -e "Backend API:  ${GREEN}[OK]${NC}"
else
    echo -e "Backend API:  ${RED}[FAIL]${NC}"
fi

# Frontend
if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "Frontend:     ${GREEN}[OK]${NC}"
else
    echo -e "Frontend:     ${RED}[FAIL]${NC}"
fi

# Database
if docker exec gagisiro-db pg_isready -U gagisiro > /dev/null 2>&1; then
    echo -e "PostgreSQL:   ${GREEN}[OK]${NC}"
else
    echo -e "PostgreSQL:   ${RED}[FAIL]${NC}"
fi

echo ""

# Recent logs (last 5 errors)
echo -e "${YELLOW}[최근 에러 로그 (Backend)]${NC}"
if [ -f "$PROJECT_DIR/logs/backend/error.log" ]; then
    tail -n 5 "$PROJECT_DIR/logs/backend/error.log" 2>/dev/null || echo "에러 로그 없음"
else
    docker logs gagisiro-api 2>&1 | grep -i error | tail -n 5 || echo "에러 없음"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
