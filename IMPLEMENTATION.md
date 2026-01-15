# 출퇴근길 익명 채팅 - 구현 문서

## 프로젝트 개요

서울 지하철 호선별 익명 채팅 플랫폼으로, 기존 게시판 형태에서 실시간 채팅방 형태로 전환되었습니다.

- **프론트엔드**: React 18 (Vercel 배포)
- **백엔드**: Node.js + Express (Railway 배포)
- **데이터베이스**: PostgreSQL (Railway)
- **인증**: 카카오 OAuth 2.0 + 익명 로그인 (UUID)

---

## 주요 변경사항

### 1. 로그인 시스템 개편

#### 변경 전
- 비로그인 상태에서도 게시물 작성 가능
- 선택적 로그인

#### 변경 후
- **필수 로그인**: 모든 서비스 이용 전 로그인 필요
- **2가지 로그인 방식**:
  1. **익명 로그인**: 랜덤 UUID + 닉네임 자동 생성 (예: "활기찬 통근러123")
  2. **카카오 로그인**: Kakao OAuth 연동

#### 구현 세부사항

**익명 로그인**
- UUID v4 기반 고유 ID 생성 (`anon_xxxxx`)
- 랜덤 닉네임 생성 (형용사 + 명사 + 숫자)
- localStorage에 세션 저장
- 메시지 삭제 권한 없음

**카카오 로그인**
- REST API Key 기반 OAuth 2.0
- JWT 토큰 발급 (30일 유효)
- 사용자 정보 DB 저장 (users 테이블)
- 본인 메시지 삭제 가능

**인증 플로우**
```
1. 사용자 접속 → 로그인 페이지로 리다이렉트
2. 로그인 방식 선택
3. 인증 완료 → 홈페이지로 이동
4. 호선 선택 → 채팅방 입장
```

---

### 2. UI/UX 대전환: 게시판 → 채팅방

#### 변경 전
- 게시판 형태 (게시물 + 댓글)
- 페이지네이션
- 게시물 상세 페이지
- 댓글 기능

#### 변경 후
- 메신저 스타일 채팅방
- 최근 100개 메시지 로드
- 실시간 자동 스크롤
- 5초 폴링 업데이트
- 댓글 기능 완전 제거

#### UI 변경사항

**메시지 표시**
- 말풍선 디자인
- 시간 표시 (HH:MM 형식)
- 삭제 버튼 (카카오 로그인 사용자만)

**입력 영역**
- Sticky bottom 고정
- Enter: 전송
- Shift + Enter: 줄바꿈
- Textarea 자동 리사이즈

**반응형 디자인**
- 모바일 우선 설계
- 터치 친화적 UI
- 가독성 최적화

---

### 3. 접근 제어 시스템

#### Protected Routes
```javascript
/ (홈) → 로그인 없이 접근 가능 (호선 목록만 표시)
/line/:lineId → 로그인 필수 (채팅방)
/login → 로그인 페이지
/auth/kakao/success → 카카오 콜백
```

#### 비로그인 사용자 차단
- 호선 버튼 클릭 시 자동으로 로그인 페이지로 리다이렉트
- 채팅방 URL 직접 접근 차단
- localStorage 기반 세션 검증

---

### 4. 리팩토링 및 안정성 강화 (v2.1)

#### Frontend Refactoring
- **Custom Hooks 도입**: `LinePage.jsx`의 비대해진 로직을 분리
  - `useChatSocket`: Socket.IO 연결 및 메시지 동기화
  - `useChatScroll`: 스크롤 위치 관리 및 자동 스크롤
  - `useSwipeReply`: 모바일 스와이프 답장 제스처
- **유지보수성 향상**: 컴포넌트 라인 수 60% 감소 (800줄 → 300줄)

#### Backend Testing
- **Integration Test 추가**: `supertest` 기반 통합 테스트 구축
- **안정성 확보**: 핵심 비즈니스 로직(`postController`)에 대한 검증 자동화
- **버그 수정**: 테스트 과정에서 발견된 잠재적 서버 에러(ReferenceError) 수정

---

## 기술 스택 및 아키텍처

### Frontend

**핵심 라이브러리**
- React 18.3.1
- React Router v6
- Axios (HTTP 클라이언트)
- UUID v4 (익명 사용자 ID)

**상태 관리**
- React Context API (AuthContext)
- localStorage (세션 지속성)

**주요 컴포넌트**
```
App.js
├── LoginPage.js          # 로그인 선택
├── KakaoCallback.js      # 카카오 콜백 처리
├── HomePage.js           # 호선 목록 (비로그인 접근 가능)
├── LinePage.js           # 채팅방 (로그인 필수)
└── AuthButton.js         # 로그인/로그아웃 버튼
```

**API 서비스**
```
services/
├── api.js                # 게시물/호선 API
└── authAPI.js            # 인증 API
```

### Backend

**핵심 모듈**
- Express 4.18.2
- PostgreSQL (pg 8.11.3)
- JWT (jsonwebtoken 9.0.3)
- Axios (카카오 API 통신)

