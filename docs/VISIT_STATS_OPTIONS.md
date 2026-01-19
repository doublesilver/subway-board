# 방문자 통계 DB 고도화 옵션

> **작성일**: 2026-01-19
> **목적**: 방문자 통계 테이블 고도화 방안 비교

---

## 현재 구조

### 테이블: `daily_visits`

```sql
CREATE TABLE daily_visits (
  id SERIAL PRIMARY KEY,
  visit_date DATE NOT NULL,
  subway_line_id INTEGER REFERENCES subway_lines(id),
  visit_count INTEGER DEFAULT 0,
  UNIQUE(visit_date, subway_line_id)
);
```

### 데이터 예시

| id | visit_date | subway_line_id | visit_count |
|----|------------|----------------|-------------|
| 1  | 2026-01-19 | 2              | 45          |
| 2  | 2026-01-19 | 7              | 32          |
| 3  | 2026-01-18 | 2              | 51          |
| 4  | 2026-01-18 | 3              | 28          |

### 분석 가능 항목
- ✅ 일별 총 방문자 수
- ✅ 호선별 방문자 수
- ❌ 시간대별 분석
- ❌ 재방문율
- ❌ 디바이스 분석
- ❌ 개별 사용자 행동

---

## 옵션 1: 개별 방문 로그 테이블 추가

### 신규 테이블: `visit_logs`

```sql
CREATE TABLE visit_logs (
  id SERIAL PRIMARY KEY,
  visitor_hash VARCHAR(16) NOT NULL,
  subway_line_id INTEGER REFERENCES subway_lines(id),
  visited_at TIMESTAMP DEFAULT NOW(),
  referrer VARCHAR(255),
  device_type VARCHAR(20)
);

CREATE INDEX idx_visit_logs_visited_at ON visit_logs(visited_at DESC);
CREATE INDEX idx_visit_logs_visitor ON visit_logs(visitor_hash);
```

### 데이터 예시

| id | visitor_hash | subway_line_id | visited_at | referrer | device_type |
|----|--------------|----------------|------------|----------|-------------|
| 1  | a3f2c8e1b9d4 | 2 | 2026-01-19 07:15:32 | direct | mobile |
| 2  | 7b1e9f3c2a8d | 2 | 2026-01-19 07:18:45 | google | desktop |
| 3  | a3f2c8e1b9d4 | 7 | 2026-01-19 07:22:10 | NULL | mobile |
| 4  | c4d8e2f1a9b3 | 3 | 2026-01-19 07:25:33 | direct | mobile |
| 5  | 7b1e9f3c2a8d | 2 | 2026-01-20 07:10:22 | direct | desktop |

### 분석 가능 항목
- ✅ 일별 총 방문자 수
- ✅ 호선별 방문자 수
- ✅ **시간대별 분석** (07:00~07:30 vs 08:00~08:30)
- ✅ **재방문율** (visitor_hash로 다른 날 방문 추적)
- ✅ **디바이스 비율** (mobile 80%, desktop 20%)
- ✅ **호선 이동 패턴** (2호선 → 7호선 이동)
- ✅ **유입 경로 분석**

### 쿼리 예시

```sql
-- 시간대별 방문자 수 (07시대 vs 08시대)
SELECT
  EXTRACT(HOUR FROM visited_at) as hour,
  COUNT(*) as visits
FROM visit_logs
WHERE visited_at::date = '2026-01-19'
GROUP BY hour;

-- 결과
| hour | visits |
|------|--------|
| 7    | 156    |
| 8    | 98     |
```

```sql
-- 재방문율 (이번 주 방문자 중 지난주에도 방문한 비율)
WITH this_week AS (
  SELECT DISTINCT visitor_hash
  FROM visit_logs
  WHERE visited_at >= '2026-01-13'
),
last_week AS (
  SELECT DISTINCT visitor_hash
  FROM visit_logs
  WHERE visited_at BETWEEN '2026-01-06' AND '2026-01-12'
)
SELECT
  COUNT(DISTINCT tw.visitor_hash) as total_visitors,
  COUNT(DISTINCT lw.visitor_hash) as returning_visitors,
  ROUND(COUNT(DISTINCT lw.visitor_hash)::numeric / COUNT(DISTINCT tw.visitor_hash) * 100, 1) as retention_rate
FROM this_week tw
LEFT JOIN last_week lw ON tw.visitor_hash = lw.visitor_hash;

-- 결과
| total_visitors | returning_visitors | retention_rate |
|----------------|-------------------|----------------|
| 234            | 87                | 37.2%          |
```

