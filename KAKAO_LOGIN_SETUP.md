# 카카오 로그인 구현 가이드 🔐

## 📋 개요

선택적 카카오 로그인 기능으로, **로그인 없이도 100% 사용 가능**하며 로그인 시 **내 글 관리** 기능만 추가됩니다.

### 핵심 원칙
- ✅ 비로그인 사용자: 글/댓글 작성, 조회 가능
- ✅ 로그인 사용자: 위 기능 + 내 글 삭제 기능
- ✅ 익명성 유지: 게시글에 작성자 정보 노출 안 됨
- ✅ 선택적: 강제 로그인 없음

---

## 🚀 1단계: Kakao Developers 앱 등록

### 1.1 앱 생성
1. **https://developers.kakao.com** 접속
2. 카카오 계정 로그인
3. "내 애플리케이션" → "애플리케이션 추가하기"
4. 앱 이름: `출퇴근길 익명 게시판`
5. 저장

### 1.2 앱 키 확인
- 생성된 앱 클릭 → "앱 키" 메뉴
- **REST API 키** 복사 (예: `15b5d3081873a0dbc0e056a486224b9f`)

### 1.3 플랫폼 설정
1. 좌측 메뉴 "플랫폼" 클릭
2. "Web 플랫폼 등록" 클릭
3. 사이트 도메인 입력:
   - 개발: `http://localhost:3000`
   - 프로덕션: `https://subway-board.vercel.app`

### 1.4 Redirect URI 설정 ⭐
1. 좌측 메뉴 "카카오 로그인" 클릭
2. "활성화 설정" **ON**
3. "Redirect URI 등록":
   ```
   http://localhost:3000/auth/kakao/callback
   https://subway-board.vercel.app/auth/kakao/callback
   ```

### 1.5 동의항목 설정
- 좌측 메뉴 "동의항목"
- "닉네임" → **필수 동의**로 설정
- "카카오계정(이메일)" → 사용 안 함

---

## 🗄️ 2단계: DB 마이그레이션

### 2.1 로컬 마이그레이션 (선택)
```bash
cd backend
node src/db/migrate-kakao.js
```

### 2.2 Railway 마이그레이션 (필수)

#### Option A: Railway CLI
```bash
# Railway CLI 설치
npm install -g @railway/cli

# Railway 로그인
railway login

# 프로젝트 연결
railway link

# 마이그레이션 실행
railway run node src/db/migrate-kakao.js
```

#### Option B: Railway 웹 콘솔
1. Railway 대시보드 접속
2. 프로젝트 선택 → PostgreSQL 클릭
3. "Data" 탭 → "Query" 클릭
4. `backend/src/db/migrations/add-kakao-login.sql` 내용 복사 붙여넣기
5. "Run Query" 실행

---

## 🔧 3단계: 백엔드 환경 변수

### 3.1 로컬 (.env)
```bash
# Kakao OAuth
KAKAO_REST_API_KEY=15b5d3081873a0dbc0e056a486224b9f
KAKAO_REDIRECT_URI=http://localhost:3000/auth/kakao/callback
KAKAO_REDIRECT_URI_PROD=https://subway-board.vercel.app/auth/kakao/callback

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### 3.2 Railway 환경 변수
Railway 대시보드 → 프로젝트 → Variables 탭:
```
KAKAO_REST_API_KEY=15b5d3081873a0dbc0e056a486224b9f
KAKAO_REDIRECT_URI=http://localhost:3000/auth/kakao/callback
KAKAO_REDIRECT_URI_PROD=https://subway-board.vercel.app/auth/kakao/callback
JWT_SECRET=(랜덤한 긴 문자열)
NODE_ENV=production
```

**JWT_SECRET 생성 방법:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 💻 4단계: 프론트엔드 구현 (남은 작업)

### 4.1 로그인 버튼 위치 (모바일 UX 고려)

#### 추천 위치: 상단 헤더 우측 (눈에 띄지 않게)
```
┌────────────────────────────┐
│ 출퇴근길 익명 게시판  [로그인] │ ← 작고 가볍게
└────────────────────────────┘
```

**이유:**
- 익명성 강조: 로그인 버튼을 크게 만들면 "로그인 필수" 느낌
- 선택적 기능: 작고 눈에 안 띄게 배치
- 한 손 조작: 오른쪽 상단은 엄지 도달 가능

#### 대안: 설정 아이콘 (햄버거 메뉴)
```
┌────────────────────────────┐
│ 출퇴근길 익명 게시판      ☰  │
└────────────────────────────┘
```
- 설정 메뉴 안에 "로그인" 항목
- 더 미니멀한 접근

### 4.2 필요한 파일 (작성 예정)

```
frontend/src/
├── components/
│   └── AuthButton.js          # 로그인 버튼 컴포넌트
├── contexts/
│   └── AuthContext.js          # 로그인 상태 관리
├── pages/
│   └── KakaoCallback.js        # 카카오 콜백 처리
└── services/
    └── authAPI.js              # 인증 API
