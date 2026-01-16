# 🚀 배포 가이드 (Deployment Guide)

이 가이드는 **GitHub 푸시**부터 **Railway(백엔드)**, **Vercel(프론트엔드)** 배포까지의 전 과정을 다룹니다.

## 1단계: GitHub에 코드 업데이트 (필수)

현재 로컬에 적용된 OpenAI Moderation 및 로컬 필터 변경사항을 GitHub에 올려야 배포 서버가 이를 가져갈 수 있습니다.

터미널(VS Code 터미널 등)을 열고 아래 명령어를 순서대로 복사해서 붙여넣으세요.

```bash
# 1. 변경된 모든 파일 스테이징
git add .

# 2. 커밋 메시지 작성 (변경 내용 저장)
git commit -m "feat: switch to OpenAI Moderation API + Local Filter architecture"

# 3. GitHub로 푸시 (업로드)
git push origin main
```
*(만약 브랜치명이 `main`이 아니라 `master`라면 `git push origin master`로 입력하세요)*

---

## 2단계: Railway 배포 (백엔드 + DB)

서버와 데이터베이스는 Railway를 사용합니다.

1.  **[Railway 대시보드](https://railway.app/) 접속 및 로그인** (GitHub 계정 권장)
2.  **새 프로젝트 생성**:
    *   우측 상단 `+ New Project` 클릭
    *   `Deploy from GitHub repo` 선택
    *   `subway-board` (또는 해당 리포지토리 이름) 선택
    *   **Deploy Now** 클릭!

3.  **환경 변수 설정 (중요)**:
    *   생성된 프로젝트 카드 클릭 → **Variables** 탭 이동
    *   `+ New Variable` 클릭하여 아래 값들을 추가합니다.
        *   `OPENAI_API_KEY`: `sk-proj-F5Kmg...` (발급받은 키 전체)
        *   `PORT`: `5000`
        *   `NODE_ENV`: `production`
    *   *(참고: `DATABASE_URL`은 Railway가 자동으로 추가해줍니다)*

4.  **도메인 생성**:
    *   **Settings** 탭 → **Networking** 섹션
    *   **Generate Domain** 클릭
    *   생성된 주소 (예: `subway-backend-production.up.railway.app`)를 **복사**해 두세요. (프론트엔드에서 씁니다)

---

## 3단계: Vercel 배포 (프론트엔드)

사용자에게 보여지는 화면은 Vercel에 배포합니다.

1.  **[Vercel 대시보드](https://vercel.com/) 접속 및 로그인**
2.  **새 프로젝트 추가**:
    *   `Add New...` → `Project` 클릭
    *   GitHub 리포지토리의 `Import` 버튼 클릭
3.  **설정 구성**:
    *   **Framework Preset**: `Vite` (자동으로 잡힘)
    *   **Root Directory**: `Edit` 눌러서 `frontend` 폴더 선택 (중요!)
4.  **환경 변수 입력**:
    *   **Environment Variables** 섹션 펼치기
    *   `VITE_API_URL`: 아까 복사한 **Railway 백엔드 주소** (예: `https://subway-backend-production.up.railway.app`)
        *   *(주의: 주소 앞에 `https://` 붙이고, 뒤에 `/api`는 코드에 따라 필요할 수도 아닐 수도 있지만, 보통 도메인 루트만 넣습니다. API 호출 코드에서 `/api`를 붙인다면 도메인만, 아니라면 `/api`까지 포함)*
        *   *코드 확인 결과: 프론트엔드 `api.js`가 기본 URL을 어떻게 쓰는지 확인 필요. 보통 도메인만 넣습니다.*
5.  **Deploy** 클릭!

---

## 4단계: 마무리 (CORS 설정)

배포된 프론트엔드 주소(예: `https://subway-frontend.vercel.app`)가 나오면, 백엔드에서 이 주소를 허용해줘야 합니다.

1.  **Railway** 프로젝트로 다시 이동
2.  **Variables** 탭
3.  `FRONTEND_URL` 변수 추가 → 값: `https://subway-frontend.vercel.app` (방금 배포된 Vercel 주소)
4.  자동으로 백엔드가 재배포됩니다.

🎉 **배포 완료!** 이제 Vercel 주소로 접속하면 서비스가 정상 작동합니다.