```sql
-- 디바이스 비율
SELECT
  device_type,
  COUNT(*) as count,
  ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER() * 100, 1) as percentage
FROM visit_logs
WHERE visited_at::date = '2026-01-19'
GROUP BY device_type;

-- 결과
| device_type | count | percentage |
|-------------|-------|------------|
| mobile      | 198   | 78.0%      |
| desktop     | 52    | 20.5%      |
| tablet      | 4     | 1.5%       |
```

### 용량 예상
- 일 방문자 100명 × 30일 = 3,000 rows/월
- row당 약 100 bytes → **월 300KB**

---

## 옵션 2: 시간대별 집계 테이블

### 신규 테이블: `hourly_visits`

```sql
CREATE TABLE hourly_visits (
  id SERIAL PRIMARY KEY,
  visit_date DATE NOT NULL,
  visit_hour SMALLINT NOT NULL,
  subway_line_id INTEGER REFERENCES subway_lines(id),
  visit_count INTEGER DEFAULT 0,
  UNIQUE(visit_date, visit_hour, subway_line_id)
);

CREATE INDEX idx_hourly_visits_date ON hourly_visits(visit_date DESC);
```

### 데이터 예시

| id | visit_date | visit_hour | subway_line_id | visit_count |
|----|------------|------------|----------------|-------------|
| 1  | 2026-01-19 | 7          | 2              | 28          |
| 2  | 2026-01-19 | 8          | 2              | 17          |
| 3  | 2026-01-19 | 7          | 7              | 19          |
| 4  | 2026-01-19 | 8          | 7              | 13          |
| 5  | 2026-01-18 | 7          | 2              | 31          |
| 6  | 2026-01-18 | 8          | 2              | 20          |

### 분석 가능 항목
- ✅ 일별 총 방문자 수
- ✅ 호선별 방문자 수
- ✅ **시간대별 분석**
- ❌ 재방문율
- ❌ 디바이스 분석
- ❌ 개별 사용자 행동

### 쿼리 예시

```sql
-- 시간대별 피크 분석
SELECT
  visit_hour,
  SUM(visit_count) as total_visits
FROM hourly_visits
WHERE visit_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY visit_hour
ORDER BY total_visits DESC;

-- 결과
| visit_hour | total_visits |
|------------|--------------|
| 7          | 312          |
| 8          | 198          |
```

```sql
-- 호선별 피크 시간대
SELECT
  sl.line_name,
  hv.visit_hour,
  SUM(hv.visit_count) as visits
FROM hourly_visits hv
JOIN subway_lines sl ON hv.subway_line_id = sl.id
WHERE hv.visit_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY sl.line_name, hv.visit_hour
ORDER BY sl.line_name, visits DESC;

-- 결과
| line_name | visit_hour | visits |
|-----------|------------|--------|
| 2호선     | 7          | 156    |
| 2호선     | 8          | 98     |
| 7호선     | 7          | 89     |
| 7호선     | 8          | 67     |
```

### 용량 예상
- 9호선 × 2시간 × 30일 = 540 rows/월
- row당 약 30 bytes → **월 16KB** (매우 적음)

---

## 옵션 3: 고유 방문자 테이블 (DAU/WAU/MAU)

### 신규 테이블: `unique_visitors`

```sql
CREATE TABLE unique_visitors (
  id SERIAL PRIMARY KEY,
  visitor_hash VARCHAR(16) NOT NULL,
  visit_date DATE NOT NULL,
  first_line_id INTEGER REFERENCES subway_lines(id),
  lines_visited SMALLINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(visitor_hash, visit_date)
);

CREATE INDEX idx_unique_visitors_date ON unique_visitors(visit_date DESC);
CREATE INDEX idx_unique_visitors_hash ON unique_visitors(visitor_hash);
```

### 데이터 예시

| id | visitor_hash | visit_date | first_line_id | lines_visited | created_at |
|----|--------------|------------|---------------|---------------|------------|
| 1  | a3f2c8e1b9d4 | 2026-01-19 | 2 | 2 | 2026-01-19 07:15:32 |
| 2  | 7b1e9f3c2a8d | 2026-01-19 | 2 | 1 | 2026-01-19 07:18:45 |
| 3  | c4d8e2f1a9b3 | 2026-01-19 | 3 | 1 | 2026-01-19 07:25:33 |
| 4  | a3f2c8e1b9d4 | 2026-01-18 | 7 | 1 | 2026-01-18 07:22:10 |
| 5  | 7b1e9f3c2a8d | 2026-01-20 | 2 | 1 | 2026-01-20 07:10:22 |

### 분석 가능 항목
- ✅ 일별 총 방문자 수 (정확한 UV)
- ✅ 호선별 방문자 수
- ❌ 시간대별 분석
- ✅ **DAU/WAU/MAU**
- ✅ **재방문율**
- ❌ 디바이스 분석
- ✅ **서버 재시작 대응** (캐시 대신 DB 중복 체크)

