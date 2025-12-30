# Backend API Server

출퇴근길 익명 게시판 백엔드 서버

## 설치 및 실행

### 1. PostgreSQL 설치 및 설정

PostgreSQL이 설치되어 있어야 합니다.

```bash
# PostgreSQL 접속
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE subway_board;

# 종료
\q
```

### 2. 환경 변수 설정

`.env.example` 파일을 `.env`로 복사하고 수정하세요.

```bash
cp .env.example .env
```

`.env` 파일 예시:
```
PORT=5000
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/subway_board
NODE_ENV=development
```

### 3. 패키지 설치

```bash
npm install
```

### 4. 데이터베이스 마이그레이션

```bash
npm run migrate
```

### 5. 서버 실행

```bash
# 개발 모드 (nodemon)
npm run dev

# 프로덕션 모드
npm start
```

## API 엔드포인트

### 호선 관련
- `GET /api/subway-lines` - 모든 호선 목록 조회

### 게시글 관련
- `GET /api/posts/line/:lineId` - 특정 호선의 게시글 목록 조회
- `GET /api/posts/:postId` - 특정 게시글 조회
- `POST /api/posts` - 게시글 작성
- `DELETE /api/posts/:postId` - 게시글 삭제

### 댓글 관련
- `GET /api/posts/:postId/comments` - 특정 게시글의 댓글 목록 조회
- `POST /api/posts/:postId/comments` - 댓글 작성
- `DELETE /api/comments/:commentId` - 댓글 삭제

## 주요 기능

- 비속어 및 성적 단어 자동 필터링
- Rate Limiting (15분당 100회 요청)
- 매일 자동 데이터 삭제 (24시간 이상 경과 게시글/댓글)
- CORS 설정
- 보안 헤더 (Helmet)

## 기술 스택

- Node.js
- Express
- PostgreSQL
- node-cron (스케줄러)
