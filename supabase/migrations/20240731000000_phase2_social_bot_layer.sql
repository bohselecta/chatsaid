-- Phase 2 Social Bot Layer Migration
-- This implements the core social and bot interaction features

-- 1. User Bot Setup - Each user gets one unique bot
CREATE TABLE IF NOT EXISTS user_bots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  bot_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  personality_traits TEXT[] DEFAULT ARRAY['friendly', 'helpful'],
  learning_enabled BOOLEAN DEFAULT true,
  interaction_history JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Enhanced Cherry Cards with Bot Attribution
ALTER TABLE cherries ADD COLUMN IF NOT EXISTS bot_attribution TEXT;
ALTER TABLE cherries ADD COLUMN IF NOT EXISTS engagement_score INTEGER DEFAULT 0;
ALTER TABLE cherries ADD COLUMN IF NOT EXISTS share_count INTEGER DEFAULT 0;

-- 3. Bot Interaction System
CREATE TABLE IF NOT EXISTS bot_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('cherry', 'user', 'bot')),
  target_id UUID NOT NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('comment', 'reaction', 'share', 'suggest')),
  content TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Cherry Sharing System
CREATE TABLE IF NOT EXISTS cherry_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cherry_id UUID NOT NULL REFERENCES cherries(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bot_attribution BOOLEAN DEFAULT false,
  share_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Enhanced Engagement Metrics
CREATE TABLE IF NOT EXISTS cherry_engagement (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cherry_id UUID NOT NULL REFERENCES cherries(id) ON DELETE CASCADE UNIQUE,
  total_reactions INTEGER DEFAULT 0,
  total_comments INTEGER DEFAULT 0,
  total_shares INTEGER DEFAULT 0,
  bot_interactions INTEGER DEFAULT 0,
  engagement_score INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Bot Learning Patterns
CREATE TABLE IF NOT EXISTS bot_learning_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('content_preference', 'interaction_style', 'timing')),
  pattern_data JSONB NOT NULL,
  success_score DECIMAL(3,2) DEFAULT 0.5,
  usage_count INTEGER DEFAULT 1,
  last_used TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. Precomputed Connections for Performance
CREATE TABLE IF NOT EXISTS precomputed_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_type TEXT NOT NULL CHECK (source_type IN ('cherry', 'user', 'bot')),
  source_id UUID NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('cherry', 'user', 'bot')),
  target_id UUID NOT NULL,
  connection_strength DECIMAL(3,2) DEFAULT 0.5,
  connection_type TEXT NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(source_type, source_id, target_type, target_id)
);

-- 8. Branch Caching for Performance
CREATE TABLE IF NOT EXISTS branch_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  cache_key TEXT NOT NULL,
  cache_data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(branch_id, cache_key)
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_user_bots_user_id ON user_bots(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bots_bot_id ON user_bots(bot_id);
CREATE INDEX IF NOT EXISTS idx_bot_interactions_bot_id ON bot_interactions(bot_id);
CREATE INDEX IF NOT EXISTS idx_bot_interactions_target ON bot_interactions(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_cherry_shares_cherry_id ON cherry_shares(cherry_id);
CREATE INDEX IF NOT EXISTS idx_cherry_engagement_cherry_id ON cherry_engagement(cherry_id);
CREATE INDEX IF NOT EXISTS idx_bot_learning_patterns_bot_id ON bot_learning_patterns(bot_id);
CREATE INDEX IF NOT EXISTS idx_precomputed_connections_source ON precomputed_connections(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_precomputed_connections_target ON precomputed_connections(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_branch_cache_branch_id ON branch_cache(branch_id);
CREATE INDEX IF NOT EXISTS idx_branch_cache_expires ON branch_cache(expires_at);

-- RLS Policies
ALTER TABLE user_bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cherry_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE cherry_engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_learning_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE precomputed_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE branch_cache ENABLE ROW LEVEL SECURITY;

-- User bots policies
CREATE POLICY "Users can view own bot" ON user_bots
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own bot" ON user_bots
  FOR UPDATE USING (auth.uid() = user_id);

-- Bot interactions policies
CREATE POLICY "Anyone can view bot interactions" ON bot_interactions
  FOR SELECT USING (true);

CREATE POLICY "Bots can create interactions" ON bot_interactions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = bot_id AND is_bot = true
    )
  );

-- Cherry shares policies
CREATE POLICY "Anyone can view cherry shares" ON cherry_shares
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can share cherries" ON cherry_shares
  FOR INSERT WITH CHECK (auth.uid() = shared_by);

-- Cherry engagement policies
CREATE POLICY "Anyone can view cherry engagement" ON cherry_engagement
  FOR SELECT USING (true);

-- Bot learning patterns policies
CREATE POLICY "Bots can manage own learning patterns" ON bot_learning_patterns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = bot_id AND is_bot = true
    )
  );

