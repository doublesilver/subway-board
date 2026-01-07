-- posts 테이블에 message_type 추가
-- message_type: 'user' (일반 메시지) 또는 'system' (시스템 메시지)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS message_type VARCHAR(20) DEFAULT 'user';

-- 기존 데이터는 모두 'user' 타입으로 설정
UPDATE posts SET message_type = 'user' WHERE message_type IS NULL;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_posts_message_type ON posts(message_type);
