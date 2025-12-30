# Frontend React App

출퇴근길 익명 게시판 프론트엔드

## 설치 및 실행

### 1. 패키지 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env` 파일이 이미 생성되어 있습니다. 필요시 API URL을 수정하세요.

```
REACT_APP_API_URL=http://localhost:5000/api
```

### 3. 개발 서버 실행

```bash
npm start
```

브라우저에서 http://localhost:3000 으로 접속하세요.

### 4. 프로덕션 빌드

```bash
npm run build
```

## 주요 기능

- 서울 지하철 호선별 게시판
- 익명 게시글 작성
- 익명 댓글 작성
- 비속어 필터링
- 반응형 디자인

## 페이지 구조

- `/` - 메인 페이지 (호선 선택)
- `/line/:lineId` - 호선별 게시판
- `/post/:postId` - 게시글 상세 및 댓글

## 기술 스택

- React 18
- React Router DOM
- Axios
- CSS3
