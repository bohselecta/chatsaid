-- Missing Tables Migration - Add tables referenced by the code but missing from schema
-- This fixes the schema mismatch that's preventing the site from loading

-- 1. User Reactions Table (referenced by SocialService)
CREATE TABLE IF NOT EXISTS user_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cherry_id UUID NOT NULL REFERENCES cherries(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('heart', 'laugh', 'zap', 'star')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, cherry_id, reaction_type)
);

-- 2. Enhanced Comments Table (referenced by SocialService)
CREATE TABLE IF NOT EXISTS enhanced_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cherry_id UUID NOT NULL REFERENCES cherries(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 1000),
  parent_id UUID REFERENCES enhanced_comments(id) ON DELETE CASCADE,
  is_bot_comment BOOLEAN DEFAULT false,
  bot_personality TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. User Activity Cache Table (referenced by SocialService)
CREATE TABLE IF NOT EXISTS user_activity_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  target_id UUID,
  target_type TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '24 hours')
);

-- 4. Bot Personalities Table (referenced by AIBotService)
CREATE TABLE IF NOT EXISTS bot_personalities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  conversation_style TEXT NOT NULL CHECK (conversation_style IN ('friendly', 'professional', 'casual', 'philosophical', 'humorous')),
  expertise_areas TEXT[] DEFAULT '{}',
  response_length TEXT NOT NULL CHECK (response_length IN ('short', 'medium', 'long')),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Bot Interaction Queue Table (referenced by BotInteractionScheduler)
CREATE TABLE IF NOT EXISTS bot_interaction_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  interaction_type TEXT NOT NULL,
  priority INTEGER DEFAULT 1,
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT now(),
  executed BOOLEAN DEFAULT false,
  executed_at TIMESTAMP WITH TIME ZONE,
  result_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Bot Twins Table (referenced by BotInteractionScheduler)
CREATE TABLE IF NOT EXISTS bot_twins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  bot_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  personality_data JSONB DEFAULT '{}',
  learning_enabled BOOLEAN DEFAULT true,
  interaction_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. Bot Conversation Patterns Table (referenced by AIBotService)
CREATE TABLE IF NOT EXISTS bot_conversation_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pattern_type TEXT NOT NULL,
  pattern_data JSONB NOT NULL,
  success_rate DECIMAL(3,2) DEFAULT 0.5,
  usage_count INTEGER DEFAULT 0,
  last_used TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 8. Bot Performance Metrics Table (referenced by BotAnalyticsService)
CREATE TABLE IF NOT EXISTS bot_performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL,
  metric_value DECIMAL(10,2) NOT NULL,
  metric_date DATE NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(bot_id, metric_type, metric_date)
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_user_reactions_user_id ON user_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reactions_cherry_id ON user_reactions(cherry_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_comments_cherry_id ON enhanced_comments(cherry_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_comments_author_id ON enhanced_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_cache_user_id ON user_activity_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_cache_expires ON user_activity_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_bot_personalities_active ON bot_personalities(is_active);
CREATE INDEX IF NOT EXISTS idx_bot_interaction_queue_bot_id ON bot_interaction_queue(bot_id);
CREATE INDEX IF NOT EXISTS idx_bot_interaction_queue_scheduled ON bot_interaction_queue(scheduled_for, executed);
CREATE INDEX IF NOT EXISTS idx_bot_twins_user_id ON bot_twins(user_id);
CREATE INDEX IF NOT EXISTS idx_bot_conversation_patterns_bot_id ON bot_conversation_patterns(bot_id);
CREATE INDEX IF NOT EXISTS idx_bot_performance_metrics_bot_id ON bot_performance_metrics(bot_id);
CREATE INDEX IF NOT EXISTS idx_bot_performance_metrics_date ON bot_performance_metrics(metric_date);

-- RLS Policies for new tables
ALTER TABLE user_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhanced_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_personalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_interaction_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_twins ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_conversation_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_performance_metrics ENABLE ROW LEVEL SECURITY;

-- User Reactions Policies
CREATE POLICY "Users can read reactions on visible cherries" ON user_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cherries c
      WHERE c.id = cherry_id
      AND (
        c.privacy_level = 'public' OR
        c.author_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM friendships f
          WHERE f.status = 'accepted'
          AND (
            (f.requester_id = auth.uid() AND f.addressee_id = c.author_id) OR
            (f.addressee_id = auth.uid() AND f.requester_id = c.author_id)
          )
        )
      )
    )
  );

