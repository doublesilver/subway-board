# gagisiro.com - 라즈베리파이 배포 가이드

## 배포 전 체크리스트

### 완료된 작업
- [x] Docker Compose 설정 파일 작성 (`docker-compose.pi.yml`)
- [x] 환경 변수 템플릿 작성 (`.env.pi.example`)
- [x] Backend Dockerfile 작성 (`backend/Dockerfile`)
- [x] Frontend Dockerfile 작성 (`frontend/Dockerfile`)
- [x] Nginx 설정 작성 (`frontend/nginx.conf`)
- [x] 배포 스크립트 작성 (`scripts/deploy-pi.sh`)
- [x] 백업 스크립트 작성 (`scripts/backup-db.sh`)
- [x] 모니터링 스크립트 작성 (`scripts/monitor.sh`)

### 생성된 파일
```
c:\side/
├── docker-compose.pi.yml          # 라즈베리파이용 Docker Compose
├── .env.pi.example                # 환경 변수 템플릿
├── backend/
│   └── Dockerfile                 # Backend Docker 이미지
├── frontend/
│   ├── Dockerfile                 # Frontend Docker 이미지
│   └── nginx.conf                 # Nginx SPA 설정
└── scripts/
    ├── deploy-pi.sh               # 자동 배포
    ├── backup-db.sh               # DB 백업
    └── monitor.sh                 # 리소스 모니터링
```

---

## 1단계: 라즈베리파이 환경 확인

### 필수 요구사항
- [ ] 라즈베리파이 4 (4GB RAM 이상 권장)
- [ ] Raspberry Pi OS 64-bit
- [ ] 최소 16GB SD 카드 (32GB 권장)
- [ ] Tailscale 설치 및 연결 완료
- [ ] 인터넷 연결 확인

### 확인 명령어
```bash
# OS 확인
uname -a

# RAM 확인
free -h

# 디스크 확인
df -h

# Tailscale 확인
tailscale status
```

---

## 2단계: 프로젝트 파일 전송

### 방법 1: Git Clone (권장)
```bash
# 라즈베리파이에서 실행
cd /home/pi/projects
git clone https://github.com/YOUR_USERNAME/gagisiro.git
cd gagisiro
```

### 방법 2: Tailscale을 통한 SCP 전송
```bash
# Windows PowerShell에서 실행
scp -r c:\side\* pi@<TAILSCALE_IP>:/home/pi/projects/gagisiro/
```

---

## 3단계: Docker 설치 (미설치 시)

```bash
# Docker 설치
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 현재 사용자를 docker 그룹에 추가
sudo usermod -aG docker $USER

# 재로그인 또는 다음 명령어 실행
newgrp docker

# Docker Compose V2 확인
docker compose version

# 설치 확인
docker --version
```

---

## 4단계: 환경 변수 설정

```bash
cd /home/pi/projects/gagisiro

# .env 파일 생성
cp .env.pi.example .env

# .env 파일 편집
nano .env
```

### 필수 설정 항목
```bash
# 강력한 비밀번호로 변경 (최소 16자)
POSTGRES_PASSWORD=<강력한_비밀번호>

# 랜덤 시크릿 키 생성
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=<생성된_키>

# 관리자 키
ADMIN_KEY=<관리자_API_키>
ADMIN_DASHBOARD_PASSWORD=<대시보드_비밀번호>

# API 키 (선택)
OPENAI_API_KEY=<your_openai_api_key>

# Tailscale Funnel 도메인
VITE_API_URL=https://<MACHINE_NAME>.<TAILNET>.ts.net
```

---

## 5단계: Tailscale Funnel 설정

Tailscale Funnel을 사용하면 포트포워딩 없이 안전하게 서비스를 공개할 수 있습니다.