**라우트 구조**
```
/api/auth/kakao           → 카카오 인증 URL 생성
/api/auth/kakao/callback  → 카카오 콜백 처리
/api/auth/me              → 현재 사용자 정보
/api/subway-lines         → 호선 목록
/api/posts/line/:lineId   → 호선별 메시지 조회
/api/posts                → 메시지 작성
/api/posts/:postId        → 메시지 삭제
```

**미들웨어**
- CORS (Vercel 도메인 허용)
- Helmet (보안 헤더)
- Rate Limiting (API 남용 방지)
- Validation (입력 검증)

### Database

**테이블 구조**

**users** (카카오 로그인 사용자)
```sql
id              SERIAL PRIMARY KEY
kakao_id        BIGINT UNIQUE NOT NULL
nickname        VARCHAR(100) NOT NULL
created_at      TIMESTAMP DEFAULT NOW()
last_login_at   TIMESTAMP DEFAULT NOW()
```

**subway_lines** (호선 정보)
```sql
id              SERIAL PRIMARY KEY
line_number     VARCHAR(10) UNIQUE NOT NULL
line_name       VARCHAR(50) NOT NULL
color           VARCHAR(20)
```

**posts** (메시지)
```sql
id              SERIAL PRIMARY KEY
line_id         INTEGER REFERENCES subway_lines(id)
user_id         INTEGER REFERENCES users(id) ON DELETE SET NULL
content         TEXT NOT NULL
created_at      TIMESTAMP DEFAULT NOW()
```

**인덱스**
```sql
idx_users_kakao_id     ON users(kakao_id)
idx_posts_line_id      ON posts(line_id)
idx_posts_user_id      ON posts(user_id)
idx_posts_created_at   ON posts(created_at)
```

---

## 배포 환경

### Vercel (Frontend)

**환경변수**
```
REACT_APP_API_URL=https://subway-board-production.up.railway.app
```

**빌드 설정**
- Build Command: `npm run build`
- Output Directory: `build`
- Install Command: `npm install`

**도메인**
- Production: https://subway-board.vercel.app

### Railway (Backend + Database)

**환경변수**
```
NODE_ENV=production
DATABASE_URL=<PostgreSQL Connection String>
KAKAO_REST_API_KEY=15b5d3081873a0dbc0e056a486224b9f
KAKAO_REDIRECT_URI_PROD=https://subway-board-production.up.railway.app/api/auth/kakao/callback
FRONTEND_URL=https://subway-board.vercel.app
JWT_SECRET=<생성된 시크릿>
```

**시작 스크립트**
```bash
npm run migrate:safe && npm run migrate:kakao:safe && node src/index.js
```

**도메인**
- Backend API: https://subway-board-production.up.railway.app

---

## 카카오 개발자 설정

### 앱 키
- REST API Key: `15b5d3081873a0dbc0e056a486224b9f`

### 카카오 로그인
- **활성화 상태**: ON
- **Client Secret**: 비활성화 (선택사항)

### Redirect URI
```
로컬: http://localhost:5000/api/auth/kakao/callback
프로덕션: https://subway-board-production.up.railway.app/api/auth/kakao/callback
```

---

## 보안 설정

### CORS 정책
```javascript
allowedOrigins: [
  'http://localhost:3000',
  'https://subway-board.vercel.app'
]
```

### JWT 설정
- 알고리즘: HS256
- 유효기간: 30일
- 시크릿: 환경변수로 관리

### Rate Limiting
- 창 크기: 15분
- 최대 요청: 100회/IP

### 입력 검증
- 메시지 길이: 1-1000자
- XSS 방지
- SQL Injection 방지

---

## 주요 기능 플로우

### 1. 익명 로그인
```
1. "익명으로 시작하기" 클릭
2. UUID + 랜덤 닉네임 생성
3. localStorage 저장
4. 홈페이지로 리다이렉트
```

### 2. 카카오 로그인
```
1. "카카오로 시작하기" 클릭
2. 백엔드에서 카카오 인증 URL 생성
3. 카카오 로그인 페이지로 리다이렉트
4. 사용자 로그인 승인
5. 백엔드 콜백 처리
   - 액세스 토큰 받기
   - 사용자 정보 조회
   - DB에 저장/업데이트
   - JWT 발급
6. 프론트엔드 /auth/kakao/success?token=xxx 리다이렉트
7. 토큰 저장 후 홈페이지 이동
```

### 3. 채팅방 입장
```
1. 호선 버튼 클릭
2. 인증 상태 확인
   - 비로그인: /login으로 리다이렉트
   - 로그인: 채팅방 입장
3. 최근 100개 메시지 로드
4. 5초마다 새 메시지 폴링
5. 자동 스크롤 (새 메시지 도착 시)
```

### 4. 메시지 작성
```
1. 메시지 입력 (1-1000자)
2. Enter 또는 전송 버튼 클릭
3. API 요청 (익명: user_id=null, 카카오: user_id 포함)
4. 성공 시 메시지 목록 새로고침
5. 자동 스크롤
```

