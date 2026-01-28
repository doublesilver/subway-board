# Coding Standards

## Code Style
- JavaScript 기반 (TypeScript 미사용)
- Frontend: React 함수형 컴포넌트 + hooks
- Backend: CommonJS(require) + Express 미들웨어 구조
- 세미콜론 사용, 2-space 들여쓰기 유지
- 비동기 처리: async/await 우선

## Preferred Libraries
- HTTP: axios
- Realtime: socket.io / socket.io-client
- Routing: react-router-dom
- Backend: express, pg, helmet, express-rate-limit, winston, morgan

## Language Rule (언어 규칙)
- **기본 원칙**: 모든 대화, 문서(Artifacts), 태스크 추적(Task Status), 주석은 **한국어**로 작성합니다.
- **예외**: 
  - 코드 내의 변수명, 함수명, 클래스명 등 실제 코드는 **영어**를 사용합니다.
  - 고유명사나 기술 용어는 필요 시 영어를 병기합니다.

# Agent Operational Protocols (Applied from GitHub Research)

## 1. The Bead Principle (Context Persistence)
> *Source: Gastown*
- **Philosophy**: Chat context is ephemeral; Artifacts are eternal.
- **Rule**: Treat every task as an atomic unit ("Bead").
- **Action**: 
  - Before starting: Read `task.md` to identify the current Bead.
  - During work: Update `task.md` immediately upon completing a sub-task.
  - Closing: Save a "Context Snapshot" in `task.md` before stopping.

## 2. Role-Based Execution (Skills System)
> *Source: Everything Claude Code*
- **Philosophy**: Do not be a generalist; be a sequence of specialists.
- **Rule**: Explicitly adopt a role for each phase.
- **Roles**:
  - **[Architect]**: When creating `implementation_plan.md`. Focus on structure, not syntax.
  - **[Engineer]**: When writing code. Focus on TDD and atomic commits.
  - **[Reviewer]**: When creating `walkthrough.md`. Focus on critical analysis, not just confirmation.
- **skill**: If a repetitive task arises (e.g., Scraping), define a `SKILL_*.md` file and follow it rigorously.

## 3. Impact Scoring (Prioritization)
> *Source: x-algorithm*
- **Philosophy**: Not all tasks are equal. Rank them.
- **Rule**: When multiple paths exist, calculate Priority Score: `P = (Impact * Urgency) / Effort`.
- **Action**: Prioritize high `P` tasks. If a user request has low `P`, clarify intent or suggest a higher `P` alternative.