### Tailscale 관리 콘솔 설정
1. [Tailscale Admin Console](https://login.tailscale.com/admin/dns) 접속
2. **DNS** → **DNS settings** → **Enable HTTPS** 체크
3. **Access Controls** → Funnel 허용 규칙 추가:
```json
{
  "nodeAttrs": [
    {
      "target": ["tag:server"],
      "attr": ["funnel"]
    }
  ]
}
```

### Funnel 활성화
```bash
# 라즈베리파이에서 실행

# Backend API 포트 공개 (5000)
sudo tailscale funnel 5000

# 또는 Frontend 포트 공개 (3000)
sudo tailscale funnel 3000

# 상태 확인
tailscale funnel status
```

### 커스텀 도메인 연결 (gagisiro.com)
1. Cloudflare 또는 도메인 DNS 설정
2. CNAME 레코드 추가:
   - `gagisiro.com` → `<MACHINE_NAME>.<TAILNET>.ts.net`
   - `api.gagisiro.com` → `<MACHINE_NAME>.<TAILNET>.ts.net`

### CORS 설정 업데이트
`.env` 파일에 Tailscale Funnel URL 추가:
```bash
FRONTEND_URL=https://<MACHINE_NAME>.<TAILNET>.ts.net
```

---

## 6단계: 배포 실행

```bash
# 스크립트 실행 권한 부여
chmod +x scripts/*.sh

# 배포 스크립트 실행
./scripts/deploy-pi.sh
```

### 수동 배포 (스크립트 사용 안 할 경우)
```bash
# 필요한 디렉토리 생성
mkdir -p data/postgres logs/backend

# Docker 이미지 빌드 및 컨테이너 시작
docker compose -f docker-compose.pi.yml up -d --build

# 로그 확인
docker compose -f docker-compose.pi.yml logs -f
```

---

## 7단계: 서비스 확인

### 컨테이너 상태 확인
```bash
docker compose -f docker-compose.pi.yml ps
```

### 예상 출력
```
NAME                STATUS              PORTS
gagisiro-api        Up (healthy)        0.0.0.0:5000->5000/tcp
gagisiro-frontend   Up (healthy)        0.0.0.0:3000->80/tcp
gagisiro-db         Up (healthy)        5432/tcp
```

### 헬스 체크
```bash
# API 서버 확인
curl http://localhost:5000/api/health

# 예상 응답: {"status":"OK","timestamp":"...","database":"connected"}
```

### 웹 브라우저 접속
- API: `http://localhost:5000` 또는 `https://<TAILSCALE_URL>`
- Frontend: `http://localhost:3000` 또는 `https://<TAILSCALE_URL>`
- API Docs: `http://localhost:5000/api-docs`

---

## 8단계: 리소스 모니터링

```bash
# 리소스 사용량 확인
./scripts/monitor.sh

# 실시간 모니터링
docker stats

# 특정 컨테이너 로그
docker compose -f docker-compose.pi.yml logs -f backend
```

### 리소스 사용량 예상치 (4GB RAM 기준)
| 서비스 | 메모리 | CPU |
|--------|--------|-----|
| PostgreSQL | ~256MB | 0.5 |
| Backend | ~300MB | 0.75 |
| Frontend | ~64MB | 0.25 |
| **합계** | **~620MB** | **1.5** |

---

## 문제 해결

### 메모리 부족 오류
```bash
# Swap 사용량 확인
free -h

# Swap 추가 (2GB)
sudo dphys-swapfile swapoff
sudo sed -i 's/CONF_SWAPSIZE=.*/CONF_SWAPSIZE=2048/' /etc/dphys-swapfile
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

### 컨테이너 시작 실패
```bash
# 로그 확인
docker compose -f docker-compose.pi.yml logs backend

# 컨테이너 재빌드
docker compose -f docker-compose.pi.yml up -d --build --force-recreate
```

### 데이터베이스 연결 실패
```bash
# PostgreSQL 컨테이너 상태 확인
docker logs gagisiro-db

# 데이터 디렉토리 권한 확인
ls -la data/postgres
```

---

## 일일 운영

### 백업
```bash
# 수동 백업
./scripts/backup-db.sh

# Cron으로 자동 백업 설정 (매일 새벽 3시)
crontab -e
# 추가: 0 3 * * * /home/pi/projects/gagisiro/scripts/backup-db.sh
```

### 로그 관리
```bash
# 로그 확인
docker compose -f docker-compose.pi.yml logs --tail=100 backend

# Docker 로그 정리
docker system prune -f
```

### 업데이트
```bash
# Git Pull
git pull origin main

# 재빌드 및 재시작
docker compose -f docker-compose.pi.yml up -d --build
```

---

## 보안 체크리스트

- [ ] 강력한 POSTGRES_PASSWORD 설정 (16자 이상)
- [ ] 강력한 JWT_SECRET 설정 (32자 이상)
- [ ] ADMIN_KEY / ADMIN_DASHBOARD_PASSWORD 변경
- [ ] Tailscale Funnel로 외부 노출 (포트포워딩 불필요)
- [ ] 정기 백업 설정
- [ ] 로그 모니터링 설정

---

**작성일**: 2026-01-28
**상태**: 배포 준비 완료
