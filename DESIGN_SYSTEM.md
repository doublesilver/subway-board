# 지하철 채팅 - 디자인 시스템

## 📱 프로젝트 개요

**서비스명**: 지하철 채팅
**타겟**: 출퇴근길 지하철 이용자
**플랫폼**: 모바일 웹 전용 (한 손 엄지 조작)
**리셋 주기**: 매일 오전 9시 대화방 초기화

---

## 🎨 디자인 철학

### ✅ 지향점
- **모던 미니멀리즘**: Threads, Linear, Arc 스타일
- **도시적 감성**: 서울 지하철 정체성 반영
- **한글 가독성**: 지하철 흔들림 환경 고려
- **깔끔한 UI**: 불필요한 장식 최소화

### ❌ 지양점
- 카카오톡 스타일의 과한 UI
- 그라데이션 남용
- 귀여운 캐릭터/이모티콘
- 복잡한 네비게이션

---

## 🎨 컬러 시스템

### 기본 컬러
```css
--background: #ffffff
--foreground: #0f0f0f
--muted: #f5f5f5
--muted-foreground: #737373
--border: #e5e5e5
```

### 서울 지하철 노선 컬러 (실제 색상)
```css
--subway-line-1: #0052A4  /* 1호선 - 진한 파랑 */
--subway-line-2: #00A84D  /* 2호선 - 초록 */
--subway-line-3: #EF7C1C  /* 3호선 - 주황 */
--subway-line-4: #00A5DE  /* 4호선 - 하늘색 */
--subway-line-5: #996CAC  /* 5호선 - 보라 */
--subway-line-6: #CD7C2F  /* 6호선 - 갈색 */
--subway-line-7: #747F00  /* 7호선 - 올리브 */
--subway-line-8: #E6186C  /* 8호선 - 분홍 */
--subway-line-9: #BDB092  /* 9호선 - 금색 */
```

**사용 예시**:
- 호선 카드 배경에 각 노선 색상 사용
- 채팅방 헤더에 노선 색상 인디케이터
- 최소한의 포인트 컬러로만 사용

---

## ✍️ 타이포그래피

### 폰트 패밀리
```css
font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
```

**Pretendard 선택 이유**:
- 한글 최적 가독성
- 다양한 무게(weight) 지원
- 오픈소스 무료 라이선스

### 폰트 크기
```css
--font-size: 16px           /* 기본 */
--input-font-size: 16px     /* iOS 줌 방지 필수 */
```

### 폰트 무게
```css
--font-weight-medium: 600   /* 제목, 버튼 */
--font-weight-normal: 400   /* 본문 */
```

---

## 📐 간격 & 레이아웃

### 터치 영역
```css
--touch-target-min: 44px    /* 최소 터치 타겟 */
```
- 모든 버튼/탭: 최소 44px × 44px
- 엄지 닿기 쉬운 하단 배치 우선

### Safe Area (아이폰 노치 대응)
```css
--safe-area-top: env(safe-area-inset-top)
--safe-area-bottom: env(safe-area-inset-bottom)
--safe-area-left: env(safe-area-inset-left)
--safe-area-right: env(safe-area-inset-right)
```

### Border Radius
```css
--radius: 0.75rem           /* 12px - 모던한 느낌 */
```

---

## 🖼️ 주요 화면 구성

### 1. 메인 화면 (호선 선택)

**구성 요소**:
- 헤더: 서비스명 + 설명
- 호선 카드 리스트 (1~9호선)
- 하단 안내 배너 (9시 리셋 안내)

**호선 카드 디자인**:
```
┌─────────────────────────────────┐
│  ⭕1  1호선          →         │ ← 노선 색상 배경
│      지금 234명                 │
└─────────────────────────────────┘
```
- 각 호선 고유 색상 배경
- 흰색 텍스트 + 반투명 아이콘
- 현재 활동 인원 표시
- 미세한 그라데이션 오버레이

### 2. 채팅방 화면

**구성 요소**:
- 헤더: 뒤로가기 + 호선명 + 리셋 시간
- 메시지 영역 (스크롤 가능)
- 입력창 (하단 고정)

**헤더 예시**:
```
← ● 2호선 채팅방
   3시간 24분 후 리셋
```

**말풍선 디자인**:
- **내 메시지**: 검정 배경, 우측 정렬, 하단 우측 코너 제거
- **상대 메시지**: 연한 회색 배경, 좌측 정렬, 하단 좌측 코너 제거
- **익명 ID**: "출근러1234" 형식 (메시지 위에 작게)
- **타임스탬프**: 메시지 아래 작게

