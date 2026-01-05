-- users 테이블 변경
-- 1. kakao_id를 nullable로 변경 (익명 사용자를 위해)
ALTER TABLE users ALTER COLUMN kakao_id DROP NOT NULL;

-- 2. anonymous_id 컬럼 추가 (익명 사용자 식별용)
ALTER TABLE users ADD COLUMN IF NOT EXISTS anonymous_id VARCHAR(100) UNIQUE;

-- 3. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_users_anonymous_id ON users(anonymous_id);
