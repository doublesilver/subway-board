-- 시간대별 호선별 방문 집계 테이블
CREATE TABLE IF NOT EXISTS hourly_visits (
  id SERIAL PRIMARY KEY,
  visit_date DATE NOT NULL,
  visit_hour SMALLINT NOT NULL,
  subway_line_id INTEGER REFERENCES subway_lines(id) ON DELETE CASCADE,
  visit_count INTEGER DEFAULT 0,
  UNIQUE(visit_date, visit_hour, subway_line_id)
);

CREATE INDEX IF NOT EXISTS idx_hourly_visits_date ON hourly_visits(visit_date DESC);
