# 바톤터치 문서 (Progress)

## 목적
Codex 또는 다른 AI 에이전트가 즉시 이어서 작업할 수 있도록 현재 상태와 맥락을 요약한다.

## 최근 변경 요약 (2026-01-28)

### 라즈베리파이 서버 이전 준비
- **Docker 환경 구축**:
  - `backend/Dockerfile`: Node.js 22 Alpine 기반 멀티스테이지 빌드
  - `frontend/Dockerfile`: Vite 빌드 → Nginx 서빙
  - `frontend/nginx.conf`: SPA 라우팅, 보안 헤더, gzip 설정
  - `docker-compose.pi.yml`: PostgreSQL + Backend + Frontend 통합
  - `.env.pi.example`: 라즈베리파이용 환경변수 템플릿

- **배포 스크립트**:
  - `scripts/deploy-pi.sh`: 자동 배포 (환경변수 검증, 빌드, 헬스체크)
  - `scripts/backup-db.sh`: PostgreSQL 백업 (7일 보관)
  - `scripts/monitor.sh`: 리소스 모니터링 (CPU, 메모리, 컨테이너 상태)

- **보안 점검**:
  - `.gitignore` 업데이트 (민감 파일 추가)
  - 불필요 파일 정리 (temp_downloads/, nul 등)
  - 보안 평가 보고서 작성 (`PROJECT_HEALTH_REPORT.md`)

- **문서화**:
  - `RASPBERRY_PI_DEPLOY_GUIDE.md`: Tailscale Funnel 배포 가이드
  - `PROJECT_HEALTH_REPORT.md`: 프로젝트 건강상태 평가 (72/100)
  - README.md 업데이트 (배포 방법 섹션 추가)

### 보안 이슈 (즉시 조치 필요)
- **CRITICAL**: backend/.env에 실제 API 키 노출됨
  - OpenAI, Gemini, Kakao API 키 재생성 필요
  - Railway DB 비밀번호 변경 필요
  - JWT_SECRET, ADMIN_KEY 재생성 필요
- **CRITICAL**: client_secret_*.json, token.json 파일 제거 필요

---

## 이전 변경 요약 (2026-01-22)

### 정식 운영 전환
- **운영 시간**: 평일 07:00 ~ 09:00 (테스트 모드 제거)
- **데이터 삭제**: 매일 09:00 KST (운영 종료 시점)
  - 삭제 대상: `posts`, `comments` (채팅 메시지)
  - 보존 대상: `daily_visits`, `hourly_visits`, `unique_visitors`, `feedback`
- **비운영시간 모달**: 테스트 입장 버튼 제거, 정식 안내 메시지로 변경
- **관리자 24시간 접속**: 대시보드 로그인 시 `admin_mode` 활성화

### 코드 품질 개선 (2026-01-21)
- 환경변수 검증 모듈 추가 (`validateEnv.js`)
- API 응답 헬퍼 유틸리티 추가 (`response.js`)
- DB 커넥션 풀 설정 상수화
- 로깅 구조화 개선 (JSON 포맷)
- 프론트엔드 테스트 환경 구축 (Vitest)
- `useChatSocket`, `useChatScroll` 훅 테스트 추가

### 자동화 및 문서화 (채용 준비)
- **CI/CD 파이프라인 구축**: GitHub Actions (`main.yml`) 성공.
    - `npm test` 자동화 및 DB 서비스 컨테이너 통합 완료.
    - Timezone 이슈 해결 (`operatingHours` 테스트).
- **API 문서화**: Swagger (`swagger-jsdoc`) 설정 및 주요 엔드포인트 문서화 완료.
- **포트폴리오 검토**: `PORTFOLIO_REVIEW.md` 작성 및 피드백 반영.
- **프로젝트 정리 (Cleanliness)**: 불필요한 파일(로그, 임시 스크립트) 삭제 및 코드 정리(`console.log`, `TODO`).

### 관리자 대시보드 구현 (2026-01-20)
- `/admin` 경로로 접속 가능한 관리자 대시보드 추가
- 비밀번호 + IP 화이트리스트 이중 보안
- JWT 기반 인증 (24시간 유효)
- 차트 라이브러리: recharts
- 기능: DAU/WAU/MAU, 호선별 통계, 시간대별 분석, 커스텀 SQL 쿼리
- 전체 UI 한글화 완료

### 방문자 통계 DB 고도화
- 인메모리 캐시 → DB 기반 중복체크로 변경 (서버 재시작 대응)
- `hourly_visits` 테이블: 시간대별/호선별 방문 집계
- `unique_visitors` 테이블: DAU/WAU/MAU + 재방문율 계산
- `visitController.js` 전면 개편

### 문서화
- `docs/ADMIN_DASHBOARD_GUIDE.md`: 대시보드 사용 가이드 (커스텀 쿼리 포함)

### 기존 변경 (2026-01-19)
- README.md 전면 업데이트
- 답장(reply) 저장/표시 적용
- 입장/퇴장 시스템 메시지 개선
- 말풍선 색상 통일

## 배포 상태
- **클라우드 (현재)**: Vercel + Railway
- **자체 서버 (준비 완료)**: Raspberry Pi 4 + Docker + Tailscale Funnel
- `https://www.gagisiro.com/` 200 OK

