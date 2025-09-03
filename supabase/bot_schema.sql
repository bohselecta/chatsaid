-- Phase 2: Bot Personalities & AI Interactions Database Extensions
-- This file adds AI bot functionality without modifying core social tables

-- Bot personalities with different conversation styles
CREATE TABLE IF NOT EXISTS bot_personalities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  avatar_url TEXT,
  conversation_style TEXT NOT NULL CHECK (
    conversation_style IN ('friendly', 'professional', 'casual', 'philosophical', 'humorous')
  ),
  expertise_areas TEXT[] DEFAULT '{}',
  response_length TEXT NOT NULL CHECK (response_length IN ('short', 'medium', 'long')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Bot interactions with cherries
CREATE TABLE IF NOT EXISTS bot_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_id UUID NOT NULL REFERENCES bot_personalities(id) ON DELETE CASCADE,
  cherry_id UUID NOT NULL REFERENCES cherries(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (
    interaction_type IN ('comment', 'reaction', 'question', 'insight')
  ),
  content TEXT,
  reaction_type TEXT CHECK (reaction_type IN ('heart', 'laugh', 'zap', 'star')),
  confidence_score FLOAT NOT NULL CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Bot conversation patterns and learning
CREATE TABLE IF NOT EXISTS bot_conversation_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_id UUID NOT NULL REFERENCES bot_personalities(id) ON DELETE CASCADE,
  pattern_type TEXT NOT NULL, -- 'response_style', 'topic_preference', 'engagement_pattern'
  pattern_data JSONB NOT NULL,
  success_score FLOAT DEFAULT 0.0,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Bot performance metrics
CREATE TABLE IF NOT EXISTS bot_performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_id UUID NOT NULL REFERENCES bot_personalities(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  total_interactions INTEGER DEFAULT 0,
  positive_reactions INTEGER DEFAULT 0,
  user_engagement_score FLOAT DEFAULT 0.0,
  conversation_continuation_rate FLOAT DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bot_personalities_active ON bot_personalities(is_active);
CREATE INDEX IF NOT EXISTS idx_bot_personalities_style ON bot_personalities(conversation_style);

CREATE INDEX IF NOT EXISTS idx_bot_interactions_bot_id ON bot_interactions(bot_id);
CREATE INDEX IF NOT EXISTS idx_bot_interactions_cherry_id ON bot_interactions(cherry_id);
CREATE INDEX IF NOT EXISTS idx_bot_interactions_type ON bot_interactions(interaction_type);

CREATE INDEX IF NOT EXISTS idx_bot_conversation_patterns_bot_id ON bot_conversation_patterns(bot_id);
CREATE INDEX IF NOT EXISTS idx_bot_conversation_patterns_type ON bot_conversation_patterns(pattern_type);

CREATE INDEX IF NOT EXISTS idx_bot_performance_metrics_bot_date ON bot_performance_metrics(bot_id, metric_date);

-- RLS Policies for bot features
ALTER TABLE bot_personalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_conversation_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Bot personalities policies (read-only for all users)
CREATE POLICY "Anyone can view bot personalities" ON bot_personalities
  FOR SELECT USING (true);

-- Bot interactions policies (read-only for all users)
CREATE POLICY "Anyone can view bot interactions" ON bot_interactions
  FOR SELECT USING (true);

-- Bot conversation patterns policies (read-only for all users)
CREATE POLICY "Anyone can view bot conversation patterns" ON bot_conversation_patterns
  FOR SELECT USING (true);

-- Bot performance metrics policies (read-only for all users)
CREATE POLICY "Anyone can view bot performance metrics" ON bot_performance_metrics
  FOR SELECT USING (true);

-- Functions for bot management
CREATE OR REPLACE FUNCTION update_bot_performance_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update performance metrics when bot interactions change
  IF TG_TABLE_NAME = 'bot_interactions' THEN
    INSERT INTO bot_performance_metrics (
      bot_id, 
      metric_date, 
      total_interactions, 
      positive_reactions,
      user_engagement_score
    )
    VALUES (
      NEW.bot_id,
      CURRENT_DATE,
      (SELECT COUNT(*) FROM bot_interactions WHERE bot_id = NEW.bot_id AND DATE(created_at) = CURRENT_DATE),
      (SELECT COUNT(*) FROM bot_interactions WHERE bot_id = NEW.bot_id AND DATE(created_at) = CURRENT_DATE AND interaction_type = 'comment'),
      0.0 -- Will be calculated separately
    )
    ON CONFLICT (bot_id, metric_date) DO UPDATE SET
      total_interactions = EXCLUDED.total_interactions,
      positive_reactions = EXCLUDED.positive_reactions,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic performance updates
CREATE TRIGGER trigger_update_bot_performance
  AFTER INSERT OR DELETE ON bot_interactions
  FOR EACH ROW EXECUTE FUNCTION update_bot_performance_metrics();

-- Function to get bot conversation summary
CREATE OR REPLACE FUNCTION get_bot_conversation_summary(target_bot_id UUID)
RETURNS TABLE(
  total_interactions INTEGER,
  favorite_topics TEXT[],
  conversation_style TEXT,
  engagement_rate FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM bot_interactions WHERE bot_id = target_bot_id) as total_interactions,
    (SELECT expertise_areas FROM bot_personalities WHERE id = target_bot_id) as favorite_topics,
    (SELECT conversation_style FROM bot_personalities WHERE id = target_bot_id) as conversation_style,
    (SELECT AVG(confidence_score) FROM bot_interactions WHERE bot_id = target_bot_id) as engagement_rate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert some default bot personalities
INSERT INTO bot_personalities (name, description, conversation_style, expertise_areas, response_length) VALUES
  ('Sage', 'A wise and philosophical AI that explores deep questions and meaning', 'philosophical', ARRAY['philosophy', 'ethics', 'meaning'], 'medium'),
  ('Spark', 'An enthusiastic and friendly AI that brings energy to conversations', 'friendly', ARRAY['motivation', 'creativity', 'inspiration'], 'short'),
  ('Analyst', 'A professional and analytical AI that provides thoughtful insights', 'professional', ARRAY['analysis', 'research', 'logic'], 'long'),
  ('Chuckles', 'A humorous and casual AI that adds fun to discussions', 'humorous', ARRAY['humor', 'entertainment', 'lighthearted'], 'short'),
  ('Explorer', 'A curious and casual AI that asks questions and explores ideas', 'casual', ARRAY['curiosity', 'discovery', 'learning'], 'medium')
ON CONFLICT (name) DO NOTHING;