**입력창**:
- 자동 높이 조절 (최대 120px)
- 전송 버튼: 44px 원형, 검정 배경
- Safe Area Bottom 대응

---

## 🎯 주요 UX 원칙

### 1. 한 손 조작 최적화
- 중요 버튼은 하단 1/3 영역에
- 스와이프 제스처 지원
- 큰 터치 영역 (최소 44px)

### 2. 모바일 퍼스트
- 데스크톱 버전 지원하지 않음
- 세로 모드만 지원
- 뷰포트: 375px ~ 430px 최적화

### 3. 성능
- 부드러운 스크롤
- 즉각적인 피드백 (active 상태)
- 로딩 최소화

### 4. 익명성
- 로그인 불필요
- 자동 생성 닉네임 (출근러/퇴근러/학생/직장인 + 4자리 숫자)
- 매일 9시 리셋으로 임시성 강조

---

## 🎭 인터랙션 & 애니메이션

### 버튼 피드백
```css
/* 탭 시 */
active:scale-[0.98]
transition-all

/* 비활성화 시 */
disabled:opacity-30
```

### 페이지 전환
- 간단한 fade 또는 slide
- 과도한 애니메이션 지양

---

## 📋 컴포넌트 목록

### SubwayLineCard
- **Props**: lineNumber, activeUsers, color, onClick
- 터치 영역 최소 44px
- 노선 색상 동적 적용

### ChatBubble
- **Props**: message, isMine, timestamp, anonymousId
- 좌우 정렬 분기
- 말풍선 코너 다르게 처리

### ChatInput
- 자동 높이 조절 textarea
- iOS 줌 방지 (16px)
- Safe Area Bottom 대응

### ChatRoom
- 무한 스크롤 준비
- 자동 하단 스크롤
- 리셋 타이머 표시

---

## 🚀 Claude에게 요청 시 프롬프트 예시

```
서울 지하철 출퇴근길 익명 채팅 서비스를 만들어주세요.

**컨셉**:
- 모던 미니멀리즘 (Threads, Linear 스타일)
- 서울 지하철 1~9호선 실제 색상 사용
- 한 손 엄지 조작 최적화
- 매일 오전 9시 리셋되는 임시 채팅방

**필수 요구사항**:
1. 모바일 웹 전용 (세로 모드)
2. Pretendard 한글 폰트 적용
3. 44px 최소 터치 영역
4. 16px 입력창 폰트 (iOS 줌 방지)
5. Safe Area 대응 (아이폰 노치)

**화면 구성**:
1. 메인: 1~9호선 카드 리스트, 각 호선 색상 배경, 활동 인원 표시
2. 채팅방: 익명 ID, 말풍선, 리셋 타이머, 하단 고정 입력창

**디자인 톤**:
- 모노크롬 기반 + 호선 색상 포인트
- 깔끔한 말풍선 (카톡 스타일 지양)
- 미니멀한 아이콘
- 불필요한 장식 없음

첨부: DESIGN_SYSTEM.md 참고
```

---

## 📦 추가 리소스

### 노선 색상 HEX 코드 (복사용)
```
1호선: #0052A4
2호선: #00A84D
3호선: #EF7C1C
4호선: #00A5DE
5호선: #996CAC
6호선: #CD7C2F
7호선: #747F00
8호선: #E6186C
9호선: #BDB092
```

### Pretendard 폰트 CDN
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard-dynamic-subset.min.css">
```

### 참고 서비스
- **Threads** (Meta) - 모던한 소셜 UI
- **Linear** - 미니멀한 프로젝트 관리
- **Arc Browser** - 깔끔한 인터페이스
- **서울교통공사 앱** - 실제 노선 색상

---

## 🔧 기술 스택 (권장)

- **프레임워크**: React + TypeScript
- **스타일링**: Tailwind CSS v4
- **폰트**: Pretendard
- **백엔드 (옵션)**: Supabase (실시간 채팅)
- **애니메이션 (필요시)**: Motion (Framer Motion)

---

## ✅ 체크리스트

### 디자인 완성도 확인:

- [ ] 모든 터치 영역이 44px 이상인가?
- [ ] 입력창 폰트 크기가 16px인가?
- [ ] Safe Area가 적용되었는가?
- [ ] 한글 폰트가 Pretendard인가?
- [ ] 노선 색상이 정확한가?
- [ ] 익명 ID 시스템이 있는가?
- [ ] 9시 리셋 안내가 있는가?
- [ ] 한 손으로 편하게 조작 가능한가?

---

**작성일**: 2025-12-31
**버전**: v2.0
**작성자**: Claude Sonnet 4.5
