# 배포 가이드

## 배포 구조
- **Frontend**: Vercel (무료)
- **Backend + Database**: Railway (무료)

## 1. Railway 배포 (Backend + PostgreSQL)

### 1-1. Railway 계정 생성
1. [Railway](https://railway.app/)에 접속
2. GitHub 계정으로 로그인

### 1-2. 새 프로젝트 생성
1. "New Project" 클릭
2. "Deploy from GitHub repo" 선택
3. 이 저장소 선택
4. "Deploy Now" 클릭

### 1-3. PostgreSQL 추가
1. 프로젝트 대시보드에서 "+ New" 클릭
2. "Database" → "PostgreSQL" 선택
3. 자동으로 데이터베이스가 생성됩니다

### 1-4. 환경 변수 설정
Backend 서비스의 Variables 탭에서:

```
NODE_ENV=production
PORT=5000
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

Railway가 자동으로 PostgreSQL의 DATABASE_URL을 연결해줍니다.

### 1-5. 빌드 설정
Backend 서비스의 Settings에서:
- **Root Directory**: `backend`
- **Start Command**: `npm run migrate && npm start`

### 1-6. 배포 URL 확인
Settings → Domains에서 "Generate Domain" 클릭하여 백엔드 URL을 생성합니다.
예: `https://your-app.railway.app`

## 2. Vercel 배포 (Frontend)

### 2-1. Vercel 계정 생성
1. [Vercel](https://vercel.com/)에 접속
2. GitHub 계정으로 로그인

### 2-2. 새 프로젝트 생성
1. "Add New..." → "Project" 클릭
2. GitHub 저장소 선택
3. Framework Preset: "Create React App" 자동 감지
4. Root Directory: `frontend` 설정

### 2-3. 환경 변수 설정
Environment Variables에서:

```
REACT_APP_API_URL=https://your-backend.railway.app/api
```

Railway에서 생성한 백엔드 URL을 입력합니다.

### 2-4. 배포
"Deploy" 클릭하면 자동으로 배포됩니다.

배포 완료 후 URL: `https://your-app.vercel.app`

## 3. CORS 설정 업데이트

Railway에서 백엔드 배포 후, CORS 설정을 업데이트해야 합니다.

`backend/src/index.js`에서:

```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```

Railway 환경 변수에 추가:
```
FRONTEND_URL=https://your-app.vercel.app
```

## 4. 배포 확인

### 체크리스트
- [ ] Railway에서 PostgreSQL이 정상 실행 중
- [ ] Railway에서 백엔드가 정상 실행 중 (로그 확인)
- [ ] 데이터베이스 마이그레이션 완료
- [ ] Vercel에서 프론트엔드 배포 완료
- [ ] 프론트엔드에서 백엔드 API 호출 성공
- [ ] 호선 목록 정상 표시
- [ ] 게시글 작성/조회 정상 작동

## 5. 배포 후 설정

### 데이터베이스 마이그레이션
Railway CLI 설치 후:

```bash
# Railway CLI 설치
npm i -g @railway/cli

# Railway 로그인
railway login

# 프로젝트 연결
railway link

# 마이그레이션 실행
railway run npm run migrate
```

또는 Railway 대시보드에서 직접 실행:
1. Backend 서비스 → Settings → "Start Command"를 임시로 `npm run migrate`로 변경
2. 배포 대기
3. 완료 후 다시 `npm start`로 변경

## 6. 자동 배포 설정

### Railway (Backend)
- GitHub에 push하면 자동으로 배포됩니다
- `backend/` 디렉토리 변경사항만 감지

### Vercel (Frontend)
- GitHub에 push하면 자동으로 배포됩니다
- `frontend/` 디렉토리 변경사항만 감지

## 7. 비용

### Railway 무료 플랜
- $5 무료 크레딧/월
- 500시간 실행 시간
- PostgreSQL 데이터베이스 포함
- 소규모 프로젝트에 충분

### Vercel 무료 플랜
- 100GB 대역폭/월
- 무제한 배포
- 자동 SSL 인증서
- 충분한 무료 사용량

## 8. 도메인 연결 (선택사항)

### Vercel
1. Settings → Domains
2. 커스텀 도메인 입력
3. DNS 설정 안내에 따라 도메인 설정

### Railway
1. Settings → Domains
2. 커스텀 도메인 추가
3. CNAME 레코드 설정

## 9. 모니터링

### Railway
- 대시보드에서 로그 실시간 확인
- CPU/메모리 사용량 모니터링
- 자동 재시작 설정

### Vercel
- Analytics 탭에서 트래픽 확인
- 배포 로그 확인
- 성능 모니터링

## 10. 문제 해결

### 백엔드가 시작하지 않을 때
1. Railway 로그 확인
2. DATABASE_URL 환경 변수 확인
3. 마이그레이션 실행 여부 확인

### 프론트엔드에서 API 호출 실패
1. REACT_APP_API_URL 환경 변수 확인
2. CORS 설정 확인
3. 백엔드 URL이 정확한지 확인

### 데이터베이스 연결 오류
1. PostgreSQL 서비스 상태 확인
2. DATABASE_URL 형식 확인
3. Railway 대시보드에서 데이터베이스 재시작
