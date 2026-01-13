# 출퇴근길 익명 게시판 🚇

서울 지하철 호선별 출퇴근 시간대 익명 게시판 서비스

[![Deploy Status](https://img.shields.io/badge/status-live-brightgreen)](https://subway-board.vercel.app)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**🔗 Live Demo**: [https://subway-board.vercel.app](https://subway-board.vercel.app)

## 📋 프로젝트 소개

출퇴근하는 사람들을 위한 익명 게시판으로, 같은 지하철 노선을 이용하는 사람들끼리 가볍게 소통할 수 있는 공간입니다.

### 서비스 컨셉
- **익명 감성 커뮤니티**: 직장인들의 감정 해소 공간
- **완전한 익명성**: 로그인 없이 100% 사용 가능
- **휘발성 데이터**: 매일 오전 9시 모든 게시글 자동 삭제
- **심리적 안전**: 부담 없이 하루의 이야기를 나눌 수 있는 공간

## ✨ 주요 기능

### 핵심 기능
- 🚇 **호선별 게시판**: 서울 지하철 1-9호선 (주요 노선만 엄선)
- 👤 **완전 익명**: 로그인 없이 100% 사용 가능
- 🔄 **휘발성 데이터**: 매일 오전 9시 모든 데이터 자동 삭제
- 👥 **실시간 활성 사용자**: 각 호선의 현재 접속자 수 실시간 표시
- 🛡️ **비속어 필터링**: 한국어 비속어 및 성적 단어 자동 차단

### UX/UI 특징
- 📱 **모바일 최적화**: 한 손 조작에 최적화된 디자인
- 🎨 **지하철 테마 UI**: 각 노선 색상을 활용한 직관적인 디자인
- 🔵 **탭 기반 정렬**: 모바일 친화적인 탭 UI (호선 순 | 인기 순)
- ✨ **심리적 안전 강조**: 익명성과 자동 삭제를 명확히 전달
- 🌊 **펄스 애니메이션**: 활성 사용자 수에 실시간 느낌 부여

### 선택적 기능
- 🔐 **카카오 로그인** (선택적): 로그인 시 내 글 관리 기능 추가
  - 비로그인 사용자도 모든 기능 이용 가능
  - 게시글/댓글 작성자 정보는 여전히 익명 유지
  - 자세한 내용: [KAKAO_LOGIN_SETUP.md](KAKAO_LOGIN_SETUP.md)

### 보안 & 성능
- ⚡ **실시간 통신**: Socket.io를 이용한 실시간 활성 사용자 및 메시지 업데이트
- 🔒 **보안**: Helmet.js, CORS, SQL Injection 방지
- 🚦 **Rate Limiting**: POST/DELETE 요청 제한 (GET 제외)

## 🛠 기술 스택

### Frontend
- **Framework**: React 18
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Styling**: CSS3 (Custom Design)
- **Font**: Noto Sans KR
- **Hosting**: Vercel

### Backend
- **Runtime**: Node.js 14+
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: pg (node-postgres)
- **Authentication**: JWT, Kakao OAuth 2.0
- **HTTP Client**: Axios
- **Real-time**: Socket.io
- **Scheduler**: node-cron
- **Security**: Helmet, CORS, express-rate-limit
- **Hosting**: Railway

## 📁 프로젝트 구조

```
side/
├── backend/
│   ├── src/
│   │   ├── controllers/      # API 컨트롤러
│   │   │   ├── authController.js       # 카카오 OAuth
│   │   │   ├── commentController.js
│   │   │   ├── postController.js
│   │   │   └── subwayLineController.js
│   │   ├── db/               # 데이터베이스
│   │   │   ├── connection.js           # DB 연결 풀
│   │   │   ├── schema.sql              # 기본 스키마
│   │   │   ├── migrate.js              # 기본 마이그레이션
│   │   │   ├── migrate-kakao.js        # 카카오 로그인 마이그레이션
│   │   │   └── migrations/
│   │   │       └── add-kakao-login.sql # 사용자 테이블 스키마
│   │   ├── middleware/       # 미들웨어
│   │   │   └── validator.js  # 유효성 검사
│   │   ├── routes/           # API 라우트
│   │   │   └── index.js
│   │   ├── utils/            # 유틸리티
│   │   │   ├── activeUsers.js       # 실시간 활성 사용자 추적
│   │   │   ├── profanityFilter.js   # 비속어 필터
│   │   │   └── scheduler.js         # 스케줄러
│   │   └── index.js          # 서버 진입점
│   ├── package.json
│   ├── .env.example
│   └── start.sh
├── frontend/
│   ├── src/
│   │   ├── pages/            # 페이지 컴포넌트
│   │   │   ├── HomePage.js   # 호선 선택 (탭 기반 정렬)
│   │   │   ├── LinePage.js   # 게시글 목록 (심리적 안전 강조)
│   │   │   └── PostPage.js   # 게시글 상세
│   │   ├── services/         # API 서비스
│   │   │   └── api.js
│   │   ├── App.js            # 메인 컴포넌트
│   │   ├── App.css           # 스타일시트 (펄스 애니메이션 등)
│   │   └── index.js
│   ├── public/
│   ├── package.json
│   └── .env.example
├── KAKAO_LOGIN_SETUP.md      # 카카오 로그인 구현 가이드
├── vercel.json
└── README.md
```

## 🚀 빠른 시작

### 사전 요구사항
- Node.js 14 이상
- PostgreSQL 12 이상
- npm 6 이상

### 1. 레포지토리 클론

```bash
git clone https://github.com/doublesilver/subway-board.git
cd subway-board
```

### 2. PostgreSQL 데이터베이스 생성

```bash
psql -U postgres
CREATE DATABASE subway_board;
\q
```

### 3. 백엔드 설정 및 실행

```bash
cd backend

# 패키지 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 열어서 DATABASE_URL을 수정하세요
# DATABASE_URL=postgresql://postgres:your_password@localhost:5432/subway_board

# 데이터베이스 마이그레이션 실행
npm run migrate

# 개발 서버 시작
npm run dev
```

서버가 http://localhost:5000 에서 실행됩니다.

### 4. 프론트엔드 실행

새 터미널에서:

```bash
cd frontend

# 패키지 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 열어서 REACT_APP_API_URL을 수정하세요
# REACT_APP_API_URL=http://localhost:5000

# 개발 서버 시작
npm start
```

브라우저가 자동으로 http://localhost:3000 을 엽니다.

## 📡 API 엔드포인트

### 기본 정보
- **Base URL**: `http://localhost:5000` (로컬) / `https://your-backend-url.railway.app` (배포)
- **Rate Limit**: POST/DELETE 요청 15분당 50회 (GET 요청은 제한 없음)

### 인증 (Authentication)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/kakao` | 카카오 로그인 URL 받기 |
| GET | `/api/auth/kakao/callback` | 카카오 OAuth 콜백 (JWT 발급) |
| GET | `/api/auth/me` | 현재 로그인 사용자 정보 조회 |

**헤더**: `Authorization: Bearer {JWT_TOKEN}` (선택적)

### 호선
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subway-lines` | 모든 호선 조회 (1-9호선 + 활성 사용자 수) |

**Response 예시**:
```json
[
  {
    "id": 1,
    "line_name": "1호선",
    "line_number": "1",
    "color": "#0052a4",
    "activeUsers": 5
  }
]
```

### 게시글
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/posts/line/:lineId` | 호선별 게시글 목록 (페이지네이션) |
| GET | `/api/posts/:postId` | 게시글 상세 조회 |
| POST | `/api/posts` | 게시글 작성 (최대 1000자) |
| DELETE | `/api/posts/:postId` | 게시글 삭제 (본인 글만 가능, 로그인 필요) |

**Query Parameters** (GET /api/posts/line/:lineId):
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 게시글 수 (기본값: 20)

### 댓글
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/posts/:postId/comments` | 댓글 목록 조회 |
| POST | `/api/posts/:postId/comments` | 댓글 작성 (최대 500자) |
| DELETE | `/api/comments/:commentId` | 댓글 삭제 (본인 댓글만 가능, 로그인 필요) |

## 🔧 주요 기능 상세

### 실시간 활성 사용자 추적

[backend/src/utils/activeUsers.js](backend/src/utils/activeUsers.js)

- **세션 기반 추적**: IP 주소를 고유 세션 ID로 사용
- **WebSocket 통신**: 실시간 서버-클라이언트 양방향 통신
- **실시간 브로드캐스트**: 데이터 변경 시 즉시 모든 클라이언트에 전파
- **호선별 집계**: 각 지하철 호선의 현재 접속자 수 독립 관리

```javascript
// 활성 사용자 기록
function recordActivity(lineId, sessionId) {
  if (!activeUsers.has(lineId)) {
    activeUsers.set(lineId, new Map());
  }
  const lineUsers = activeUsers.get(lineId);
  lineUsers.set(sessionId, Date.now());
}
```

### 비속어 필터링

[backend/src/utils/profanityFilter.js](backend/src/utils/profanityFilter.js)

- 한국어 비속어 및 성적 단어 목록 기반 필터링
- 정규식 패턴 매칭으로 변형 단어 감지
- 특수문자를 이용한 회피 방지
- 게시글 및 댓글 작성 시 자동 검사

### 자동 데이터 삭제

[backend/src/utils/scheduler.js](backend/src/utils/scheduler.js)

- **삭제 시간**: 매일 오전 9시 (KST)
- **삭제 대상**: 모든 게시글 및 댓글
- **목적**: 휘발성 소통 공간 유지, 개인정보 보호
- node-cron을 이용한 스케줄링

```javascript
// 매일 오전 9시 실행
cron.schedule('0 9 * * *', deleteAllData, {
  timezone: "Asia/Seoul"
});
```

### 카카오 로그인 (선택적)

[backend/src/controllers/authController.js](backend/src/controllers/authController.js)

- **OAuth 2.0 인증**: 카카오 REST API 사용
- **JWT 토큰**: 30일 유효기간, 서버리스 환경 최적화
- **선택적 기능**: 비로그인 사용자도 100% 기능 이용 가능
- **내 글 관리**: 로그인 사용자만 본인 게시글/댓글 삭제 가능
- **익명성 유지**: 게시글에 작성자 정보 노출 안 됨
- 상세 가이드: [KAKAO_LOGIN_SETUP.md](KAKAO_LOGIN_SETUP.md)

### 보안 기능

- **Rate Limiting**: POST/DELETE 요청 15분당 50회 제한 (GET 제외)
- **HTTP 보안 헤더**: Helmet.js를 통한 XSS, Clickjacking 방지
- **CORS**: 허용된 origin만 API 접근 가능
- **SQL Injection 방지**: Parameterized Queries 사용
- **JWT 검증**: 삭제 권한 확인 시 토큰 검증
- **입력 검증**: 게시글/댓글 길이 제한, 비속어 필터링

## 🎨 UI/UX 디자인

### 디자인 컨셉
- **모바일 최우선**: 출퇴근 시간 한 손 조작 최적화
- **심리적 안전**: 익명성과 자동 삭제를 명확히 전달
- **미니멀리즘**: Notion + Blind + 당근 커뮤니티 스타일 참고
- **지하철 테마**: 각 노선의 고유 색상 활용
- **가벼운 느낌**: 부담 없이 이용할 수 있는 분위기

### 주요 디자인 요소

#### 메인 페이지 (HomePage)
- **부드러운 헤드라인**: "출퇴근하는 노선의 이야기를 들어보세요" (명령조 제거)
- **핵심 가치 강조**: "🔒 익명 · ⏰ 매일 오전 9시 초기화" 상단 배치
- **탭 기반 정렬**: 드롭다운 대신 모바일 친화적 탭 (호선 순 | 인기 순)
- **실시간 활성 표시**: 펄스 애니메이션 + "N명 이야기 중" 배지
- **빈 상태 메시지**: "대화가 시작되길 기다리고 있어요"

#### 게시글 작성 (LinePage)
- **얇은 색상 인디케이터**: 4px 두께로 호선 색상 표시
- **안전한 익명 공간 부제**: 심리적 안전 강조
- **테두리 없는 텍스트**: 회색 배경으로 부드러운 느낌
- **눈에 띄는 안내**: "🔒 익명으로 작성돼요" "⏰ 오전 9시에 자동 삭제돼요"
- **공감적 플레이스홀더**: "오늘 하루 어떠셨나요? 편하게 이야기해보세요..."
- **전체 너비 버튼**: 엄지 손가락 도달 최적화

#### 기타 요소
- 헤더 하단 무지개 테두리 (1-9호선 색상)
- 호선 카드 색상 코딩 및 호버 효과
- Noto Sans KR 폰트로 한글 가독성 최적화
- 펄스 애니메이션으로 실시간 느낌 강조
- 반응형 그리드 레이아웃

## 🌐 배포

### 현재 배포 환경

- **Frontend**: Vercel (자동 배포)
  - URL: https://subway-board.vercel.app
  - Git push 시 자동 빌드 및 배포

- **Backend**: Railway (자동 배포)
  - PostgreSQL 포함
  - Git push 시 자동 빌드 및 배포
  - 마이그레이션 자동 실행

### 배포 방법

1. **GitHub 레포지토리 생성**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/subway-board.git
   git push -u origin main
   ```

2. **Railway 배포 (Backend + DB)**
   - Railway.app 접속 후 GitHub 연동
   - New Project → Deploy from GitHub repo 선택
   - PostgreSQL 플러그인 추가
   - 환경 변수 설정:
     - `DATABASE_URL`: (자동 설정됨)
     - `FRONTEND_URL`: `https://your-app.vercel.app`
     - `KAKAO_REST_API_KEY`: 카카오 REST API 키
     - `KAKAO_REDIRECT_URI`: `http://localhost:3000/auth/kakao/callback`
     - `KAKAO_REDIRECT_URI_PROD`: `https://your-app.vercel.app/auth/kakao/callback`
     - `JWT_SECRET`: 랜덤 생성 키 (아래 참고)
     - `NODE_ENV`: `production`

   **JWT_SECRET 생성**:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

3. **Vercel 배포 (Frontend)**
   - Vercel.com 접속 후 GitHub 연동
   - Import Project 선택
   - Root Directory: `frontend` 설정
   - 환경 변수 설정:
     - `REACT_APP_API_URL`: Railway 백엔드 URL

4. **카카오 로그인 설정** (선택적)
   - [KAKAO_LOGIN_SETUP.md](KAKAO_LOGIN_SETUP.md) 참고
   - Kakao Developers 앱 등록
   - Redirect URI 등록
   - Railway에서 마이그레이션 실행

## 📊 데이터베이스 스키마

### subway_lines 테이블
```sql
CREATE TABLE subway_lines (
    id SERIAL PRIMARY KEY,
    line_name VARCHAR(50) NOT NULL,
    line_number VARCHAR(10) NOT NULL,
    color VARCHAR(7) NOT NULL
);
```

### users 테이블 (카카오 로그인용)
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    kakao_id BIGINT UNIQUE NOT NULL,
    nickname VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### posts 테이블
```sql
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    subway_line_id INTEGER REFERENCES subway_lines(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,  -- nullable (비로그인 지원)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### comments 테이블
```sql
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,  -- nullable (비로그인 지원)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔜 향후 개발 계획

### ✅ 완료된 기능
- [x] 호선 간소화 (1-9호선으로 축소)
- [x] 실시간 활성 사용자 수 표시
- [x] 모바일 최적화 UI/UX (한 손 조작)
- [x] 탭 기반 정렬 (호선 순 | 인기 순)
- [x] 심리적 안전 강조 디자인
- [x] WebSocket 실시간 통신 (활성 사용자 및 메시지)
- [x] 카카오 로그인 백엔드 구현 (OAuth 2.0 + JWT)

### 🚧 진행 중
- [ ] 카카오 로그인 프론트엔드 구현
  - [ ] AuthContext 생성
  - [ ] AuthButton 컴포넌트
  - [ ] KakaoCallback 페이지
  - [ ] 본인 글 삭제 버튼 조건부 렌더링
  - 상세 내용: [KAKAO_LOGIN_SETUP.md](KAKAO_LOGIN_SETUP.md)

### Phase 1 - 운영 정책 구현
- [ ] 운영 시간 제한 (평일 7-9시)
- [ ] 한국 공휴일 감지 및 차단
- [ ] 운영 시간 외 접속 시 안내 페이지

### Phase 2 - 기능 개선
- [ ] 세션 기반 댓글 알림 (내가 댓글 단 글에 새 댓글 알림)
- [ ] 게시글 신고 기능
- [ ] 관리자 대시보드

### Phase 3 - 수익화
- [ ] Google AdSense 통합
- [ ] 광고 위치 최적화

### Phase 4 - 확장
- [ ] 이미지 업로드 지원
- [ ] 더 정교한 비속어 필터링 (ML 기반)
- [ ] 다른 도시 지하철 지원 (부산, 대구 등)
- [ ] PWA 지원

## 🤝 기여

이슈와 PR을 환영합니다!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 📧 문의

프로젝트 관련 문의사항은 GitHub Issues를 이용해주세요.

---

**Made with ❤️ for Seoul Subway Commuters**