### 쿼리 예시

```sql
-- DAU (Daily Active Users)
SELECT visit_date, COUNT(*) as dau
FROM unique_visitors
WHERE visit_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY visit_date
ORDER BY visit_date DESC;

-- 결과
| visit_date | dau |
|------------|-----|
| 2026-01-19 | 87  |
| 2026-01-18 | 92  |
| 2026-01-17 | 78  |
```

```sql
-- WAU (Weekly Active Users)
SELECT COUNT(DISTINCT visitor_hash) as wau
FROM unique_visitors
WHERE visit_date >= CURRENT_DATE - INTERVAL '7 days';

-- 결과
| wau |
|-----|
| 234 |
```

```sql
-- MAU (Monthly Active Users)
SELECT COUNT(DISTINCT visitor_hash) as mau
FROM unique_visitors
WHERE visit_date >= CURRENT_DATE - INTERVAL '30 days';

-- 결과
| mau |
|-----|
| 456 |
```

```sql
-- 주간 리텐션 (지난주 방문자 중 이번주 재방문 비율)
WITH last_week AS (
  SELECT DISTINCT visitor_hash
  FROM unique_visitors
  WHERE visit_date BETWEEN '2026-01-06' AND '2026-01-12'
),
this_week AS (
  SELECT DISTINCT visitor_hash
  FROM unique_visitors
  WHERE visit_date >= '2026-01-13'
)
SELECT
  (SELECT COUNT(*) FROM last_week) as last_week_users,
  COUNT(*) as retained_users,
  ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM last_week) * 100, 1) as retention
FROM last_week lw
WHERE EXISTS (SELECT 1 FROM this_week tw WHERE tw.visitor_hash = lw.visitor_hash);

-- 결과
| last_week_users | retained_users | retention |
|-----------------|----------------|-----------|
| 198             | 67             | 33.8%     |
```

### 용량 예상
- 일 방문자 100명 × 30일 = 3,000 rows/월
- row당 약 50 bytes → **월 150KB**

### 추가 장점: 인메모리 캐시 제거 가능

```javascript
// 현재: 인메모리 캐시 (서버 재시작 시 초기화)
const visitCache = new Map();

// 개선: DB로 중복 체크
const checkDuplicate = async (visitorHash, today) => {
  const result = await pool.query(
    'SELECT 1 FROM unique_visitors WHERE visitor_hash = $1 AND visit_date = $2',
    [visitorHash, today]
  );
  return result.rows.length > 0;
};
```

---

## 옵션 비교 요약

| 항목 | 현재 | 옵션1 (로그) | 옵션2 (시간대) | 옵션3 (UV) |
|------|------|-------------|---------------|-----------|
| **일별 방문자** | ✅ | ✅ | ✅ | ✅ |
| **호선별 통계** | ✅ | ✅ | ✅ | ✅ |
| **시간대 분석** | ❌ | ✅ | ✅ | ❌ |
| **재방문율** | ❌ | ✅ | ❌ | ✅ |
| **DAU/WAU/MAU** | ❌ | ✅ | ❌ | ✅ |
| **디바이스 분석** | ❌ | ✅ | ❌ | ❌ |
| **유입 경로** | ❌ | ✅ | ❌ | ❌ |
| **서버 재시작 대응** | ❌ | ❌ | ❌ | ✅ |
| **월 용량** | ~5KB | ~300KB | ~16KB | ~150KB |
| **구현 복잡도** | - | 중 | 하 | 중 |

---

## 추천 조합

### A. 가벼운 분석 (옵션 2만 추가)
```
daily_visits (기존) + hourly_visits (신규)
```
- 용량 부담 최소
- 시간대별 피크 분석 가능

### B. 중간 분석 (옵션 3만 추가)
```
daily_visits (기존) + unique_visitors (신규)
```
- DAU/WAU/MAU 측정
- 재방문율 분석
- 서버 재시작에도 안정적

### C. 풀 분석 (옵션 1 + 3)
```
daily_visits (기존) + visit_logs (신규) + unique_visitors (신규)
```
- 모든 분석 가능
- 가장 상세한 인사이트

---

## 선택 가이드

| 상황 | 추천 |
|------|------|
| "일단 가볍게 시작하고 싶어" | 옵션 2 (시간대별) |
| "재방문율이 궁금해" | 옵션 3 (UV) |
| "서버 재시작해도 안정적이었으면" | 옵션 3 (UV) |
| "나중에 마케팅 분석도 할거야" | 옵션 1 + 3 (풀 분석) |
