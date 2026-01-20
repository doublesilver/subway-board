# Project Architecture

## Directory Map
```
/
├─ backend/
│  ├─ package.json
│  ├─ Procfile
│  ├─ railway.json
│  ├─ src/
│  │  ├─ index.js              # 서버 엔트리포인트
│  │  ├─ routes/
│  │  │  └─ index.js           # API 라우트 정의
│  │  ├─ controllers/
│  │  │  ├─ postController.js
│  │  │  ├─ feedbackController.js
│  │  │  ├─ visitController.js
│  │  │  ├─ dashboardController.js  # 관리자 대시보드 API
│  │  │  └─ subwayLineController.js
│  │  ├─ middleware/
│  │  │  ├─ authMiddleware.js
│  │  │  ├─ checkOperatingHours.js
│  │  │  ├─ validator.js
│  │  │  └─ adminMiddleware.js
│  │  ├─ config/
│  │  │  └─ constants.js       # Rate limit, 콘텐츠 제한 등
│  │  ├─ utils/
│  │  │  ├─ socket.js          # Socket.IO 초기화
│  │  │  ├─ activeUsers.js     # 접속자 추적
│  │  │  ├─ scheduler.js       # node-cron 스케줄러
│  │  │  ├─ profanityFilter.js # 비속어 필터링
│  │  │  ├─ logger.js          # Winston 로깅
│  │  │  └─ AppError.js
│  │  └─ db/
│  │     ├─ connection.js      # PostgreSQL 연결
│  │     ├─ schema.sql         # DB 스키마
│  │     └─ migrate.js         # 마이그레이션
│  └─ tests/
│
├─ frontend/
│  ├─ package.json
│  ├─ vite.config.js
│  ├─ index.html
│  ├─ public/
│  └─ src/
│     ├─ index.jsx             # React 엔트리포인트
│     ├─ App.jsx               # 라우터 설정
│     ├─ App.css               # 글로벌 스타일
│     ├─ pages/
│     │  ├─ HomePage.jsx       # 호선 선택
│     │  ├─ LinePage.jsx       # 채팅방
│     │  ├─ AdminDashboard.jsx # 관리자 대시보드
│     │  ├─ PreviewHome.jsx    # 미리보기 홈
│     │  └─ PreviewChat.jsx    # 미리보기 채팅
│     ├─ components/
│     │  ├─ ClosedAlertModal.jsx
│     │  ├─ FeedbackModal.jsx
│     │  ├─ SessionExpiredModal.jsx
│     │  └─ Toast.jsx
│     ├─ hooks/
│     │  ├─ useChatSocket.js   # 소켓 연결/메시지 관리
│     │  ├─ useChatScroll.js   # 스크롤 동작
│     │  ├─ useSwipeReply.js   # 스와이프 답장
│     │  └─ useToast.jsx       # 토스트 알림
│     ├─ contexts/
│     │  └─ AuthContext.jsx    # 인증 상태 관리
│     ├─ services/
│     │  └─ api.js             # Axios 인스턴스
│     ├─ utils/
│     │  ├─ socket.js          # Socket.IO 클라이언트
│     │  ├─ operatingHours.js  # 운영시간 체크
│     │  └─ temporaryUser.js   # 세션 스토리지 관리
│     └─ config/
│        └─ constants.js       # API URL, 타임아웃 등
│
├─ designs/                    # UI 디자인 목업
├─ docs/
│  └─ ADMIN_DASHBOARD_GUIDE.md # 대시보드 사용 가이드
├─ assets/                     # 정적 에셋
├─ logs/                       # 애플리케이션 로그
│
├─ .ai/                        # AI 에이전트용 문서
│  ├─ ARCHITECTURE.md          # 이 파일
│  ├─ PROGRESS.md              # 바톤터치 문서
│  └─ RULES.md                 # 코딩 규칙
│
├─ README.md                   # 메인 문서
├─ IMPLEMENTATION.md           # 구현 상세
├─ PRODUCT_SPEC.md             # 기획 명세
├─ DESIGN_SYSTEM.md            # 디자인 시스템
├─ RESTORE.md                  # 테스트→정식 원복 가이드
├─ vercel.json                 # Vercel 설정
└─ railway.json                # Railway 설정
```

## Data Flow
1. Client(React) → `frontend/src/services/api.js` / `socket.js`
2. Backend(Express) → `backend/src/routes/index.js` → controllers
3. DB(PostgreSQL) → `backend/src/db/connection.js`
4. 실시간 업데이트 → Socket.IO → 클라이언트 상태 반영

## DB Notes
- `posts.reply_to` 컬럼: 답장 대상 메시지 참조
- `posts.message_type`: 'user' | 'system' (입장/퇴장)
- 매일 자정(00:00) 자동 삭제 (scheduler.js)

### 통계 테이블
- `hourly_visits`: 시간대별/호선별 방문 집계 (UPSERT 패턴)
- `unique_visitors`: 고유 방문자 기록 (visitor_hash + visit_date 유니크)
- `daily_visits`: 일별 호선별 방문 통계

## Admin Dashboard
- 경로: `/admin`
- 인증: 비밀번호 + IP 화이트리스트 + JWT (24시간)
- 기능: DAU/WAU/MAU, 호선별 통계, 시간대별 분석, 커스텀 SQL
- 차트: recharts 라이브러리

### 환경변수 (Railway)
```
ADMIN_DASHBOARD_PASSWORD  # 대시보드 로그인 비밀번호
ADMIN_IP_WHITELIST        # (옵션) 허용 IP 목록 (콤마 구분, CIDR 지원)
ADMIN_JWT_SECRET          # (옵션) JWT 시크릿, 미설정시 ADMIN_KEY 사용
ADMIN_KEY                 # 기존 관리자 API 키
```

## Key Files
- Backend Entry: `backend/src/index.js`
- Routes: `backend/src/routes/index.js`
- DB Connection: `backend/src/db/connection.js`
- Frontend Entry: `frontend/src/index.jsx`
- Frontend Router: `frontend/src/App.jsx`
- Global Styles: `frontend/src/App.css`
- Deploy Config: `vercel.json`, `railway.json`

## Tech Stack
- Frontend: React 19, Vite 6, React Router 7, Socket.IO Client, recharts
- Backend: Node.js 22, Express 5, Socket.IO, PostgreSQL 16, jsonwebtoken
- Infra: Vercel (frontend), Railway (backend + DB)

## API Endpoints (주요)
```
POST /api/dashboard/login     # 대시보드 로그인 (JWT 발급)
GET  /api/dashboard/data      # 대시보드 통계 데이터
GET  /api/dashboard/raw       # 원본 테이블 데이터
POST /api/dashboard/query     # 커스텀 SQL 쿼리 (SELECT only)
POST /api/visits              # 방문 기록
GET  /api/admin/stats         # 통계 요약
```
