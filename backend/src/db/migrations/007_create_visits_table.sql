-- 방문 로그 테이블 (일별 사용자 수 추적용)
CREATE TABLE IF NOT EXISTS visits (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  subway_line_id INTEGER REFERENCES subway_lines(id) ON DELETE SET NULL,
  visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT
);

-- 인덱스: 날짜별 조회 최적화
CREATE INDEX IF NOT EXISTS idx_visits_visited_at ON visits(visited_at);
CREATE INDEX IF NOT EXISTS idx_visits_session_id ON visits(session_id);
CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(DATE(visited_at));