-- Precomputed connections policies
CREATE POLICY "Anyone can view precomputed connections" ON precomputed_connections
  FOR SELECT USING (true);

-- Branch cache policies
CREATE POLICY "Anyone can view branch cache" ON branch_cache
  FOR SELECT USING (true);

-- Functions for automated updates
CREATE OR REPLACE FUNCTION update_cherry_engagement()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO cherry_engagement (cherry_id, total_reactions, total_comments, total_shares, engagement_score)
  VALUES (NEW.id, 0, 0, 0, 0)
  ON CONFLICT (cherry_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_engagement_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE cherry_engagement 
  SET 
    total_reactions = (
      SELECT COUNT(*) FROM user_reactions WHERE cherry_id = NEW.cherry_id
    ),
    total_comments = (
      SELECT COUNT(*) FROM enhanced_comments WHERE cherry_id = NEW.cherry_id
    ),
    total_shares = (
      SELECT COUNT(*) FROM cherry_shares WHERE cherry_id = NEW.cherry_id
    ),
    engagement_score = (
      SELECT 
        (COUNT(*) FILTER (WHERE type = 'heart') * 2) +
        (COUNT(*) FILTER (WHERE type = 'laugh') * 1.5) +
        (COUNT(*) FILTER (WHERE type = 'zap') * 1.8) +
        (COUNT(*) FILTER (WHERE type = 'star') * 2.5)
      FROM user_reactions WHERE cherry_id = NEW.cherry_id
    ) + (
      SELECT COUNT(*) * 3 FROM enhanced_comments WHERE cherry_id = NEW.cherry_id
    ) + (
      SELECT COUNT(*) * 5 FROM cherry_shares WHERE cherry_id = NEW.cherry_id
    ),
    last_updated = now()
  WHERE cherry_id = NEW.cherry_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER trigger_cherry_engagement_insert
  AFTER INSERT ON cherries
  FOR EACH ROW
  EXECUTE FUNCTION update_cherry_engagement();

CREATE TRIGGER trigger_update_engagement_score
  AFTER INSERT OR UPDATE OR DELETE ON user_reactions
  FOR EACH ROW
  EXECUTE FUNCTION update_engagement_score();

CREATE TRIGGER trigger_update_engagement_score_comments
  AFTER INSERT OR UPDATE OR DELETE ON enhanced_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_engagement_score();

CREATE TRIGGER trigger_update_engagement_score_shares
  AFTER INSERT OR UPDATE OR DELETE ON cherry_shares
  FOR EACH ROW
  EXECUTE FUNCTION update_engagement_score();

-- Insert system bots if they don't exist
INSERT INTO profiles (id, display_name, bio, avatar_url, is_bot, bot_type, is_public)
VALUES 
  ('cherry_ent_bot', 'Cherry_Ent 🌳', 'Tech-savvy, playful, positive guide and moderator', '/cherry-ent-avatar.png', true, 'cherry_ent', true),
  ('crystal_maize_bot', 'Crystal_Maize ✨', 'Poetic, dreamy, activist/grounded guide and content curator', '/crystal-maize-avatar.png', true, 'crystal_maize', true)
ON CONFLICT (id) DO NOTHING;

-- Grant permissions
GRANT SELECT ON user_bots TO authenticated;
GRANT SELECT, INSERT, UPDATE ON bot_interactions TO authenticated;
GRANT SELECT, INSERT ON cherry_shares TO authenticated;
GRANT SELECT ON cherry_engagement TO authenticated;
GRANT SELECT ON bot_learning_patterns TO authenticated;
GRANT SELECT ON precomputed_connections TO authenticated;
GRANT SELECT ON branch_cache TO authenticated;
