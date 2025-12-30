# 출퇴근길 익명 게시판

서울 지하철 호선별 익명 게시판 서비스

## 주요 기능
- 지하철 호선별 익명 게시판 (1-9호선, 경의중앙선, 공항철도, 수인분당선 등)
- 게시글 및 댓글 작성 (완전 익명)
- 비속어 및 성적 단어 자동 필터링
- 24시간 후 자동 데이터 삭제 (가벼운 소통 유지)
- Rate Limiting 및 보안 설정
- 광고 수익화 준비 (Google AdSense - 향후 구현)

## 기술 스택
- **Frontend**: React 18, React Router, Axios
- **Backend**: Node.js, Express, PostgreSQL
- **Database**: PostgreSQL
- **기타**: node-cron (스케줄러), Helmet (보안), CORS

## 프로젝트 구조
```
side/
├── backend/
│   ├── src/
│   │   ├── controllers/      # API 컨트롤러
│   │   ├── db/               # DB 연결 및 스키마
│   │   ├── middleware/       # 유효성 검사 등
│   │   ├── routes/           # API 라우트
│   │   ├── utils/            # 필터링, 스케줄러
│   │   └── index.js          # 서버 진입점
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/            # 페이지 컴포넌트
│   │   ├── services/         # API 호출
│   │   ├── App.js
│   │   └── App.css
│   ├── package.json
│   └── .env
└── README.md
```

## 빠른 시작

### 사전 요구사항
- Node.js 14 이상
- PostgreSQL 12 이상

### 1. PostgreSQL 데이터베이스 생성

```bash
psql -U postgres
CREATE DATABASE subway_board;
\q
```

### 2. 백엔드 설정 및 실행

```bash
cd backend

# 패키지 설치
npm install

# .env 파일 확인 및 수정 (필요시)
# DATABASE_URL=postgresql://postgres:your_password@localhost:5432/subway_board

# 데이터베이스 마이그레이션 실행
npm run migrate

# 개발 서버 시작
npm run dev
```

서버가 http://localhost:5000 에서 실행됩니다.

### 3. 프론트엔드 실행

새 터미널에서:

```bash
cd frontend

# 패키지 설치
npm install

# 개발 서버 시작
npm start
```

브라우저가 자동으로 http://localhost:3000 을 엽니다.

## API 엔드포인트

### 호선
- `GET /api/subway-lines` - 모든 호선 조회

### 게시글
- `GET /api/posts/line/:lineId?page=1&limit=20` - 호선별 게시글 목록
- `GET /api/posts/:postId` - 게시글 상세
- `POST /api/posts` - 게시글 작성
- `DELETE /api/posts/:postId` - 게시글 삭제

### 댓글
- `GET /api/posts/:postId/comments` - 댓글 목록
- `POST /api/posts/:postId/comments` - 댓글 작성
- `DELETE /api/comments/:commentId` - 댓글 삭제

## 주요 기능 설명

### 비속어 필터링
[profanityFilter.js](backend/src/utils/profanityFilter.js)에서 비속어 및 성적 단어를 자동으로 감지하고 차단합니다.
- 단어 목록 기반 필터링
- 정규식 패턴 매칭
- 특수문자 회피 방지

### 자동 데이터 삭제
매일 자정(00:00)에 24시간 이상 경과한 게시글과 댓글을 자동으로 삭제합니다.
- node-cron을 이용한 스케줄링
- [scheduler.js](backend/src/utils/scheduler.js) 참조

### 보안 기능
- Rate Limiting: 15분당 100회 요청 제한
- Helmet.js를 통한 HTTP 헤더 보안
- CORS 설정
- SQL Injection 방지 (Parameterized Queries)

## 배포

무료로 배포하는 방법:

### 빠른 배포 (10분)
[QUICK_DEPLOY.md](QUICK_DEPLOY.md) 참조

### 상세 배포 가이드
[DEPLOYMENT.md](DEPLOYMENT.md) 참조

**권장 배포 방식:**
- Frontend: Vercel (무료)
- Backend + DB: Railway (무료)

## 향후 개발 계획

- [ ] Google AdSense 통합
- [ ] 게시글 신고 기능
- [ ] 실시간 알림
- [ ] 이미지 업로드 지원
- [ ] 관리자 대시보드
- [ ] 더 정교한 비속어 필터링 (ML 기반)
- [ ] 다른 도시 지하철 지원

## 라이선스
MIT

## 기여
이슈와 PR을 환영합니다!