### 라즈베리파이 배포 준비 파일
| 파일 | 설명 |
|------|------|
| `docker-compose.pi.yml` | 전체 서비스 오케스트레이션 |
| `backend/Dockerfile` | Backend API 이미지 |
| `frontend/Dockerfile` | Frontend Nginx 이미지 |
| `.env.pi.example` | 환경변수 템플릿 |
| `scripts/deploy-pi.sh` | 자동 배포 스크립트 |
| `RASPBERRY_PI_DEPLOY_GUIDE.md` | 배포 가이드 |

## 환경변수 (Railway)
```
# 필수
DATABASE_URL                     # PostgreSQL 연결 문자열
ADMIN_KEY                        # 기존 관리자 API 키
ADMIN_DASHBOARD_PASSWORD         # 대시보드 로그인 비밀번호

# 선택
ADMIN_IP_WHITELIST=IP1,IP2       # IP 화이트리스트 (CIDR 지원)
ADMIN_JWT_SECRET                 # JWT 시크릿 (미설정시 ADMIN_KEY 사용)
```

## 현재 이슈/주의
- 카카오 로그인: 뼈대만 구현됨, 실제 동작 안함
- **운영시간**: 평일 07:00~09:00 (정식 운영 중)
- **관리자 접속**: `/admin` 로그인 후 24시간 접속 가능

## 다음 작업 후보
- **즉시**: API 키 재생성 및 Git 이력 정리
- **라즈베리파이 배포**: 실제 배포 테스트 및 검증
- 대시보드 추가 기능 (실시간 모니터링, 알림 등)
- 모바일 대시보드 최적화
- AI Agent 포트폴리오 프로젝트 (RAG, MCP 등)

## 주요 파일

### 프론트엔드
| 파일 | 설명 |
|------|------|
| `frontend/src/App.jsx` | 라우팅 설정 |
| `frontend/src/App.css` | 글로벌 스타일 |
| `frontend/src/pages/HomePage.jsx` | 호선 선택 화면 |
| `frontend/src/pages/LinePage.jsx` | 채팅방 화면 |
| `frontend/src/pages/AdminDashboard.jsx` | 관리자 대시보드 |
| `frontend/src/services/api.js` | API/대시보드 axios 인스턴스 |
| `frontend/src/hooks/useChatSocket.js` | 소켓 연결/메시지 관리 |

### 백엔드
| 파일 | 설명 |
|------|------|
| `backend/src/index.js` | 서버 엔트리포인트 |
| `backend/src/routes/index.js` | 모든 API 라우트 정의 |
| `backend/src/controllers/dashboardController.js` | 대시보드 API (JWT, 통계, 쿼리) |
| `backend/src/controllers/visitController.js` | 방문 통계 기록 |
| `backend/src/controllers/postController.js` | 게시글 CRUD |
| `backend/src/middleware/adminMiddleware.js` | IP 화이트리스트, 비밀번호 검증 |
| `backend/src/db/schema.sql` | DB 테이블 정의 |
| `backend/src/utils/scheduler.js` | 09시 데이터 삭제 스케줄러 |

### 문서
| 파일 | 설명 |
|------|------|
| `.ai/PROGRESS.md` | 이 파일 (바톤터치) |
| `.ai/ARCHITECTURE.md` | 프로젝트 구조 |
| `docs/ADMIN_DASHBOARD_GUIDE.md` | 대시보드 사용 가이드 |
| `RESTORE.md` | 테스트→정식 운영 전환 가이드 |
| `README.md` | 프로젝트 메인 문서 |

## 토큰 사용량 최적화 가이드

### AI 에이전트 작업 시 권장 사항
1. **파일 읽기 최소화**: 전체 파일 대신 필요한 부분만 읽기 (offset/limit 활용)
2. **Glob 먼저, Read 나중에**: 파일 구조 파악 후 필요한 파일만 읽기
3. **병렬 실행 활용**: 독립적인 작업은 동시 실행
4. **컨텍스트 활용**: 이전에 읽은 파일 내용 재활용

### 자주 참조하는 파일 요약
- `backend/src/routes/index.js`: 모든 API 엔드포인트 정의
- `frontend/src/App.jsx`: 프론트엔드 라우팅 구조
- `backend/src/db/schema.sql`: DB 테이블 구조
- `docs/ADMIN_DASHBOARD_GUIDE.md`: 대시보드 커스텀 쿼리 예시

### 작업 패턴
```
1. PROGRESS.md 읽기 → 현재 상태 파악
2. ARCHITECTURE.md 참고 → 파일 구조 파악
3. 필요한 파일만 선별적 읽기
4. 작업 완료 후 PROGRESS.md 업데이트
```

## DB 테이블 요약

| 테이블 | 설명 | 주요 컬럼 |
|--------|------|----------|
| `subway_lines` | 호선 정보 (1-9호선) | id, line_number, line_name, color |
| `posts` | 게시글 | id, subway_line_id, content, reply_to, created_at |
| `comments` | 댓글 | id, post_id, content, created_at |
| `feedback` | 피드백 | id, content, created_at |
| `daily_visits` | 일별 호선별 방문 | visit_date, subway_line_id, visit_count |
| `hourly_visits` | 시간대별 방문 | visit_date, visit_hour, subway_line_id, visit_count |
| `unique_visitors` | 고유 방문자 | visitor_hash, visit_date, first_line_id, lines_visited |
