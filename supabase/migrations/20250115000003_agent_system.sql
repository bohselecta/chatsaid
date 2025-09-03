-- ChatSaid Agent System Migration
-- Adds persona agents, watchlists, digest cache, and ping protocol

-- Persona table for AI agent profiles
CREATE TABLE IF NOT EXISTS personas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    description TEXT,
    autonomy_flags JSONB DEFAULT '{"pingsAllowed": true, "autoAck": false, "dailyTokenBudget": 1000}',
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Watchlist for tracking user interests
CREATE TABLE IF NOT EXISTS watchlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('tag', 'person', 'category', 'keyword')),
    value TEXT NOT NULL,
    weight DECIMAL(3,2) DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, kind, value)
);

-- Digest cache for storing computed summaries
CREATE TABLE IF NOT EXISTS digest_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    time_slice_key TEXT NOT NULL,
    summary_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    UNIQUE(user_id, time_slice_key)
);

-- Ping system for agent-to-agent communication
CREATE TABLE IF NOT EXISTS pings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    to_persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    thread_id TEXT,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'replied', 'blocked', 'expired')),
    response TEXT,
    max_words INTEGER DEFAULT 200,
    scope TEXT DEFAULT 'public' CHECK (scope IN ('public', 'friends', 'private')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    replied_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- User cherry buckets for personal collections
CREATE TABLE IF NOT EXISTS user_cherry_buckets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cherry_id UUID NOT NULL REFERENCES cherries(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('funny', 'mystical', 'technical', 'research', 'ideas')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, cherry_id, category)
);

-- Agent action log for audit trail
CREATE TABLE IF NOT EXISTS agent_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('ping_sent', 'ping_received', 'digest_generated', 'cherry_saved', 'watchlist_updated')),
    target_id UUID,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_personas_user_id ON personas(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlists_user_id ON watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlists_kind_value ON watchlists(kind, value);
CREATE INDEX IF NOT EXISTS idx_digest_cache_user_expires ON digest_cache(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_pings_from_persona ON pings(from_persona_id);
CREATE INDEX IF NOT EXISTS idx_pings_to_persona ON pings(to_persona_id);
CREATE INDEX IF NOT EXISTS idx_pings_status ON pings(status);
CREATE INDEX IF NOT EXISTS idx_user_cherry_buckets_user_category ON user_cherry_buckets(user_id, category);
CREATE INDEX IF NOT EXISTS idx_agent_actions_persona ON agent_actions(persona_id);

-- RLS Policies
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE digest_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE pings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cherry_buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_actions ENABLE ROW LEVEL SECURITY;

-- Personas: users can only access their own persona
CREATE POLICY "Users can manage their own persona" ON personas
    FOR ALL USING (auth.uid() = user_id);

-- Watchlists: users can only access their own watchlists
CREATE POLICY "Users can manage their own watchlists" ON watchlists
    FOR ALL USING (auth.uid() = user_id);

-- Digest cache: users can only access their own digests
CREATE POLICY "Users can access their own digests" ON digest_cache
    FOR ALL USING (auth.uid() = user_id);

-- Pings: personas can send/receive pings
CREATE POLICY "Personas can send pings" ON pings
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM personas WHERE id = from_persona_id AND user_id = auth.uid())
    );

CREATE POLICY "Personas can receive pings" ON pings
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM personas WHERE id = to_persona_id AND user_id = auth.uid())
    );

-- User cherry buckets: users can manage their own collections
CREATE POLICY "Users can manage their own cherry buckets" ON user_cherry_buckets
    FOR ALL USING (auth.uid() = user_id);

-- Agent actions: users can view their persona's actions
CREATE POLICY "Users can view their persona actions" ON agent_actions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM personas WHERE id = persona_id AND user_id = auth.uid())
    );

-- Functions for agent system
CREATE OR REPLACE FUNCTION get_user_persona(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    display_name TEXT,
    avatar_url TEXT,
    description TEXT,
    autonomy_flags JSONB,
    last_active TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.display_name, p.avatar_url, p.description, p.autonomy_flags, p.last_active
    FROM personas p
    WHERE p.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_watchlist(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    kind TEXT,
    value TEXT,
    weight DECIMAL(3,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT w.id, w.kind, w.value, w.weight
    FROM watchlists w
    WHERE w.user_id = user_uuid
    ORDER BY w.weight DESC, w.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION cleanup_expired_digests()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM digest_cache WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_personas_updated_at
    BEFORE UPDATE ON personas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default persona for existing users
INSERT INTO personas (user_id, display_name, description, autonomy_flags)
SELECT 
    id,
    COALESCE(raw_user_meta_data->>'display_name', 'My AI Companion'),
    'Your personal AI assistant for discovering and organizing cherries',
    '{"pingsAllowed": true, "autoAck": false, "dailyTokenBudget": 1000, "quietHours": [22, 8]}'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM personas)
ON CONFLICT (user_id) DO NOTHING;
