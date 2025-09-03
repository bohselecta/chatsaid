-- ChatSaid Cherry Generation Migration
-- Adds bot-generated cherry suggestions and enhanced user cherry buckets

-- Bot-generated cherry suggestions table
CREATE TABLE IF NOT EXISTS bot_cherry_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    mood VARCHAR(50),
    style_seed TEXT,
    cherry_text TEXT NOT NULL,
    provenance JSONB NOT NULL,
    score DECIMAL(3,2) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'selected', 'discarded', 'edited'))
);

-- Enhanced user cherry buckets with more metadata
ALTER TABLE user_cherry_buckets ADD COLUMN IF NOT EXISTS cherry_text TEXT;
ALTER TABLE user_cherry_buckets ADD COLUMN IF NOT EXISTS provenance JSONB;
ALTER TABLE user_cherry_buckets ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'manual' CHECK (source IN ('manual', 'bot_generated', 'imported'));
ALTER TABLE user_cherry_buckets ADD COLUMN IF NOT EXISTS original_suggestion_id UUID REFERENCES bot_cherry_suggestions(id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bot_cherry_user ON bot_cherry_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_bot_cherry_status ON bot_cherry_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_bot_cherry_created ON bot_cherry_suggestions(created_at);
CREATE INDEX IF NOT EXISTS idx_user_cherry_source ON user_cherry_buckets(source);

-- RLS Policies
ALTER TABLE bot_cherry_suggestions ENABLE ROW LEVEL SECURITY;

-- Users can only access their own cherry suggestions
CREATE POLICY "Users can manage their own cherry suggestions" ON bot_cherry_suggestions
    FOR ALL USING (auth.uid() = user_id);

-- Functions for cherry generation
CREATE OR REPLACE FUNCTION get_user_pending_cherries(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    prompt TEXT,
    mood VARCHAR(50),
    style_seed TEXT,
    cherry_text TEXT,
    provenance JSONB,
    score DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT bcs.id, bcs.prompt, bcs.mood, bcs.style_seed, bcs.cherry_text, bcs.provenance, bcs.score, bcs.created_at
    FROM bot_cherry_suggestions bcs
    WHERE bcs.user_id = user_uuid AND bcs.status = 'pending'
    ORDER BY bcs.score DESC, bcs.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION cleanup_old_cherry_suggestions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete discarded suggestions older than 7 days
    DELETE FROM bot_cherry_suggestions 
    WHERE status = 'discarded' AND created_at < NOW() - INTERVAL '7 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_bot_cherry_suggestions_updated_at
    BEFORE UPDATE ON bot_cherry_suggestions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample mood options (can be expanded)
INSERT INTO bot_cherry_suggestions (user_id, prompt, mood, cherry_text, provenance, status) VALUES
('00000000-0000-0000-0000-000000000000', 'Sample prompt', 'inspirational', 'This is a sample cherry for testing', '{"source": "sample", "confidence": 0.8}', 'discarded')
ON CONFLICT DO NOTHING;
