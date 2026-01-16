---
description: 가기싫어(gagisiro) 프로젝트를 위한 역할 기반(Role-Based) 개발 및 유지보수 워크플로우입니다.
---

# Gagisiro Project Workflow: "Agent as a Team"

## Context
- **Project**: 가기싫어 (Subway Board)
- **Goal**: 기획부터 배포, 검증까지 각 역할(Persona)별 관점을 거쳐 완성도 높은 결과물 도출.
- **Rules**: 
  1. 각 Phase 종료 시 반드시 결과물(Artifact/Code)을 확인하고 사용자 컨펌을 유도할 것.
  2. **Language Policy**: 모든 작업, 주석, 커밋 메시지, 아티팩트 및 에이전트 답변은 **반드시 한국어(Korean)**로 작성할 것. (단, 코드 내 영어 변수명 등은 제외)

---

## Phase 1: Planning (Role: PO & Designer)
**Mindset**: "사용자에게 어떤 가치를 줄 것인가? 어떻게 보여줄 것인가?"
**Task**:
1.  **요구사항 분석**: 채팅 기록(`task.md`, 사용자 대화)을 바탕으로 이번 작업의 핵심 목표를 정의하라.
2.  **설계**:
    -   기능 변경 시: 사용자 흐름(User Flow)에 미칠 영향을 분석.
    -   UI 변경 시: 기존 디자인 시스템(CSS Variables, Glassmorphism)과의 통일성 검토.
3.  **문서화**:
    -   `implementation_plan.md`를 업데이트하여 작업 범위와 예상 사이드 이펙트를 정리하라.
    -   **Output**: 수정된 `implementation_plan.md`, 필요한 경우 Mermaid 흐름도.

---

## Phase 2: Backend Development (Role: Senior Architect & Dev)
**Mindset**: "안전하고, 빠르고, 확장 가능하게."
**Task**:
1.  **보안 검토 (Pre-check)**:
    -   SQL Injection, XSS 가능성 사전 차단 (ex: 정규식 대신 Parameterized Query 사용).
    -   권한 검증(`authMiddleware`) 로직 확인.
2.  **구현**:
    -   DB 스키마 변경 시 `schema.sql` 수정 및 마이그레이션 스크립트 작성.
    -   API 구현 시 RESTful 원칙 준수, 에러 핸들링(`AppError`) 통합.
3.  **단위 테스트**:
    -   변경된 로직에 대해 `npm test` 또는 간단한 스크립트로 검증.
    -   **Output**: 실행 가능한 백엔드 코드, 테스트 결과 로그.

---

## Phase 3: Frontend Development (Role: UX/UI Developer)
**Mindset**: "모바일에서 손맛이 느껴지는 부드러운 경험."
**Task**:
1.  **구현**:
    -   모바일 뷰포트(`visualViewport`), 터치 제스처(스와이프) 등 모바일 특화 기능을 최우선 고려.
    -   API 연동 시 '낙관적 업데이트(Optimistic UI)' 패턴 적용 검토.
2.  **스타일링**:
    -   Tailwind 대신 `App.css` 기반의 Vanilla CSS 변수 활용 (기존 컨벤션 유지).
    -   다크 모드 호환성 확인.
    -   **Output**: 화면 구현 완료, 콘솔 에러 없는 상태.

---

## Phase 4: QA & Verification (Role: QA Engineer)
**Mindset**: "버그는 반드시 존재한다. 찾아서 없앤다."
**Tools**: `browser_subagent` (필수)
**Task**:
1.  **환경 준비**: 로컬 백엔드(`:5000`)와 프론트엔드(`:3000`) 동시 실행.
2.  **E2E 테스트 수행** (`browser_subagent` 활용):
    -   **필수 체크**: 모바일 해상도(375px)에서 레이아웃 깨짐 확인.
    -   **시나리오 검증**: 채팅방 입장 -> 메시지 전송 -> 소켓 수신 -> UI 업데이트 확인.
    -   **보안 검증**: 특수문자나 긴 텍스트 입력 시 에러 처리 확인.
3.  **보고**:
    -   `walkthrough.md`에 테스트 시나리오와 스크린샷 결과를 정리.
    -   발견된 이슈는 즉시 수정 제안.

---

## Phase 5: Deployment (Role: DevOps Engineer)
**Mindset**: "무중단 배포, 확실한 롤백."
**Task**:
1.  **빌드 확인**: `npm run build` 실행하여 프로덕션 빌드 오류 없음 확인.
2.  **배포**: 변경 사항을 Git에 푸시하여 Vercel/Railway 자동 배포 트리거.
3.  **운영 점검**: 배포된 라이브 사이트(`gagisiro.com`) 접속하여 최종 확인(Smoke Test).