### 5. 메시지 삭제
```
1. 삭제 버튼 클릭 (카카오 로그인 사용자만 표시)
2. 본인 메시지 확인
3. DB에서 삭제
4. 메시지 목록 새로고침
```

---

## 파일 구조

### Frontend
```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   └── AuthButton.js
│   ├── contexts/
│   │   └── AuthContext.js
│   ├── pages/
│   │   ├── HomePage.js
│   │   ├── LinePage.js
│   │   ├── LoginPage.js
│   │   └── KakaoCallback.js
│   ├── services/
│   │   ├── api.js
│   │   └── authAPI.js
│   ├── App.js
│   ├── App.css
│   └── index.js
├── .env
└── package.json
```

### Backend
```
backend/
├── src/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── postController.js
│   │   ├── commentController.js
│   │   └── subwayLineController.js
│   ├── db/
│   │   ├── connection.js
│   │   ├── migrate.js
│   │   ├── migrate-kakao.js
│   │   ├── cleanup.js
│   │   └── migrations/
│   │       ├── create-tables.sql
│   │       └── add-kakao-login.sql
│   ├── middleware/
│   │   └── validator.js
│   ├── routes/
│   │   └── index.js
│   └── index.js
├── .env
└── package.json
```

---

## 환경별 설정

### 로컬 개발
```bash
# Backend
cd backend
npm install
npm run dev  # nodemon으로 자동 재시작

# Frontend
cd frontend
npm install
npm start  # http://localhost:3000
```

### 프로덕션 배포
```bash
# 코드 푸시
git add .
git commit -m "Update message"
git push

# 자동 배포
- Vercel: GitHub 푸시 감지 → 자동 빌드 & 배포
- Railway: GitHub 푸시 감지 → 자동 빌드 & 배포
```

---

## 데이터베이스 마이그레이션

### 초기 마이그레이션
```sql
-- subway_lines, posts, comments 테이블 생성
npm run migrate
```

### 카카오 로그인 마이그레이션
```sql
-- users 테이블 생성
-- posts, comments에 user_id 컬럼 추가
npm run migrate:kakao
```

### Railway에서 실행
```bash
railway run node src/db/migrate-kakao.js
```

또는 Railway 웹 콘솔에서 직접 SQL 실행

---

## 트러블슈팅

### API 경로 중복 문제 (`/api/api/...`)
**원인**: baseURL과 엔드포인트 경로 중복
**해결**:
- `api.js`, `authAPI.js`에서 `baseURL = API_URL` (끝에 `/api` 제거)
- 각 API 호출에 `/api` 접두사 추가

### 카카오 로그인 401 에러
**원인**: Client Secret 활성화 또는 Redirect URI 불일치
**해결**:
- 카카오 개발자 콘솔에서 Client Secret 비활성화
- Redirect URI 정확히 등록

### 프로덕션에서 localhost 리다이렉트
**원인**: `NODE_ENV=production` 미설정
**해결**: Railway 환경변수에 `NODE_ENV=production` 추가

### 데이터베이스 연결 실패
**원인**: 로컬 PostgreSQL 비밀번호 불일치
**해결**: `.env`에서 `DATABASE_URL`을 Railway Public URL로 변경

---

## 성능 최적화

### 프론트엔드
- 메시지 로드 제한 (최근 100개)
- 5초 폴링 (Page Visibility API 활용)
- 컴포넌트 메모이제이션 (필요시)
- 이미지 없음 (텍스트 전용)

### 백엔드
- DB 인덱스 최적화
- Connection Pooling
- Rate Limiting
- GZIP 압축

### 데이터베이스
- 인덱스: line_id, user_id, created_at
- 자동 정리: 매일 자정 오래된 메시지 삭제

---

## 향후 개선 사항

### 기능
- [ ] WebSocket 실시간 통신
- [ ] 메시지 좋아요/신고 기능
- [ ] 사용자 프로필 (카카오 로그인)
- [ ] 메시지 검색
- [ ] 이미지/이모지 지원

### 성능
- [ ] Redis 캐싱
- [ ] CDN 적용
- [ ] 무한 스크롤
- [ ] 메시지 가상화

### 보안
- [ ] HTTPS 강제
- [ ] CSRF 토큰
- [ ] XSS 필터링 강화
- [ ] Rate Limiting 세분화

---

## Git 커밋 히스토리

```
f2d1721 - Use production env variables for Kakao OAuth in production
d43887f - Fix API paths - add /api prefix to all endpoints
f193e84 - Fix routing and API path issues
e101c98 - Add Kakao migration to start script for automatic Railway deployment
4e129ae - Transform bulletin board to chat-based anonymous messaging system
df3e9ab - Redesign main page for first-time user experience
HEAD    - Refactor LinePage to hooks & Add backend integration tests
```

---

## 연락처 및 지원

- **GitHub Repository**: https://github.com/doublesilver/subway-board
- **프론트엔드**: https://subway-board.vercel.app
- **백엔드 API**: https://subway-board-production.up.railway.app

---

**문서 작성일**: 2025-12-30
**마지막 업데이트**: 2025-12-30
**버전**: 2.0.0 (채팅 시스템 전환)
