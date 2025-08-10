-- Intelligent Learning Chatbot - Unified Database Schema
-- PostgreSQL用のスキーマ定義

-- n8n LangChain Memory用のチャット履歴テーブル
CREATE TABLE IF NOT EXISTS n8n_chat_histories (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    message JSONB NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, timestamp)
);

CREATE INDEX IF NOT EXISTS idx_n8n_chat_histories_session_id ON n8n_chat_histories(session_id);
CREATE INDEX IF NOT EXISTS idx_n8n_chat_histories_timestamp ON n8n_chat_histories(timestamp DESC);

-- セッションテーブル
CREATE TABLE IF NOT EXISTS sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) DEFAULT 'anonymous',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 会話履歴テーブル
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    user_message TEXT,
    ai_response TEXT,
    user_id VARCHAR(255),
    context_type VARCHAR(50) DEFAULT 'general',
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
);

-- フィードバックテーブル
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL,
    session_id UUID NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    is_helpful BOOLEAN,
    feedback_text TEXT,
    feedback_type VARCHAR(50) DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
);

-- 学習改善テーブル
CREATE TABLE IF NOT EXISTS learning_improvements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feedback_id UUID NOT NULL,
    original_response TEXT,
    improved_response TEXT,
    improvement_type VARCHAR(50) DEFAULT 'user_correction',
    applied BOOLEAN DEFAULT false,
    applied_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (feedback_id) REFERENCES feedback(id) ON DELETE CASCADE
);

-- エラーログテーブル
CREATE TABLE IF NOT EXISTS error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    error_message TEXT,
    error_code VARCHAR(100),
    session_id UUID,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB,
    FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE SET NULL
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_is_active ON sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON sessions(last_activity DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);

CREATE INDEX IF NOT EXISTS idx_feedback_conversation_id ON feedback(conversation_id);
CREATE INDEX IF NOT EXISTS idx_feedback_session_id ON feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON feedback(rating);

CREATE INDEX IF NOT EXISTS idx_learning_improvements_feedback_id ON learning_improvements(feedback_id);
CREATE INDEX IF NOT EXISTS idx_learning_improvements_applied ON learning_improvements(applied);

CREATE INDEX IF NOT EXISTS idx_error_logs_session_id ON error_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs(timestamp DESC);

-- ヘルパー関数: セッションの平均評価を取得
CREATE OR REPLACE FUNCTION get_session_rating_average(p_session_id UUID)
RETURNS NUMERIC AS $$
BEGIN
    RETURN (
        SELECT ROUND(AVG(f.rating)::numeric, 2)
        FROM feedback f
        WHERE f.session_id = p_session_id
    );
END;
$$ LANGUAGE plpgsql;

-- トリガー: updated_atの自動更新
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ビュー: アクティブセッションの統計
CREATE OR REPLACE VIEW active_session_stats AS
SELECT 
    s.session_id,
    s.user_id,
    s.started_at,
    s.last_activity,
    COUNT(DISTINCT c.id) as total_conversations,
    AVG(f.rating) as avg_rating,
    MAX(c.created_at) as last_message_at,
    (CURRENT_TIMESTAMP - s.last_activity) as idle_duration
FROM sessions s
LEFT JOIN conversations c ON s.session_id = c.session_id
LEFT JOIN feedback f ON c.id = f.conversation_id
WHERE s.is_active = true
GROUP BY s.session_id, s.user_id, s.started_at, s.last_activity;

-- ビュー: 改善が適用された会話
CREATE OR REPLACE VIEW improved_conversations AS
SELECT 
    c.id as conversation_id,
    c.session_id,
    c.user_message,
    c.ai_response as original_response,
    li.improved_response,
    f.rating,
    f.feedback_text,
    li.improvement_type,
    li.applied,
    li.applied_at
FROM conversations c
INNER JOIN feedback f ON c.id = f.conversation_id
INNER JOIN learning_improvements li ON f.id = li.feedback_id
WHERE li.improved_response IS NOT NULL
ORDER BY li.created_at DESC;

-- サンプルデータ挿入（オプション）
-- INSERT INTO sessions (user_id) VALUES ('test_user') RETURNING session_id;