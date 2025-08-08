-- Intelligent Learning Chatbot Database Schema
-- Phase 3: Feedback System

-- Feedback table for storing user feedback
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id),
    session_id UUID NOT NULL,
    user_id VARCHAR(255),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    is_helpful BOOLEAN,
    feedback_text TEXT,
    feedback_type VARCHAR(50), -- 'positive', 'negative', 'suggestion', 'correction'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for feedback
CREATE INDEX idx_feedback_session_id ON feedback(session_id);
CREATE INDEX idx_feedback_conversation_id ON feedback(conversation_id);
CREATE INDEX idx_feedback_rating ON feedback(rating);
CREATE INDEX idx_feedback_created_at ON feedback(created_at);

-- Learning improvements table (stores corrections and improvements)
CREATE TABLE IF NOT EXISTS learning_improvements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feedback_id UUID REFERENCES feedback(id),
    original_response TEXT NOT NULL,
    improved_response TEXT NOT NULL,
    improvement_type VARCHAR(50), -- 'correction', 'enhancement', 'clarification'
    applied BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for learning improvements
CREATE INDEX idx_learning_improvements_feedback_id ON learning_improvements(feedback_id);
CREATE INDEX idx_learning_improvements_applied ON learning_improvements(applied);

-- View for feedback summary
CREATE OR REPLACE VIEW feedback_summary AS
SELECT 
    f.id,
    f.session_id,
    f.rating,
    f.is_helpful,
    f.feedback_type,
    f.feedback_text,
    f.created_at,
    c.user_message as original_question,
    c.ai_response as original_response,
    li.improved_response
FROM feedback f
LEFT JOIN conversations c ON f.conversation_id = c.id
LEFT JOIN learning_improvements li ON f.id = li.feedback_id
ORDER BY f.created_at DESC;

-- Function to calculate average rating per session
CREATE OR REPLACE FUNCTION get_session_rating_average(session_uuid UUID)
RETURNS DECIMAL(3,2) AS $$
BEGIN
    RETURN (
        SELECT AVG(rating)::DECIMAL(3,2)
        FROM feedback
        WHERE session_id = session_uuid
        AND rating IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get feedback trends
CREATE OR REPLACE FUNCTION get_feedback_trends(days_back INTEGER DEFAULT 7)
RETURNS TABLE (
    date DATE,
    avg_rating DECIMAL(3,2),
    total_feedback INTEGER,
    positive_count INTEGER,
    negative_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(created_at) as date,
        AVG(rating)::DECIMAL(3,2) as avg_rating,
        COUNT(*)::INTEGER as total_feedback,
        COUNT(*) FILTER (WHERE rating >= 4)::INTEGER as positive_count,
        COUNT(*) FILTER (WHERE rating <= 2)::INTEGER as negative_count
    FROM feedback
    WHERE created_at > CURRENT_DATE - INTERVAL '1 day' * days_back
    GROUP BY DATE(created_at)
    ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql;