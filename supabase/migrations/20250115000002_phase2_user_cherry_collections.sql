-- Phase 2: User Cherry Collections & Enhanced Reaction System
-- This implements the "pick the cherry" functionality where reactions serve as both
-- categorization AND collection for AI learning

-- 1. User Cherry Collections Table
-- Tracks which cherries users have "picked" for their AI companion to learn from
CREATE TABLE IF NOT EXISTS user_cherry_collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cherry_id UUID NOT NULL REFERENCES cherries(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('heart', 'star', 'zap')),
  collection_note TEXT, -- Optional note from user about why they picked this cherry
  ai_learning_status TEXT DEFAULT 'pending' CHECK (ai_learning_status IN ('pending', 'processing', 'learned', 'failed')),
  ai_insights JSONB DEFAULT '{}', -- AI companion's insights about this cherry
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, cherry_id) -- One collection per cherry per user
);

-- 2. Cherry Category Rankings Table
-- Tracks how cherries are ranked by reaction categories
CREATE TABLE IF NOT EXISTS cherry_category_rankings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cherry_id UUID NOT NULL REFERENCES cherries(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('heart', 'star', 'zap')),
  reaction_count INTEGER DEFAULT 0,
  user_count INTEGER DEFAULT 0, -- Unique users who reacted
  ranking_score DECIMAL(10,4) DEFAULT 0, -- Calculated ranking score
  last_calculated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(cherry_id, category)
);

-- 3. User AI Learning Preferences Table
-- Tracks what types of cherries users want their AI to learn from
CREATE TABLE IF NOT EXISTS user_ai_learning_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  preferred_categories TEXT[] DEFAULT '{}', -- Which reaction types to prioritize
  learning_frequency TEXT DEFAULT 'daily' CHECK (learning_frequency IN ('hourly', 'daily', 'weekly')),
  insight_depth TEXT DEFAULT 'medium' CHECK (insight_depth IN ('brief', 'medium', 'detailed')),
  auto_collect BOOLEAN DEFAULT false, -- Automatically collect cherries based on preferences
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. AI Learning Sessions Table
-- Tracks when AI companions process collected cherries
CREATE TABLE IF NOT EXISTS ai_learning_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL CHECK (session_type IN ('collection_review', 'insight_generation', 'pattern_analysis')),
  cherries_processed INTEGER DEFAULT 0,
  insights_generated INTEGER DEFAULT 0,
  session_summary JSONB DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_cherry_collections_user_id ON user_cherry_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_cherry_collections_cherry_id ON user_cherry_collections(cherry_id);
CREATE INDEX IF NOT EXISTS idx_user_cherry_collections_reaction_type ON user_cherry_collections(reaction_type);
CREATE INDEX IF NOT EXISTS idx_cherry_category_rankings_category ON cherry_category_rankings(category);
CREATE INDEX IF NOT EXISTS idx_cherry_category_rankings_score ON cherry_category_rankings(ranking_score DESC);
CREATE INDEX IF NOT EXISTS idx_ai_learning_sessions_user_id ON ai_learning_sessions(user_id);

-- Function to update cherry category rankings when reactions change
CREATE OR REPLACE FUNCTION update_cherry_category_ranking()
RETURNS TRIGGER AS $$
BEGIN
  -- Update rankings when user reactions change
  INSERT INTO cherry_category_rankings (cherry_id, category, reaction_count, user_count, ranking_score, last_calculated)
  SELECT 
    cherry_id,
    reaction_type as category,
    COUNT(*) as reaction_count,
    COUNT(DISTINCT user_id) as user_count,
    (COUNT(DISTINCT user_id) * 1.0 + COUNT(*) * 0.1) as ranking_score,
    NOW() as last_calculated
  FROM user_reactions
  WHERE cherry_id = COALESCE(NEW.cherry_id, OLD.cherry_id)
  GROUP BY cherry_id, reaction_type
  ON CONFLICT (cherry_id, category) 
  DO UPDATE SET
    reaction_count = EXCLUDED.reaction_count,
    user_count = EXCLUDED.user_count,
    ranking_score = EXCLUDED.ranking_score,
    last_calculated = NOW();
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update rankings
DROP TRIGGER IF EXISTS trigger_update_cherry_rankings ON user_reactions;
CREATE TRIGGER trigger_update_cherry_rankings
  AFTER INSERT OR UPDATE OR DELETE ON user_reactions
  FOR EACH ROW EXECUTE FUNCTION update_cherry_category_ranking();

-- Function to sync user collections with reactions
CREATE OR REPLACE FUNCTION sync_user_cherry_collection()
RETURNS TRIGGER AS $$
BEGIN
  -- When a user reacts to a cherry, add it to their collection
  IF TG_OP = 'INSERT' THEN
    INSERT INTO user_cherry_collections (user_id, cherry_id, reaction_type)
    VALUES (NEW.user_id, NEW.cherry_id, NEW.reaction_type)
    ON CONFLICT (user_id, cherry_id) 
    DO UPDATE SET 
      reaction_type = NEW.reaction_type,
      updated_at = NOW();
  END IF;
  
  -- When a user removes a reaction, remove from collection
  IF TG_OP = 'DELETE' THEN
    DELETE FROM user_cherry_collections 
    WHERE user_id = OLD.user_id AND cherry_id = OLD.cherry_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically sync collections
DROP TRIGGER IF EXISTS trigger_sync_user_collections ON user_reactions;
CREATE TRIGGER trigger_sync_user_collections
  AFTER INSERT OR DELETE ON user_reactions
  FOR EACH ROW EXECUTE FUNCTION sync_user_cherry_collection();

-- Insert default AI learning preferences for existing users
INSERT INTO user_ai_learning_preferences (user_id, preferred_categories, learning_frequency, insight_depth)
SELECT 
  id as user_id,
  ARRAY['heart', 'star', 'zap'] as preferred_categories,
  'daily' as learning_frequency,
  'medium' as insight_depth
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
