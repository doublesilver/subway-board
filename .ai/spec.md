# 프로젝트 스펙 (SPEC.md)

## 1. 개요
*   **프로젝트명**: Subway Board (gagisiro.com)
*   **목표**: 익명 지하철 커뮤니티 "가기싫어"의 백엔드 시스템 구축 및 운영 자동화.

## 2. 기술 스택 (Tech Stack)
*   **Backend**: Node.js, Express (CommonJS)
*   **Database**: PostgreSQL
*   **Documentation**: Swagger (OpenAPI 3.0)
*   **CI/CD**: GitHub Actions (Test -> Deploy)
*   **Deployment**: Railway (Backend), Vercel (Frontend)

## 3. 주요 기능 명세
### API 문서화 (Swagger)
*   도구: `swagger-jsdoc`, `swagger-ui-express`
*   경로: `/api-docs`
*   대상: 주요 API 엔드포인트 (게시글, 댓글, 호선 정보 등)

### 자동화 파이프라인 (CI/CD)
*   플랫폼: GitHub Actions
*   브랜치: `main`
*   트리거: Push
*   작업:
    1.  **Test**: `npm test` 실행 (Node.js 22)
    2.  **Deploy**: 테스트 성공 시 Railway 배포 연동 (Railway의 자동 배포 기능 활용)