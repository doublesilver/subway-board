-- 피드백 테이블 생성
CREATE TABLE IF NOT EXISTS feedback (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    user_session_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT
);

-- 인덱스 추가 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);
