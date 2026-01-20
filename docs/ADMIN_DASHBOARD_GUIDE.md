# 관리자 대시보드 사용 가이드

## 목차
- [접속 방법](#접속-방법)
- [대시보드 화면 구성](#대시보드-화면-구성)
- [커스텀 쿼리 사용법](#커스텀-쿼리-사용법)
- [데이터베이스 테이블 구조](#데이터베이스-테이블-구조)
- [유용한 쿼리 모음](#유용한-쿼리-모음)
- [환경변수 설정](#환경변수-설정)
- [보안 설정](#보안-설정)

---

## 접속 방법

### 1. 대시보드 URL
```
https://www.gagisiro.com/admin
```

### 2. 로그인
- Railway에서 설정한 `ADMIN_DASHBOARD_PASSWORD` 입력
- 로그인 성공 시 24시간 동안 유효한 토큰 발급
- 24시간 후 자동 로그아웃 (재로그인 필요)

---

## 대시보드 화면 구성

### 전체 현황 탭
서비스의 핵심 지표를 한눈에 확인할 수 있습니다.

| 지표 | 설명 |
|------|------|
| **오늘 방문자 (DAU)** | 오늘 방문한 고유 사용자 수 |
| **주간 방문자 (WAU)** | 최근 7일간 방문한 고유 사용자 수 |
| **월간 방문자 (MAU)** | 최근 30일간 방문한 고유 사용자 수 |
| **재방문율** | 지난주 방문자 중 이번주에도 방문한 비율 |

**차트:**
- 일별 방문자 추이 (순방문자 vs 총방문)
- 전체 게시글/댓글/피드백 수

### 호선별 통계 탭
호선별 방문 현황을 분석합니다.

- 호선별 방문 현황 (막대 차트)
- 오늘의 호선별 현황 (카드)
- 호선별 방문 비율 (파이 차트)

### 시간대별 분석 탭
어느 시간대에 방문이 많은지 확인합니다.

- 시간대별 방문 분포 (막대 차트)
- 시간대별 상세 테이블 (시간, 방문수, 비율)

### 커스텀 쿼리 탭
직접 SQL 쿼리를 실행하여 원하는 데이터를 조회합니다.

---

## 커스텀 쿼리 사용법

### 기본 규칙
1. **SELECT 문만 허용** - INSERT, UPDATE, DELETE 등은 차단됨
2. **위험 키워드 차단** - DROP, ALTER, TRUNCATE 등 사용 불가
3. **결과 제한** - 최대 100행까지 화면에 표시

### 사용 방법
1. 커스텀 쿼리 탭으로 이동
2. SQL 입력창에 쿼리 작성
3. "쿼리 실행" 버튼 클릭
4. 결과 확인 (행 수, 컬럼명, 데이터)

### 자주 사용하는 쿼리 버튼
| 버튼 | 설명 |
|------|------|
| 최근 방문자 | 최근 50명의 방문자 기록 |
| 호선별 총합 | 전체 기간 호선별 방문 합계 |
| 일별 순방문자 | 최근 30일 일별 순방문자 수 |
| 시간대별 총합 | 전체 기간 시간대별 방문 합계 |

---

## 데이터베이스 테이블 구조

### subway_lines (호선 정보)
```sql
SELECT * FROM subway_lines;
```
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | SERIAL | 고유 ID |
| line_number | VARCHAR(10) | 호선 번호 (1~9) |
| line_name | VARCHAR(50) | 호선 이름 (1호선~9호선) |
| color | VARCHAR(7) | 호선 색상 (#0052A4) |

### posts (게시글)
```sql
SELECT id, subway_line_id, created_at, deleted_at FROM posts LIMIT 10;
```
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | SERIAL | 게시글 ID |
| subway_line_id | INTEGER | 호선 ID (FK) |
| content | TEXT | 내용 |
| reply_to | INTEGER | 답장 대상 게시글 ID |
| created_at | TIMESTAMP | 작성 시간 |
| deleted_at | TIMESTAMP | 삭제 시간 (NULL이면 미삭제) |

### comments (댓글)
```sql
SELECT id, post_id, created_at FROM comments LIMIT 10;
```
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | SERIAL | 댓글 ID |
| post_id | INTEGER | 게시글 ID (FK) |
| content | TEXT | 내용 |
| created_at | TIMESTAMP | 작성 시간 |

### daily_visits (일별 방문)
```sql
SELECT * FROM daily_visits ORDER BY visit_date DESC LIMIT 20;
```
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | SERIAL | 고유 ID |
| visit_date | DATE | 방문 날짜 |
| subway_line_id | INTEGER | 호선 ID (FK) |
| visit_count | INTEGER | 방문 횟수 |

### hourly_visits (시간대별 방문)
```sql
SELECT * FROM hourly_visits WHERE visit_date = CURRENT_DATE ORDER BY visit_hour;
```
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | SERIAL | 고유 ID |
| visit_date | DATE | 방문 날짜 |
| visit_hour | SMALLINT | 시간 (0~23) |
| subway_line_id | INTEGER | 호선 ID (FK) |
| visit_count | INTEGER | 방문 횟수 |

### unique_visitors (고유 방문자)
```sql
SELECT * FROM unique_visitors ORDER BY created_at DESC LIMIT 20;
```
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | SERIAL | 고유 ID |
| visitor_hash | VARCHAR(16) | 방문자 해시 (익명화) |
| visit_date | DATE | 방문 날짜 |
| first_line_id | INTEGER | 최초 방문 호선 ID |
| lines_visited | SMALLINT | 방문한 호선 수 |
| created_at | TIMESTAMP | 기록 시간 |

### feedback (피드백)
```sql
SELECT id, created_at, LENGTH(content) as length FROM feedback ORDER BY created_at DESC LIMIT 10;
```
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | SERIAL | 고유 ID |
| content | TEXT | 피드백 내용 |
| user_session_id | VARCHAR(255) | 세션 ID |
| ip_address | VARCHAR(45) | IP 주소 |
| created_at | TIMESTAMP | 작성 시간 |

---

## 유용한 쿼리 모음

### 기본 통계

#### 오늘 호선별 방문자 수
```sql
SELECT sl.line_name, COALESCE(dv.visit_count, 0) as visits
FROM subway_lines sl
LEFT JOIN daily_visits dv ON sl.id = dv.subway_line_id AND dv.visit_date = CURRENT_DATE
ORDER BY sl.line_number::int;
```

#### 최근 7일 일별 순방문자 추이
```sql
SELECT visit_date, COUNT(*) as unique_visitors
FROM unique_visitors
WHERE visit_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY visit_date
ORDER BY visit_date;
```

#### 이번 주 vs 지난 주 비교
```sql
SELECT
  (SELECT COUNT(DISTINCT visitor_hash) FROM unique_visitors WHERE visit_date >= CURRENT_DATE - INTERVAL '7 days') as this_week,
  (SELECT COUNT(DISTINCT visitor_hash) FROM unique_visitors WHERE visit_date BETWEEN CURRENT_DATE - INTERVAL '14 days' AND CURRENT_DATE - INTERVAL '7 days') as last_week;
```

### 호선별 분석

#### 가장 인기 있는 호선 TOP 3
```sql
SELECT sl.line_name, SUM(dv.visit_count) as total
FROM daily_visits dv
JOIN subway_lines sl ON dv.subway_line_id = sl.id
GROUP BY sl.line_name
ORDER BY total DESC
LIMIT 3;
```

#### 호선별 평균 일일 방문자
```sql
SELECT sl.line_name, ROUND(AVG(dv.visit_count), 1) as avg_daily
FROM daily_visits dv
JOIN subway_lines sl ON dv.subway_line_id = sl.id
GROUP BY sl.line_name
ORDER BY avg_daily DESC;
```

### 시간대 분석

#### 피크 시간대 (상위 3개)
```sql
SELECT visit_hour || ':00' as hour, SUM(visit_count) as visits
FROM hourly_visits
GROUP BY visit_hour
ORDER BY visits DESC
LIMIT 3;
```

#### 오전 vs 오후 비교
```sql
SELECT
  CASE WHEN visit_hour < 12 THEN '오전' ELSE '오후' END as period,
  SUM(visit_count) as visits
FROM hourly_visits
GROUP BY CASE WHEN visit_hour < 12 THEN '오전' ELSE '오후' END;
```

### 콘텐츠 분석

#### 호선별 게시글 수
```sql
SELECT sl.line_name, COUNT(p.id) as posts
FROM subway_lines sl
LEFT JOIN posts p ON sl.id = p.subway_line_id AND p.deleted_at IS NULL
GROUP BY sl.line_name
ORDER BY posts DESC;
```

#### 최근 7일 일별 게시글 수
```sql
SELECT DATE(created_at) as date, COUNT(*) as posts
FROM posts
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days' AND deleted_at IS NULL
GROUP BY DATE(created_at)
ORDER BY date;
```

#### 답장이 가장 많은 게시글
```sql
SELECT p.id, COUNT(r.id) as reply_count
FROM posts p
LEFT JOIN posts r ON p.id = r.reply_to
WHERE p.deleted_at IS NULL
GROUP BY p.id
HAVING COUNT(r.id) > 0
ORDER BY reply_count DESC
LIMIT 10;
```

### 사용자 행동 분석

#### 재방문자 비율
```sql
WITH returning_users AS (
  SELECT visitor_hash, COUNT(DISTINCT visit_date) as visit_days
  FROM unique_visitors
  WHERE visit_date >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY visitor_hash
)
SELECT
  COUNT(*) FILTER (WHERE visit_days = 1) as one_time,
  COUNT(*) FILTER (WHERE visit_days > 1) as returning,
  ROUND(COUNT(*) FILTER (WHERE visit_days > 1) * 100.0 / COUNT(*), 1) as returning_rate
FROM returning_users;
```

#### 다중 호선 방문자 (여러 호선 방문한 사람)
```sql
SELECT lines_visited, COUNT(*) as users
FROM unique_visitors
WHERE visit_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY lines_visited
ORDER BY lines_visited;
```

---

## 환경변수 설정

Railway 대시보드 → 백엔드 서비스 → Variables에서 설정:

| 변수명 | 필수 | 설명 |
|--------|------|------|
| `ADMIN_DASHBOARD_PASSWORD` | O | 대시보드 로그인 비밀번호 |
| `ADMIN_JWT_SECRET` | X | JWT 시크릿 (미설정시 ADMIN_KEY 사용) |
| `ADMIN_IP_WHITELIST` | X | 허용 IP 목록 (콤마 구분) |
| `ADMIN_KEY` | O | 기존 관리자 API 키 |

### 예시
```
ADMIN_DASHBOARD_PASSWORD=MySecurePassword123!
ADMIN_JWT_SECRET=randomSecretString32chars!!
ADMIN_IP_WHITELIST=123.45.67.89,98.76.54.32
```

---

## 보안 설정

### IP 화이트리스트 (선택)
특정 IP에서만 대시보드에 접근하도록 제한할 수 있습니다.

```
ADMIN_IP_WHITELIST=123.45.67.89,98.76.54.0/24
```

- 단일 IP: `123.45.67.89`
- CIDR 표기: `192.168.1.0/24` (192.168.1.0 ~ 192.168.1.255)
- 여러 개: 콤마로 구분

### 보안 권장사항
1. **강력한 비밀번호** - 최소 12자, 대소문자+숫자+특수문자 조합
2. **IP 제한** - 가능하면 관리자 IP만 화이트리스트에 등록
3. **주기적 비밀번호 변경** - 3개월마다 변경 권장
4. **JWT 시크릿 설정** - 32자 이상의 랜덤 문자열 사용

---

## 문제 해결

### 로그인이 안 될 때
1. Railway에서 `ADMIN_DASHBOARD_PASSWORD` 환경변수 확인
2. 백엔드 서비스 재시작 (환경변수 변경 후)
3. 브라우저 캐시/쿠키 삭제 후 재시도

### 데이터가 안 보일 때
1. 통계 테이블에 데이터가 있는지 커스텀 쿼리로 확인
2. 기간 설정 확인 (7일 → 30일로 변경)
3. 백엔드 로그 확인 (Railway → Logs)

### 쿼리 실행 오류
1. SELECT 문으로 시작하는지 확인
2. 테이블명, 컬럼명 오타 확인
3. PostgreSQL 문법 확인 (MySQL과 다름)

---

## 업데이트 내역

| 날짜 | 내용 |
|------|------|
| 2026-01-20 | 대시보드 최초 구현 |
| 2026-01-20 | 한글화 적용 |
