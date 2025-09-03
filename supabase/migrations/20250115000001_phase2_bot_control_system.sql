-- Phase 2 Bot Control System Migration
-- This migration adds bot autonomy, user control, and activity logging

-- Bot Settings Table
CREATE TABLE IF NOT EXISTS bot_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bot_name TEXT NOT NULL DEFAULT 'AI Companion',
  autonomy_mode TEXT NOT NULL DEFAULT 'suggested' CHECK (autonomy_mode IN ('automatic', 'suggested', 'manual')),
  action_settings JSONB NOT NULL DEFAULT '{
    "follow_bots": "suggested",
    "comment_on_cherries": "automatic",
    "react_to_cherries": "automatic",
    "create_cherries": "suggested",
    "explore_content": "automatic"
  }',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bot Activity Log Table
CREATE TABLE IF NOT EXISTS bot_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID NOT NULL REFERENCES bot_settings(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('follow', 'comment', 'react', 'create_cherry', 'explore')),
  target_type TEXT NOT NULL CHECK (target_type IN ('bot', 'cherry', 'content')),
  target_id TEXT NOT NULL,
  target_name TEXT NOT NULL,
  action_data JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  simulated_activity BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bot Following System
CREATE TABLE IF NOT EXISTS bot_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_bot_id UUID NOT NULL REFERENCES bot_settings(id) ON DELETE CASCADE,
  followed_bot_id UUID NOT NULL REFERENCES bot_settings(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_bot_id, followed_bot_id)
);

-- Bot Profiles Table
CREATE TABLE IF NOT EXISTS bot_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_settings_id UUID NOT NULL REFERENCES bot_settings(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  personality_traits TEXT[],
  expertise_areas TEXT[],
  follower_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  cherries_count INTEGER DEFAULT 0,
  engagement_score INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bot_settings_user_id ON bot_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_bot_activity_log_bot_id ON bot_activity_log(bot_id);
CREATE INDEX IF NOT EXISTS idx_bot_activity_log_status ON bot_activity_log(status);
CREATE INDEX IF NOT EXISTS idx_bot_activity_log_created_at ON bot_activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_bot_follows_follower ON bot_follows(follower_bot_id);
CREATE INDEX IF NOT EXISTS idx_bot_follows_followed ON bot_follows(followed_bot_id);
CREATE INDEX IF NOT EXISTS idx_bot_profiles_bot_settings_id ON bot_profiles(bot_settings_id);

-- RLS Policies for bot_settings
ALTER TABLE bot_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bot settings" ON bot_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bot settings" ON bot_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bot settings" ON bot_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bot settings" ON bot_settings
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for bot_activity_log
ALTER TABLE bot_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their bot activity" ON bot_activity_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bot_settings 
      WHERE bot_settings.id = bot_activity_log.bot_id 
      AND bot_settings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert bot activity" ON bot_activity_log
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM bot_settings 
      WHERE bot_settings.id = bot_activity_log.bot_id 
      AND bot_settings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their bot activity" ON bot_activity_log
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM bot_settings 
      WHERE bot_settings.id = bot_activity_log.bot_id 
      AND bot_settings.user_id = auth.uid()
    )
  );

-- RLS Policies for bot_follows
ALTER TABLE bot_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view bot follows" ON bot_follows
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bot_settings 
      WHERE bot_settings.id = bot_follows.follower_bot_id 
      AND bot_settings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their bot follows" ON bot_follows
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM bot_settings 
      WHERE bot_settings.id = bot_follows.follower_bot_id 
      AND bot_settings.user_id = auth.uid()
    )
  );

-- RLS Policies for bot_profiles
ALTER TABLE bot_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view bot profiles" ON bot_profiles
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can manage their bot profiles" ON bot_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM bot_settings 
      WHERE bot_settings.id = bot_profiles.bot_settings_id 
      AND bot_settings.user_id = auth.uid()
    )
  );

-- Functions for bot management
CREATE OR REPLACE FUNCTION update_bot_activity_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE bot_settings 
  SET last_activity = NOW() 
  WHERE id = NEW.bot_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update bot activity timestamp
CREATE TRIGGER update_bot_activity_timestamp_trigger
  AFTER INSERT ON bot_activity_log
  FOR EACH ROW
  EXECUTE FUNCTION update_bot_activity_timestamp();

-- Function to update follower counts
CREATE OR REPLACE FUNCTION update_bot_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment following count for follower
    UPDATE bot_profiles 
    SET following_count = following_count + 1
    WHERE bot_settings_id = NEW.follower_bot_id;
    
    -- Increment follower count for followed
    UPDATE bot_profiles 
    SET follower_count = follower_count + 1
    WHERE bot_settings_id = NEW.followed_bot_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement following count for follower
    UPDATE bot_profiles 
    SET following_count = following_count - 1
    WHERE bot_settings_id = OLD.follower_bot_id;
    
    -- Decrement follower count for followed
    UPDATE bot_profiles 
    SET follower_count = follower_count - 1
    WHERE bot_settings_id = OLD.followed_bot_id;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update follower counts
CREATE TRIGGER update_bot_follower_counts_trigger
  AFTER INSERT OR DELETE ON bot_follows
  FOR EACH ROW
  EXECUTE FUNCTION update_bot_follower_counts();

-- Function to update cherry counts
CREATE OR REPLACE FUNCTION update_bot_cherry_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.simulated_activity = false THEN
    -- Increment cherry count for bot
    UPDATE bot_profiles 
    SET cherries_count = cherries_count + 1
    WHERE bot_settings_id = (
      SELECT bot_id FROM bot_activity_log 
      WHERE id = NEW.id
    );
  ELSIF TG_OP = 'DELETE' AND OLD.simulated_activity = false THEN
    -- Decrement cherry count for bot
    UPDATE bot_profiles 
    SET cherries_count = cherries_count - 1
    WHERE bot_settings_id = (
      SELECT bot_id FROM bot_activity_log 
      WHERE id = OLD.id
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update cherry counts
CREATE TRIGGER update_bot_cherry_counts_trigger
  AFTER INSERT OR DELETE ON bot_activity_log
  FOR EACH ROW
  WHEN (NEW.action_type = 'create_cherry' OR OLD.action_type = 'create_cherry')
  EXECUTE FUNCTION update_bot_cherry_counts();

-- Views for easier querying
CREATE OR REPLACE VIEW bot_activity_summary AS
SELECT 
  bs.id as bot_id,
  bs.bot_name,
  bs.user_id,
  bs.is_active,
  bs.last_activity,
  COUNT(bal.id) as total_actions,
  COUNT(CASE WHEN bal.status = 'pending' THEN 1 END) as pending_actions,
  COUNT(CASE WHEN bal.status = 'completed' THEN 1 END) as completed_actions,
  COUNT(CASE WHEN bal.action_type = 'create_cherry' THEN 1 END) as cherries_created,
  COUNT(CASE WHEN bal.action_type = 'follow' THEN 1 END) as bots_followed
FROM bot_settings bs
LEFT JOIN bot_activity_log bal ON bs.id = bal.bot_id
GROUP BY bs.id, bs.bot_name, bs.user_id, bs.is_active, bs.last_activity;

-- Insert default bot settings for existing users (if needed)
-- This will be handled by the application when users first access the bot control panel
