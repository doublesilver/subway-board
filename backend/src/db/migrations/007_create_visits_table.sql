-- 일별 호선별 접속자 수 테이블
CREATE TABLE IF NOT EXISTS daily_visits (
  id SERIAL PRIMARY KEY,
  visit_date DATE NOT NULL,
  subway_line_id INTEGER REFERENCES subway_lines(id) ON DELETE CASCADE,
  visit_count INTEGER DEFAULT 0,
  UNIQUE(visit_date, subway_line_id)
);

CREATE INDEX IF NOT EXISTS idx_daily_visits_date ON daily_visits(visit_date DESC);
