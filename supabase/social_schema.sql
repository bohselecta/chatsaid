-- Phase 2: Social Features Database Extensions
-- This file adds social functionality without modifying core cherry/branch tables

-- User reactions to cherries
CREATE TABLE IF NOT EXISTS user_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cherry_id UUID NOT NULL REFERENCES cherries(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('heart', 'laugh', 'zap', 'star')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, cherry_id, reaction_type)
);

-- Enhanced comments with bot identification
CREATE TABLE IF NOT EXISTS enhanced_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cherry_id UUID NOT NULL REFERENCES cherries(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 1000),
  parent_id UUID REFERENCES enhanced_comments(id) ON DELETE CASCADE,
  is_bot_comment BOOLEAN DEFAULT false,
  bot_personality TEXT, -- For future bot personality features
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User activity cache for recommendations
CREATE TABLE IF NOT EXISTS user_activity_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'view', 'react', 'comment', 'share'
  cherry_id UUID REFERENCES cherries(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  activity_data JSONB, -- Flexible data storage
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days')
);

-- Cherry engagement metrics (denormalized for performance)
CREATE TABLE IF NOT EXISTS cherry_engagement (
  cherry_id UUID PRIMARY KEY REFERENCES cherries(id) ON DELETE CASCADE,
  total_reactions INTEGER DEFAULT 0,
  total_comments INTEGER DEFAULT 0,
  total_shares INTEGER DEFAULT 0,
  engagement_score FLOAT DEFAULT 0.0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_reactions_user_id ON user_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reactions_cherry_id ON user_reactions(cherry_id);
CREATE INDEX IF NOT EXISTS idx_user_reactions_type ON user_reactions(reaction_type);

CREATE INDEX IF NOT EXISTS idx_enhanced_comments_cherry_id ON enhanced_comments(cherry_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_comments_author_id ON enhanced_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_comments_bot ON enhanced_comments(is_bot_comment);

CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_expires ON user_activity_cache(expires_at);

-- RLS Policies for social features
ALTER TABLE user_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhanced_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE cherry_engagement ENABLE ROW LEVEL SECURITY;

-- User reactions policies
CREATE POLICY "Users can view all reactions" ON user_reactions
  FOR SELECT USING (true);

CREATE POLICY "Users can add their own reactions" ON user_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reactions" ON user_reactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions" ON user_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- Enhanced comments policies
CREATE POLICY "Users can view all comments" ON enhanced_comments
  FOR SELECT USING (true);

CREATE POLICY "Users can add their own comments" ON enhanced_comments
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own comments" ON enhanced_comments
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own comments" ON enhanced_comments
  FOR DELETE USING (auth.uid() = author_id);

-- User activity cache policies
CREATE POLICY "Users can view their own activity" ON user_activity_cache
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own activity" ON user_activity_cache
  FOR ALL USING (auth.uid() = user_id);

-- Cherry engagement policies (read-only for all)
CREATE POLICY "Anyone can view engagement metrics" ON cherry_engagement
  FOR SELECT USING (true);

-- Functions for maintaining engagement metrics
CREATE OR REPLACE FUNCTION update_cherry_engagement()
RETURNS TRIGGER AS $$
BEGIN
  -- Update engagement metrics when reactions change
  IF TG_TABLE_NAME = 'user_reactions' THEN
    INSERT INTO cherry_engagement (cherry_id, total_reactions, engagement_score)
    VALUES (
      NEW.cherry_id,
      (SELECT COUNT(*) FROM user_reactions WHERE cherry_id = NEW.cherry_id),
      (SELECT COUNT(*) FROM user_reactions WHERE cherry_id = NEW.cherry_id) * 0.5
    )
    ON CONFLICT (cherry_id) DO UPDATE SET
      total_reactions = EXCLUDED.total_reactions,
      engagement_score = EXCLUDED.engagement_score,
      last_updated = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic engagement updates
CREATE TRIGGER trigger_update_engagement_reactions
  AFTER INSERT OR DELETE ON user_reactions
  FOR EACH ROW EXECUTE FUNCTION update_cherry_engagement();

-- Function to get user's reaction status for a cherry
CREATE OR REPLACE FUNCTION get_user_reactions_for_cherry(
  target_cherry_id UUID,
  target_user_id UUID
)
RETURNS TABLE(reaction_type TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT ur.reaction_type
  FROM user_reactions ur
  WHERE ur.cherry_id = target_cherry_id
    AND ur.user_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get cherry engagement summary
CREATE OR REPLACE FUNCTION get_cherry_engagement_summary(target_cherry_id UUID)
RETURNS TABLE(
  total_reactions INTEGER,
  total_comments INTEGER,
  total_shares INTEGER,
  engagement_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ce.total_reactions,
    ce.total_comments,
    ce.total_shares,
    ce.engagement_score
  FROM cherry_engagement ce
  WHERE ce.cherry_id = target_cherry_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
