-- Intelligent Learning Chatbot Database Schema
-- Phase 2: Session Management and Conversation History

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL,
    user_message TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    -- For future Phase 4: RAG implementation
    embedding VECTOR(1536)
);

-- Create indexes for performance
CREATE INDEX idx_conversations_session_id ON conversations(session_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);

-- Create session management table
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID UNIQUE NOT NULL,
    user_id VARCHAR(255),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    context JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true
);

-- Create index for session lookup
CREATE INDEX idx_sessions_session_id ON sessions(session_id);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_is_active ON sessions(is_active);

-- Function to clean up old sessions (30 days)
CREATE OR REPLACE FUNCTION cleanup_old_sessions() RETURNS void AS $$
BEGIN
    UPDATE sessions 
    SET is_active = false 
    WHERE last_activity < CURRENT_TIMESTAMP - INTERVAL '30 days' 
    AND is_active = true;
    
    -- Archive old conversations (optional)
    -- This would move to an archive table in production
END;
$$ LANGUAGE plpgsql;

-- Create a view for recent conversations (for quick access)
CREATE OR REPLACE VIEW recent_conversations AS
SELECT 
    c.id,
    c.session_id,
    c.user_message,
    c.ai_response,
    c.created_at,
    c.user_id,
    s.is_active as session_active
FROM conversations c
LEFT JOIN sessions s ON c.session_id = s.session_id
WHERE c.created_at > CURRENT_TIMESTAMP - INTERVAL '7 days'
ORDER BY c.created_at DESC;

-- Sample data for testing (optional)
-- INSERT INTO sessions (session_id, user_id) VALUES 
-- (uuid_generate_v4(), 'test-user-001');