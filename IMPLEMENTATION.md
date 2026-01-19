# 출퇴근길 익명 채팅 - 구현 문서

## 프로젝트 개요

서울 지하철 호선별 익명 채팅 플랫폼으로, 실시간 채팅방 형태의 커뮤니티 서비스입니다.

- **프론트엔드**: React 19 + Vite 6 (Vercel 배포)
- **백엔드**: Node.js 22 + Express 5 (Railway 배포)
- **데이터베이스**: PostgreSQL 16 (Railway)
- **실시간 통신**: Socket.IO

---

## 주요 기능

### 1. 익명 로그인 시스템

- **익명 로그인**: 랜덤 UUID + 닉네임 자동 생성 (예: "활기찬 통근러123")
- UUID v4 기반 고유 ID 생성
- localStorage/sessionStorage에 세션 저장
- HMAC-SHA256 서명으로 익명 ID 사칭 방지

### 2. 실시간 채팅

- Socket.IO 기반 실시간 양방향 통신
- 호선별 독립 채팅방 (1~9호선)
- 실시간 접속자 수 표시
- 입장/퇴장 시스템 메시지
- 답장(Reply) 기능 지원

### 3. 운영 시간 제어

- 평일 07:00~09:00만 운영 (베타 기간 24시간)
- 클라이언트/서버 이중 검증
- 비운영 시간 안내 모달

### 4. 자동 데이터 정리

- 매일 자정(00:00) 모든 메시지 자동 삭제
- node-cron 기반 스케줄링

### 5. 콘텐츠 필터링

- 비속어 자동 필터링
- XSS 방지 처리

---

## 기술 스택

### Frontend

| 기술 | 버전 | 용도 |
|------|------|------|
| React | 19.2 | UI 프레임워크 |
| Vite | 6.0 | 빌드 도구 |
| React Router | 7.11 | SPA 라우팅 |
| Socket.IO Client | 4.8 | 실시간 통신 |
| Axios | 1.13 | HTTP 클라이언트 |

### Backend

| 기술 | 버전 | 용도 |
|------|------|------|
| Node.js | 22 LTS | 런타임 |
| Express | 5.0 | 웹 프레임워크 |
| Socket.IO | 4.8 | 실시간 통신 |
| PostgreSQL | 16 | 데이터베이스 |
| Helmet | 8.0 | 보안 헤더 |
| Winston | 3.19 | 로깅 |
| node-cron | 3.0 | 스케줄링 |

### Infrastructure

| 서비스 | 용도 |
|--------|------|
| Vercel | 프론트엔드 배포, CDN |
| Railway | 백엔드 + PostgreSQL 호스팅 |

---

## 프로젝트 구조

### Frontend
```
frontend/
├── src/
│   ├── components/       # 재사용 컴포넌트
│   │   ├── ClosedAlertModal.jsx
│   │   ├── FeedbackModal.jsx
│   │   └── Toast.jsx
│   ├── contexts/         # React Context
│   │   └── AuthContext.jsx
│   ├── hooks/            # 커스텀 훅
│   │   ├── useChatSocket.js
│   │   ├── useChatScroll.js
│   │   └── useSwipeReply.js
│   ├── pages/            # 페이지 컴포넌트
│   │   ├── HomePage.jsx
│   │   └── LinePage.jsx
│   ├── services/         # API 서비스
│   │   └── api.js
│   └── utils/            # 유틸리티
│       ├── operatingHours.js
│       ├── socket.js
│       └── temporaryUser.js
├── index.html
└── vite.config.js
```

### Backend
```
backend/
├── src/
│   ├── config/           # 설정
│   │   └── constants.js
│   ├── controllers/      # 컨트롤러
│   │   ├── postController.js
│   │   ├── feedbackController.js
│   │   └── visitController.js
│   ├── db/               # 데이터베이스
│   │   ├── connection.js
│   │   ├── schema.sql
│   │   └── migrate.js
│   ├── middleware/       # 미들웨어
│   │   ├── checkOperatingHours.js
│   │   ├── authMiddleware.js
│   │   └── validator.js
│   ├── routes/           # API 라우트
│   │   └── index.js
│   └── utils/            # 유틸리티
│       ├── scheduler.js
│       ├── activeUsers.js
│       ├── profanityFilter.js
│       └── logger.js
├── tests/                # 테스트
└── index.js
```

---

## API 엔드포인트

### 호선
```
GET  /api/subway-lines          # 호선 목록
```

### 메시지
```
GET  /api/posts/line/:lineId    # 호선별 메시지 조회
POST /api/posts                 # 메시지 작성
POST /api/posts/join            # 입장 시스템 메시지
POST /api/posts/leave           # 퇴장 시스템 메시지
DELETE /api/posts/:postId       # 메시지 삭제
```

### 피드백
```
POST /api/feedback              # 피드백 제출
```

### 통계
```
POST /api/visits                # 방문 기록
```

### 헬스체크
```
GET  /health                    # 서버 상태 확인
```

---

## 보안 설정

### Rate Limiting
- 쓰기 작업: 15분당 50회
- 읽기 작업: 1분당 100회

### 입력 검증
- 메시지 길이: 1-1000자
- XSS 방지 (xss 라이브러리)
- SQL Injection 방지 (Parameterized Query)

### 인증
- 익명 세션: HMAC-SHA256 서명 검증
- Admin 엔드포인트: 키 기반 인증

---

## 배포 환경

### Vercel (Frontend)
```
VITE_API_URL=https://api.gagisiro.com
```

### Railway (Backend)
```
NODE_ENV=production
DATABASE_URL=<PostgreSQL Connection String>
PORT=5000
```

---

## 개발 환경 실행

```bash
# Backend
cd backend
cp .env.example .env
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

---

**문서 작성일**: 2026-01-19
**버전**: 3.0

---

## 최근 변경 (2026-01-19)

- 피드백 모달을 Portal로 렌더링하여 헤더 레이아웃 영향을 제거하고 다크 테마와 통일된 스타일 적용.
- 메시지 전송 시 낙관적 UI는 유지하되, 서버 메시지 도착 시 교체 방식으로 화면 흔들림 최소화.
- 입력 검증에서 HTML 태그만 차단하고 기호 조합(예: `>ㅁ<`)은 허용.

- ??? ??? ?? `client_id` ???? ??? ??? ??? ?? ? ??? ??.

- ?? ???? HTML ??? ????, ?? ??? ?? ??? ???? ??.
