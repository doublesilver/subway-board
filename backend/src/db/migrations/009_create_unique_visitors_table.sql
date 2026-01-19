-- 고유 방문자 테이블 (중복 방지 + DAU/WAU/MAU)
CREATE TABLE IF NOT EXISTS unique_visitors (
  id SERIAL PRIMARY KEY,
  visitor_hash VARCHAR(16) NOT NULL,
  visit_date DATE NOT NULL,
  first_line_id INTEGER REFERENCES subway_lines(id) ON DELETE CASCADE,
  lines_visited SMALLINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(visitor_hash, visit_date)
);

CREATE INDEX IF NOT EXISTS idx_unique_visitors_date ON unique_visitors(visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_unique_visitors_hash ON unique_visitors(visitor_hash);
