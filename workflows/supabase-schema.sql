-- Intelligent Learning Chatbot - Supabase Schema
-- Supabase用の最適化されたスキーマ定義

-- 拡張機能の有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- セッションテーブル
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT DEFAULT 'anonymous',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 会話履歴テーブル（ベクトル埋め込み付き）
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    user_message TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    user_id TEXT,
    context_type TEXT DEFAULT 'general',
    -- ベクトル埋め込み（OpenAI ada-002: 1536次元）
    user_message_embedding vector(1536),
    ai_response_embedding vector(1536),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- フィードバックテーブル
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    is_helpful BOOLEAN,
    feedback_text TEXT,
    feedback_type TEXT DEFAULT 'general',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 学習改善テーブル
CREATE TABLE IF NOT EXISTS learning_improvements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feedback_id UUID NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
    original_response TEXT,
    improved_response TEXT,
    improvement_type TEXT DEFAULT 'user_correction',
    improvement_embedding vector(1536),
    applied BOOLEAN DEFAULT false,
    applied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ナレッジベーステーブル（RAG用）
CREATE TABLE IF NOT EXISTS knowledge_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    content_embedding vector(1536),
    category TEXT,
    tags TEXT[],
    source_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- エラーログテーブル
CREATE TABLE IF NOT EXISTS error_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    error_message TEXT,
    error_code TEXT,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_is_active ON sessions(is_active);
CREATE INDEX idx_sessions_last_activity ON sessions(last_activity DESC);

CREATE INDEX idx_conversations_session_id ON conversations(session_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);

-- ベクトル検索用のインデックス（IVFFlat）
CREATE INDEX idx_conversations_user_embedding ON conversations 
    USING ivfflat (user_message_embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_conversations_ai_embedding ON conversations 
    USING ivfflat (ai_response_embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_knowledge_base_embedding ON knowledge_base 
    USING ivfflat (content_embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX idx_feedback_conversation_id ON feedback(conversation_id);
CREATE INDEX idx_feedback_session_id ON feedback(session_id);
CREATE INDEX idx_feedback_rating ON feedback(rating);

CREATE INDEX idx_learning_improvements_feedback_id ON learning_improvements(feedback_id);
CREATE INDEX idx_learning_improvements_applied ON learning_improvements(applied);

-- Row Level Security (RLS) ポリシー
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_improvements ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

-- RLSポリシー定義（APIキー認証用）
CREATE POLICY "Allow all operations with API key" ON sessions
    FOR ALL USING (true);

CREATE POLICY "Allow all operations with API key" ON conversations
    FOR ALL USING (true);

CREATE POLICY "Allow all operations with API key" ON feedback
    FOR ALL USING (true);

CREATE POLICY "Allow all operations with API key" ON learning_improvements
    FOR ALL USING (true);

CREATE POLICY "Allow read operations on knowledge base" ON knowledge_base
    FOR SELECT USING (true);

CREATE POLICY "Allow insert/update on knowledge base" ON knowledge_base
    FOR ALL USING (true);

-- ビュー: アクティブセッションの統計
CREATE OR REPLACE VIEW active_session_stats AS
SELECT 
    s.id as session_id,
    s.user_id,
    s.started_at,
    s.last_activity,
    COUNT(DISTINCT c.id) as total_conversations,
    AVG(f.rating) as avg_rating,
    MAX(c.created_at) as last_message_at,
    EXTRACT(EPOCH FROM (NOW() - s.last_activity))/60 as idle_minutes
FROM sessions s
LEFT JOIN conversations c ON s.id = c.session_id
LEFT JOIN feedback f ON c.id = f.conversation_id
WHERE s.is_active = true
GROUP BY s.id, s.user_id, s.started_at, s.last_activity;

-- 関数: セマンティック検索（会話履歴から類似検索）
CREATE OR REPLACE FUNCTION search_similar_conversations(
    query_embedding vector(1536),
    match_threshold FLOAT DEFAULT 0.8,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    conversation_id UUID,
    session_id UUID,
    user_message TEXT,
    ai_response TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as conversation_id,
        c.session_id,
        c.user_message,
        c.ai_response,
        1 - (c.user_message_embedding <=> query_embedding) as similarity
    FROM conversations c
    WHERE 1 - (c.user_message_embedding <=> query_embedding) > match_threshold
    ORDER BY c.user_message_embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- 関数: ナレッジベース検索
CREATE OR REPLACE FUNCTION search_knowledge_base(
    query_embedding vector(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 3
)
RETURNS TABLE (
    knowledge_id UUID,
    title TEXT,
    content TEXT,
    category TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        k.id as knowledge_id,
        k.title,
        k.content,
        k.category,
        1 - (k.content_embedding <=> query_embedding) as similarity
    FROM knowledge_base k
    WHERE 1 - (k.content_embedding <=> query_embedding) > match_threshold
    ORDER BY k.content_embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- トリガー: updated_atの自動更新
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_knowledge_base_updated_at
    BEFORE UPDATE ON knowledge_base
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();