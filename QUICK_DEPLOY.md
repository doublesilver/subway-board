# 빠른 배포 가이드

## 단계별 요약

### 1단계: GitHub에 코드 업로드
```bash
git init
git add .
git commit -m "Initial commit: 출퇴근길 게시판"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 2단계: Railway 배포 (5분)

1. **Railway 접속**: https://railway.app/
2. **로그인**: GitHub 계정으로 로그인
3. **New Project** 클릭
4. **Deploy from GitHub repo** 선택
5. 저장소 선택 후 **Deploy Now**
6. **Add PostgreSQL**:
   - 프로젝트 대시보드에서 `+ New` → `Database` → `PostgreSQL`
7. **환경 변수 설정** (Backend 서비스):
   ```
   NODE_ENV=production
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   ```
8. **Settings 설정**:
   - Root Directory: `backend`
   - Custom Start Command: `npm run migrate && npm start`
9. **도메인 생성**: Settings → Generate Domain
10. **URL 복사**: 예) `https://your-app.up.railway.app`

### 3단계: Vercel 배포 (3분)

1. **Vercel 접속**: https://vercel.com/
2. **로그인**: GitHub 계정으로 로그인
3. **Add New...** → **Project**
4. 저장소 선택
5. **설정**:
   - Root Directory: `frontend`
   - Framework Preset: Create React App (자동감지)
6. **환경 변수 추가**:
   ```
   REACT_APP_API_URL=https://your-app.up.railway.app/api
   ```
   (Railway에서 복사한 URL 사용)
7. **Deploy** 클릭

### 4단계: Railway에 CORS 설정

Railway Backend 서비스의 환경 변수에 추가:
```
FRONTEND_URL=https://your-app.vercel.app
```
(Vercel에서 생성된 URL)

### 5단계: 완료!

Vercel URL로 접속하여 앱이 정상 작동하는지 확인합니다.

## 예상 소요 시간
- GitHub 업로드: 2분
- Railway 배포: 5분
- Vercel 배포: 3분
- **총 소요 시간: 약 10분**

## 비용
- **Railway**: 월 $5 무료 크레딧 (충분함)
- **Vercel**: 완전 무료
- **총 비용: $0**

## 문제 해결

### Railway 배포 실패
- Logs 탭에서 에러 확인
- DATABASE_URL 변수 확인
- Start Command 확인

### Vercel에서 API 호출 실패
- REACT_APP_API_URL 값 확인
- Railway의 CORS 설정 확인
- 백엔드가 정상 실행 중인지 확인

### 데이터베이스 연결 오류
- PostgreSQL 서비스 상태 확인
- DATABASE_URL 형식 확인: `postgresql://user:password@host:port/database`

## 참고 링크
- 상세 배포 가이드: [DEPLOYMENT.md](DEPLOYMENT.md)
- Railway 문서: https://docs.railway.app/
- Vercel 문서: https://vercel.com/docs
