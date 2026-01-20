# 바톤터치 문서 (Progress)

## 목적
Codex 또는 다른 AI 에이전트가 즉시 이어서 작업할 수 있도록 현재 상태와 맥락을 요약한다.

## 최근 변경 요약 (2026-01-20)

### 관리자 대시보드 구현
- `/admin` 경로로 접속 가능한 관리자 대시보드 추가
- 비밀번호 + IP 화이트리스트 이중 보안
- JWT 기반 인증 (24시간 유효)
- 차트 라이브러리: recharts
- 기능: DAU/WAU/MAU, 호선별 통계, 시간대별 분석, 커스텀 SQL 쿼리

### 방문자 통계 DB 고도화
- 인메모리 캐시 → DB 기반 중복체크로 변경 (서버 재시작 대응)
- `hourly_visits` 테이블: 시간대별/호선별 방문 집계
- `unique_visitors` 테이블: DAU/WAU/MAU + 재방문율 계산
- `visitController.js` 전면 개편

### 기존 변경 (2026-01-19)
- README.md 전면 업데이트
- 답장(reply) 저장/표시 적용
- 입장/퇴장 시스템 메시지 개선
- 말풍선 색상 통일

## 배포 상태
- 최근 변경 사항 `main`에 push 완료
- Frontend: Vercel 자동 배포
- Backend: Railway 자동 배포
- `https://www.gagisiro.com/` 200 OK

## 환경변수 (Railway)
```
# 기존
ADMIN_KEY=xxx                    # 기존 관리자 API 키

# 대시보드용 (새로 추가 필요)
ADMIN_DASHBOARD_PASSWORD=xxx     # 대시보드 로그인 비밀번호
ADMIN_IP_WHITELIST=IP1,IP2       # (옵션) IP 화이트리스트
ADMIN_JWT_SECRET=xxx             # (옵션) JWT 시크릿, 미설정시 ADMIN_KEY 사용
```

## 현재 이슈/주의
- 카카오 로그인: 뼈대만 구현됨, 실제 동작 안함
- 운영시간: 테스트 기간 24시간, 2026-01-21부터 평일 07:00~09:00
- 정식 운영 전환 시 `RESTORE.md` 참고

## 다음 작업 후보
- 대시보드 추가 기능 (실시간 모니터링, 알림 등)
- 모바일 대시보드 최적화
- 정식 운영 전환 (RESTORE.md 실행)

## 주요 파일
- 프론트엔드
  - 스타일: `frontend/src/App.css`
  - 메인: `frontend/src/pages/HomePage.jsx`
  - 채팅: `frontend/src/pages/LinePage.jsx`
  - 대시보드: `frontend/src/pages/AdminDashboard.jsx`
  - API: `frontend/src/services/api.js`

- 백엔드
  - 엔트리: `backend/src/index.js`
  - 라우트: `backend/src/routes/index.js`
  - 대시보드 API: `backend/src/controllers/dashboardController.js`
  - 방문 통계: `backend/src/controllers/visitController.js`
  - 인증 미들웨어: `backend/src/middleware/adminMiddleware.js`
  - 스키마: `backend/src/db/schema.sql`
  - 스케줄러: `backend/src/utils/scheduler.js`

## 토큰 사용량 최적화 가이드

### AI 에이전트 작업 시 권장 사항
1. **파일 읽기 최소화**: 전체 파일 대신 필요한 부분만 읽기 (offset/limit 활용)
2. **Glob 먼저, Read 나중에**: 파일 구조 파악 후 필요한 파일만 읽기
3. **병렬 실행 활용**: 독립적인 작업은 동시 실행
4. **컨텍스트 활용**: 이전에 읽은 파일 내용 재활용

### 자주 참조하는 파일 요약
- `backend/src/routes/index.js`: 모든 API 엔드포인트 정의
- `frontend/src/App.jsx`: 프론트엔드 라우팅 구조
- `backend/src/db/schema.sql`: DB 테이블 구조
- `RESTORE.md`: 테스트→정식 운영 전환 가이드

### 작업 패턴
```
1. PROGRESS.md 읽기 → 현재 상태 파악
2. ARCHITECTURE.md 참고 → 파일 구조 파악
3. 필요한 파일만 선별적 읽기
4. 작업 완료 후 PROGRESS.md 업데이트
```
