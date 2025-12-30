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

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_posts_subway_line ON posts(subway_line_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);

-- 서울 지하철 호선 데이터 삽입
INSERT INTO subway_lines (line_number, line_name, color) VALUES
  ('1', '1호선', '#0052A4'),
  ('2', '2호선', '#00A84D'),
  ('3', '3호선', '#EF7C1C'),
  ('4', '4호선', '#00A5DE'),
  ('5', '5호선', '#996CAC'),
  ('6', '6호선', '#CD7C2F'),
  ('7', '7호선', '#747F00'),
  ('8', '8호선', '#E6186C'),
  ('9', '9호선', '#BDB092'),
  ('경의중앙', '경의중앙선', '#77C4A3'),
  ('공항', '공항철도', '#0090D2'),
  ('수인분당', '수인분당선', '#FABE00'),
  ('신분당', '신분당선', '#D31145'),
  ('경춘', '경춘선', '#0C8E72'),
  ('우이신설', '우이신설선', '#B0CE18'),
  ('서해', '서해선', '#8FC31F'),
  ('김포골드', '김포골드라인', '#A17E00'),
  ('신림', '신림선', '#6789CA'),
  ('GTX-A', 'GTX-A', '#9B1D6A')
ON CONFLICT (line_number) DO NOTHING;
