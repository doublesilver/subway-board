# GitHub를 통한 자동 배포 가이드

## 1단계: GitHub 저장소 생성 및 푸시 (3분)

### 1-1. GitHub에서 새 저장소 생성
1. [GitHub](https://github.com/new)에 접속
2. Repository name: `subway-board` (원하는 이름)
3. Public 또는 Private 선택
4. **"Add a README file" 체크하지 않기** (중요!)
5. "Create repository" 클릭

### 1-2. 로컬에서 Git 초기화 및 푸시

현재 프로젝트 폴더에서 실행:

```bash
# Git 초기화
git init

# 모든 파일 추가
git add .

# 첫 커밋
git commit -m "Initial commit: 출퇴근길 익명 게시판"

# 기본 브랜치를 main으로 설정
git branch -M main

# GitHub 저장소 연결 (YOUR_USERNAME과 YOUR_REPO를 실제 값으로 변경)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# 푸시
git push -u origin main
```

**예시:**
```bash
git remote add origin https://github.com/johndoe/subway-board.git
git push -u origin main
```

## 2단계: Railway 자동 배포 설정 (5분)

### 2-1. Railway 프로젝트 생성
1. [Railway](https://railway.app/) 접속
2. "New Project" 클릭
3. **"Deploy from GitHub repo"** 선택
4. 방금 만든 저장소 선택
5. "Deploy Now" 클릭

### 2-2. PostgreSQL 데이터베이스 추가
1. 프로젝트 대시보드에서 **"+ New"** 클릭
2. **"Database"** → **"PostgreSQL"** 선택

### 2-3. Backend 서비스 설정

**Variables (환경 변수) 탭:**
```bash
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
FRONTEND_URL=https://your-app.vercel.app
```
(FRONTEND_URL은 나중에 Vercel 배포 후 업데이트)

**Settings 탭:**
- **Root Directory**: `backend`
- **Watch Paths**: `backend/**`
- **Build Command**: `npm install`
- **Start Command**: `npm run migrate && npm start`

**Domains 탭:**
- "Generate Domain" 클릭
- 생성된 URL 복사 (예: `https://subway-board-production.up.railway.app`)

### 2-4. 자동 배포 확인
- GitHub에 push하면 자동으로 Railway가 감지하고 재배포됩니다
- Deployments 탭에서 배포 상태 확인 가능

## 3단계: Vercel 자동 배포 설정 (3분)

### 3-1. Vercel 프로젝트 생성
1. [Vercel](https://vercel.com/) 접속
2. **"Add New..."** → **"Project"** 클릭
3. GitHub 저장소 선택
4. **"Import"** 클릭

### 3-2. 프로젝트 설정

**Framework Preset:** Create React App (자동 감지됨)

**Root Directory:** `frontend` 입력 후 "Edit" 클릭

**Build and Output Settings:**
- Build Command: `npm run build`
- Output Directory: `build`
- Install Command: `npm install`

**Environment Variables:**
```bash
REACT_APP_API_URL=https://subway-board-production.up.railway.app/api
```
(Railway에서 복사한 백엔드 URL 사용)

**"Deploy"** 클릭!

### 3-3. 배포 URL 복사
- 배포 완료 후 URL 복사 (예: `https://subway-board.vercel.app`)

## 4단계: Railway CORS 설정 업데이트 (1분)

Railway로 돌아가서 Backend 서비스의 Variables에 추가/수정:

```bash
FRONTEND_URL=https://subway-board.vercel.app
```

(Vercel에서 복사한 URL)

변경 후 자동으로 재배포됩니다.

## 5단계: 완료!

### 테스트
1. Vercel URL 접속: `https://subway-board.vercel.app`
2. 호선 목록이 정상적으로 표시되는지 확인
3. 게시글 작성 테스트
4. 댓글 작성 테스트

## 자동 배포 작동 방식

### 코드 변경 시
```bash
# 코드 수정 후
git add .
git commit -m "기능 추가: ..."
git push
```

**자동으로:**
- Railway가 `backend/` 변경사항 감지 → 백엔드 재배포
- Vercel이 `frontend/` 변경사항 감지 → 프론트엔드 재배포

### 배포 상태 확인
- **Railway**: Dashboard → Deployments 탭
- **Vercel**: Dashboard → Deployments 탭

## 브랜치 전략 (선택사항)

### 개발/프로덕션 분리

**main 브랜치**: 프로덕션 배포
**develop 브랜치**: 개발/테스트

```bash
# 개발 브랜치 생성
git checkout -b develop

# 기능 개발
git add .
git commit -m "개발: 새 기능"
git push origin develop

# 테스트 후 main에 병합
git checkout main
git merge develop
git push origin main
```

Vercel/Railway에서 develop 브랜치도 자동 배포되도록 설정 가능 (Preview Deployments)

## 환경 변수 관리

### 로컬 개발
`.env` 파일 사용 (Git에 커밋되지 않음)

### 프로덕션
- Railway: Dashboard → Variables
- Vercel: Settings → Environment Variables

## 문제 해결

### Railway 배포 실패
```bash
# 로그 확인
Railway Dashboard → Deployments → 실패한 배포 클릭 → View Logs

# 일반적인 원인:
- DATABASE_URL 누락
- Root Directory 잘못 설정
- package.json 오류
```

### Vercel 배포 실패
```bash
# 로그 확인
Vercel Dashboard → Deployments → 실패한 배포 클릭 → View Function Logs

# 일반적인 원인:
- Root Directory 잘못 설정
- 환경 변수 누락
- npm install 실패
```

### CORS 오류
```bash
# Railway Variables에서 확인:
FRONTEND_URL=https://정확한-vercel-url.vercel.app

# 프로토콜(https://) 포함 필수
# 마지막 슬래시(/) 제외
```

## 유용한 명령어

```bash
# 현재 리모트 저장소 확인
git remote -v

# 커밋 히스토리 확인
git log --oneline

# 변경사항 확인
git status
git diff

# 마지막 커밋 수정
git commit --amend -m "새 커밋 메시지"
git push --force

# 특정 파일만 커밋
git add backend/src/index.js
git commit -m "백엔드: CORS 설정 수정"
git push
```

## 다음 단계

배포가 완료되면:
- [ ] Google Search Console에 사이트 등록
- [ ] Google Analytics 추가
- [ ] 도메인 연결 (선택)
- [ ] SSL 인증서 확인 (자동 발급됨)
- [ ] 모니터링 설정
