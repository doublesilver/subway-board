# 출퇴근길 익명 게시판 🚇

서울 지하철 호선별 출퇴근 시간대 익명 게시판 서비스

[![Deploy Status](https://img.shields.io/badge/status-live-brightgreen)](https://subway-board.vercel.app)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**🔗 Live Demo**: [https://subway-board.vercel.app](https://subway-board.vercel.app)

## 📋 프로젝트 소개

출퇴근 시간대에만 운영되는 익명 게시판으로, 같은 지하철 노선을 이용하는 사람들끼리 가볍게 소통할 수 있는 공간입니다.

### 운영 시간
- **평일**: 오전 7시 ~ 9시
- **주말 및 공휴일**: 휴무
- **데이터 삭제**: 매일 오전 9시에 모든 게시글 및 댓글 자동 삭제

## ✨ 주요 기능

- 🚇 **호선별 게시판**: 서울 지하철 19개 노선 (1-9호선, 경의중앙선, 공항철도, 수인분당선 등)
- 👤 **완전 익명**: 회원가입 없이 익명으로 소통
- 🔄 **휘발성 데이터**: 매일 오전 9시 모든 데이터 자동 삭제
- 🛡️ **비속어 필터링**: 한국어 비속어 및 성적 단어 자동 차단
- 🎨 **지하철 테마 UI**: 각 노선 색상을 활용한 직관적인 디자인
- 📱 **반응형 디자인**: 모바일 최적화
- ⚡ **Rate Limiting**: 남용 방지를 위한 요청 제한
- 🔒 **보안**: Helmet.js, CORS, SQL Injection 방지

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
- **Scheduler**: node-cron
- **Security**: Helmet, CORS, express-rate-limit
- **Hosting**: Railway

## 📁 프로젝트 구조

```
side/
├── backend/
│   ├── src/
│   │   ├── controllers/      # API 컨트롤러
│   │   │   ├── commentController.js
│   │   │   ├── postController.js
│   │   │   └── subwayLineController.js
│   │   ├── db/               # 데이터베이스
│   │   │   ├── pool.js       # DB 연결 풀
│   │   │   ├── schema.sql    # DB 스키마
│   │   │   └── migrate.js    # 마이그레이션
│   │   ├── middleware/       # 미들웨어
│   │   │   └── validators.js # 유효성 검사
│   │   ├── routes/           # API 라우트
│   │   │   └── index.js
│   │   ├── utils/            # 유틸리티
│   │   │   ├── profanityFilter.js  # 비속어 필터
│   │   │   └── scheduler.js        # 스케줄러
│   │   └── index.js          # 서버 진입점
│   ├── package.json
│   ├── .env.example
│   └── start.sh
├── frontend/
│   ├── src/
│   │   ├── pages/            # 페이지 컴포넌트
│   │   │   ├── HomePage.js   # 호선 선택
│   │   │   ├── LinePage.js   # 게시글 목록
│   │   │   └── PostPage.js   # 게시글 상세
│   │   ├── services/         # API 서비스
│   │   │   └── api.js
│   │   ├── App.js            # 메인 컴포넌트
│   │   ├── App.css           # 스타일시트
│   │   └── index.js
│   ├── public/
│   ├── package.json
│   └── .env.example
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
- **Rate Limit**: 15분당 100회 요청

### 호선
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subway-lines` | 모든 호선 조회 (19개) |

### 게시글
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/posts/line/:lineId` | 호선별 게시글 목록 (페이지네이션) |
| GET | `/api/posts/:postId` | 게시글 상세 조회 |
| POST | `/api/posts` | 게시글 작성 (최대 1000자) |
| DELETE | `/api/posts/:postId` | 게시글 삭제 |

**Query Parameters** (GET /api/posts/line/:lineId):
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 게시글 수 (기본값: 20)

### 댓글
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/posts/:postId/comments` | 댓글 목록 조회 |
| POST | `/api/posts/:postId/comments` | 댓글 작성 (최대 500자) |
| DELETE | `/api/comments/:commentId` | 댓글 삭제 |

## 🔧 주요 기능 상세

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

### 보안 기능

- **Rate Limiting**: 15분당 100회 요청 제한 (express-rate-limit)
- **HTTP 보안 헤더**: Helmet.js를 통한 XSS, Clickjacking 방지
- **CORS**: 허용된 origin만 API 접근 가능
- **SQL Injection 방지**: Parameterized Queries 사용
- **입력 검증**: 게시글/댓글 길이 제한, 비속어 필터링

## 🎨 UI/UX 디자인

### 디자인 컨셉
- **지하철 테마**: 각 노선의 고유 색상 활용
- **모던하고 깔끔한**: 불필요한 요소 없이 간결함
- **가벼운 느낌**: 부담 없이 이용할 수 있는 분위기
- **직관적**: 누구나 쉽게 사용 가능

### 주요 디자인 요소
- 헤더 하단 무지개 테두리 (서울 지하철 1-9호선 색상)
- 호선 카드의 색상 코딩 및 호버 효과
- 그라데이션 버튼 및 부드러운 애니메이션
- Noto Sans KR 폰트로 한글 가독성 최적화
- 모바일 반응형 그리드 레이아웃

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
   - 환境変数 설정:
     - `DATABASE_URL`: (자동 설정됨)
     - `FRONTEND_URL`: `https://your-app.vercel.app`

3. **Vercel 배포 (Frontend)**
   - Vercel.com 접속 후 GitHub 연동
   - Import Project 선택
   - Root Directory: `frontend` 설정
   - 환경 변수 설정:
     - `REACT_APP_API_URL`: Railway 백엔드 URL

## 📊 데이터베이스 스키마

### subway_lines 테이블
```sql
CREATE TABLE subway_lines (
    id SERIAL PRIMARY KEY,
    line_name VARCHAR(50) NOT NULL,
    color VARCHAR(7) NOT NULL
);
```

### posts 테이블
```sql
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    subway_line_id INTEGER REFERENCES subway_lines(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### comments 테이블
```sql
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔜 향후 개발 계획

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
- [ ] 실시간 알림 (WebSocket)
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