```

### 4.3 구현 흐름

1. **로그인 버튼 클릭**
   - `/api/auth/kakao` 호출 → 카카오 로그인 URL 받기
   - 팝업 또는 리다이렉트로 카카오 로그인 페이지 이동

2. **카카오 인증 후 콜백**
   - `/auth/kakao/callback?code=xxx` 로 리다이렉트
   - 백엔드에서 JWT 토큰 발급
   - `/auth/kakao/success?token=xxx` 로 리다이렉트
   - 프론트에서 토큰을 localStorage에 저장

3. **로그인 상태 유지**
   - 모든 API 요청에 `Authorization: Bearer {token}` 헤더 추가
   - `/api/auth/me` 로 현재 사용자 정보 조회

4. **내 글 삭제 버튼 표시**
   - 게시글/댓글 렌더링 시 `post.user_id === currentUser.id` 체크
   - 본인 글에만 삭제 버튼 표시

---

## 📝 5단계: 다음 작업 체크리스트

### 백엔드 (완료)
- [x] DB 스키마 작성 (`add-kakao-login.sql`)
- [x] 패키지 설치 (`axios`, `jsonwebtoken`)
- [x] authController 구현
- [x] 라우트 추가
- [x] .env 설정

### 백엔드 (남은 작업)
- [ ] Railway 마이그레이션 실행
- [ ] Railway 환경 변수 추가
- [ ] postController/commentController에 user_id 저장 로직 추가
- [ ] 삭제 권한 검증 로직 추가

### 프론트엔드 (남은 작업)
- [ ] AuthContext 생성
- [ ] AuthButton 컴포넌트 작성
- [ ] KakaoCallback 페이지 작성
- [ ] authAPI 서비스 작성
- [ ] Header에 로그인 버튼 추가
- [ ] 게시글/댓글에 삭제 버튼 조건부 렌더링
- [ ] localStorage 토큰 관리

---

## 🎯 로그인 버튼 UI 가이드

### 디자인 원칙
1. **눈에 띄지 않게**: 작고 심플하게
2. **익명성 강조**: "로그인 필수" 느낌 금지
3. **선택적 혜택**: "내 글 관리용" 명시

### 추천 디자인 A: 텍스트 버튼 (상단 우측)
```css
.auth-button {
  font-size: 0.85rem;
  color: #666;
  padding: 0.4rem 0.8rem;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: white;
}
```

### 추천 디자인 B: 아이콘 버튼
```jsx
<button className="auth-icon-button">
  <UserIcon /> {/* 사람 아이콘 */}
</button>
```

### 로그인 후 표시
```
[닉네임 | 로그아웃]
```

---

## 🔒 보안 고려사항

1. **JWT 만료**: 30일 (적절하게 조정 가능)
2. **HTTPS 필수**: 프로덕션 환경에서는 HTTPS만 허용
3. **CORS 설정**: Vercel 도메인만 허용
4. **Rate Limiting**: 로그인 API도 제한 적용

---

## 📚 참고 자료

- [카카오 로그인 공식 문서](https://developers.kakao.com/docs/latest/ko/kakaologin/common)
- [Railway 환경 변수 설정](https://docs.railway.app/develop/variables)
- [JWT 토큰 검증](https://www.npmjs.com/package/jsonwebtoken)

---

**작성일**: 2025-01-XX
**마지막 업데이트**: 백엔드 구현 완료, 프론트엔드 대기 중
