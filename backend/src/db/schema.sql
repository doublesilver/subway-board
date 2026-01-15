-- 호선 테이블
CREATE TABLE IF NOT EXISTS subway_lines (
  id SERIAL PRIMARY KEY,
  line_number VARCHAR(10) NOT NULL UNIQUE,
  line_name VARCHAR(50) NOT NULL,
  color VARCHAR(7) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 게시글 테이블
CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  subway_line_id INTEGER NOT NULL REFERENCES subway_lines(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP DEFAULT NULL
);

-- 댓글 테이블
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP DEFAULT NULL
);

-- 피드백 테이블
CREATE TABLE IF NOT EXISTS feedback (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  user_session_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT
);

-- 일별 호선별 접속자 수 테이블
CREATE TABLE IF NOT EXISTS daily_visits (
  id SERIAL PRIMARY KEY,
  visit_date DATE NOT NULL,
  subway_line_id INTEGER REFERENCES subway_lines(id) ON DELETE CASCADE,
  visit_count INTEGER DEFAULT 0,
  UNIQUE(visit_date, subway_line_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_posts_subway_line ON posts(subway_line_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_visits_date ON daily_visits(visit_date DESC);

-- 서울 지하철 호선 데이터 삽입 (1-9호선만)
INSERT INTO subway_lines (line_number, line_name, color) VALUES
  ('1', '1호선', '#0052A4'),
  ('2', '2호선', '#00A84D'),
  ('3', '3호선', '#EF7C1C'),
  ('4', '4호선', '#00A5DE'),
  ('5', '5호선', '#996CAC'),
  ('6', '6호선', '#CD7C2F'),
  ('7', '7호선', '#747F00'),
  ('8', '8호선', '#E6186C'),
  ('9', '9호선', '#BDB092')
ON CONFLICT (line_number) DO NOTHING;