CREATE POLICY "Users can manage their own reactions" ON user_reactions
  FOR ALL USING (auth.uid() = user_id);

-- Enhanced Comments Policies
CREATE POLICY "Users can read comments on visible cherries" ON enhanced_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cherries c
      WHERE c.id = cherry_id
      AND (
        c.privacy_level = 'public' OR
        c.author_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM friendships f
          WHERE f.status = 'accepted'
          AND (
            (f.requester_id = auth.uid() AND f.addressee_id = c.author_id) OR
            (f.addressee_id = auth.uid() AND f.requester_id = c.author_id)
          )
        )
      )
    )
  );

CREATE POLICY "Users can manage their own comments" ON enhanced_comments
  FOR ALL USING (auth.uid() = author_id);

-- Bot Personalities Policies (read-only for all users)
CREATE POLICY "Anyone can read bot personalities" ON bot_personalities
  FOR SELECT USING (true);

-- Bot Interaction Queue Policies (read-only for all users)
CREATE POLICY "Anyone can read bot interaction queue" ON bot_interaction_queue
  FOR SELECT USING (true);

-- Bot Twins Policies
CREATE POLICY "Users can manage their own bot twins" ON bot_twins
  FOR ALL USING (auth.uid() = user_id);

-- Bot Conversation Patterns Policies (read-only for all users)
CREATE POLICY "Anyone can read bot conversation patterns" ON bot_conversation_patterns
  FOR SELECT USING (true);

-- Bot Performance Metrics Policies (read-only for all users)
CREATE POLICY "Anyone can read bot performance metrics" ON bot_performance_metrics
  FOR SELECT USING (true);

-- Insert default bot personalities
INSERT INTO bot_personalities (name, description, conversation_style, expertise_areas, response_length, avatar_url) VALUES
  ('Sage', 'Wise and philosophical AI companion', 'philosophical', ARRAY['wisdom', 'philosophy', 'life advice'], 'long', '/bot-avatars/sage.png'),
  ('Spark', 'Creative and inspiring AI companion', 'friendly', ARRAY['creativity', 'inspiration', 'ideas'], 'medium', '/bot-avatars/spark.png'),
  ('Analyst', 'Logical and analytical AI companion', 'professional', ARRAY['analysis', 'logic', 'problem-solving'], 'medium', '/bot-avatars/analyst.png'),
  ('Chuckles', 'Humorous and entertaining AI companion', 'humorous', ARRAY['humor', 'entertainment', 'fun'], 'short', '/bot-avatars/chuckles.png'),
  ('Explorer', 'Curious and adventurous AI companion', 'casual', ARRAY['exploration', 'discovery', 'adventure'], 'medium', '/bot-avatars/explorer.png')
ON CONFLICT (name) DO NOTHING;

-- Insert system bot profiles if they don't exist
INSERT INTO profiles (id, display_name, bio, avatar_url, is_bot, bot_type, is_public) VALUES
  ('cherry_ent_bot', 'Cherry Entertainment Bot', 'AI companion for entertainment and fun', '/bot-avatars/cherry-ent.png', true, 'cherry_ent', true),
  ('crystal_maize_bot', 'Crystal Maize Bot', 'AI companion for wisdom and guidance', '/bot-avatars/crystal-maize.png', true, 'crystal_maize', true)
ON CONFLICT (id) DO NOTHING;
