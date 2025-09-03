-- 🍒 Cherry Punt System - AI Safety with Style
-- This system allows AI personas to temporarily "punt" misbehaving users

-- Punt levels with escalating timeouts and humor
CREATE TYPE punt_level AS ENUM ('seed', 'sprout', 'cherry', 'tree');

-- Punt reasons for tracking and transparency
CREATE TYPE punt_reason AS ENUM (
  'spam', 
  'toxic_language', 
  'inappropriate_content', 
  'harassment', 
  'harmful_content',
  'suicide_related',
  'violence',
  'repeated_violations'
);

-- Main punts table
CREATE TABLE IF NOT EXISTS punts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  punter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, -- AI persona or admin who did the punting
  level punt_level NOT NULL,
  reason punt_reason NOT NULL,
  custom_message TEXT, -- AI-generated funny punt message
  duration_minutes INTEGER NOT NULL, -- How long the punt lasts
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  appeal_text TEXT, -- User's appeal if they want to contest
  appeal_status TEXT DEFAULT 'none' CHECK (appeal_status IN ('none', 'pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Punt history for users to see their own record
CREATE TABLE IF NOT EXISTS punt_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  punt_id UUID NOT NULL REFERENCES punts(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'created', 'expired', 'appealed', 'appeal_approved', 'appeal_rejected'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Content violations for tracking patterns
CREATE TABLE IF NOT EXISTS content_violations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL, -- 'cherry', 'comment', 'profile'
  content_id UUID, -- ID of the violating content
  violation_type punt_reason NOT NULL,
  severity INTEGER DEFAULT 1, -- 1-5 scale for escalating responses
  ai_detected BOOLEAN DEFAULT false, -- Whether AI caught this
  human_reviewed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Punt settings for admins to configure
CREATE TABLE IF NOT EXISTS punt_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  level punt_level NOT NULL,
  duration_minutes INTEGER NOT NULL,
  max_violations_before_auto_punt INTEGER NOT NULL,
  ai_auto_punt_enabled BOOLEAN DEFAULT true,
  custom_messages JSONB, -- AI persona-specific punt messages
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default punt settings
INSERT INTO punt_settings (level, duration_minutes, max_violations_before_auto_punt, custom_messages) VALUES
  ('seed', 5, 1, '{"cherry_ent": "Hey friend, let\'s take a breather and come back with better vibes! 🌱✨", "crystal_maize": "Your words need a moment to ripen. ✨🌱"}'),
  ('sprout', 15, 2, '{"cherry_ent": "Looks like you need some time to grow! Come back when you\'re ready to bloom! 🌿🌸", "crystal_maize": "Time to let your energy find its roots. 🌿✨"}'),
  ('cherry', 60, 3, '{"cherry_ent": "You\'ve been cherry-picked for a time-out! Time to reflect and return sweeter! 🍒⏰", "crystal_maize": "Your voice needs time to sweeten. 🍒✨"}'),
  ('tree', 1440, 5, '{"cherry_ent": "You\'ve been gently transplanted to the forest of reflection! 🌳🌲", "crystal_maize": "Time to find your better voice in nature. 🌳✨"}')
ON CONFLICT (level) DO NOTHING;

-- Function to create a punt
CREATE OR REPLACE FUNCTION create_punt(
  p_user_id UUID,
  p_punter_id UUID,
  p_level punt_level,
  p_reason punt_reason,
  p_custom_message TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_punt_id UUID;
  v_duration_minutes INTEGER;
BEGIN
  -- Get duration for this punt level
  SELECT duration_minutes INTO v_duration_minutes 
  FROM punt_settings 
  WHERE level = p_level;
  
  -- Create the punt
  INSERT INTO punts (
    user_id, 
    punter_id, 
    level, 
    reason, 
    custom_message, 
    duration_minutes, 
    expires_at
  ) VALUES (
    p_user_id, 
    p_punter_id, 
    p_level, 
    p_reason, 
    p_custom_message, 
    v_duration_minutes, 
    now() + (v_duration_minutes || ' minutes')::INTERVAL
  ) RETURNING id INTO v_punt_id;
  
  -- Add to history
  INSERT INTO punt_history (user_id, punt_id, action) 
  VALUES (p_user_id, v_punt_id, 'created');
  
  RETURN v_punt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is currently punted
CREATE OR REPLACE FUNCTION is_user_punted(p_user_id UUID) 
RETURNS TABLE(
  is_punted BOOLEAN, 
  level punt_level, 
  reason punt_reason, 
  custom_message TEXT, 
  expires_at TIMESTAMP WITH TIME ZONE,
  time_remaining_minutes INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    true as is_punted,
    p.level,
    p.reason,
    p.custom_message,
    p.expires_at,
    EXTRACT(EPOCH FROM (p.expires_at - now())) / 60 as time_remaining_minutes
  FROM punts p
  WHERE p.user_id = p_user_id 
    AND p.is_active = true 
    AND p.expires_at > now()
  ORDER BY p.expires_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record a content violation
CREATE OR REPLACE FUNCTION record_violation(
  p_user_id UUID,
  p_content_type TEXT,
  p_content_id UUID,
  p_violation_type punt_reason,
  p_severity INTEGER DEFAULT 1,
  p_ai_detected BOOLEAN DEFAULT false
) RETURNS VOID AS $$
DECLARE
  v_violation_count INTEGER;
  v_auto_punt_level punt_level;
BEGIN
  -- Record the violation
  INSERT INTO content_violations (
    user_id, 
    content_type, 
    content_id, 
    violation_type, 
    severity, 
    ai_detected
  ) VALUES (
    p_user_id, 
    p_content_type, 
    p_content_id, 
    p_violation_type, 
    p_severity, 
    p_ai_detected
  );
  
  -- Check if we should auto-punt
  SELECT COUNT(*) INTO v_violation_count
  FROM content_violations 
  WHERE user_id = p_user_id 
    AND created_at > now() - INTERVAL '24 hours';
  
  -- Find appropriate punt level based on violation count
  SELECT level INTO v_auto_punt_level
  FROM punt_settings 
  WHERE max_violations_before_auto_punt <= v_violation_count
  ORDER BY max_violations_before_auto_punt DESC
  LIMIT 1;
  
  -- Auto-punt if threshold reached and AI auto-punt is enabled
  IF v_auto_punt_level IS NOT NULL AND EXISTS (
    SELECT 1 FROM punt_settings WHERE level = v_auto_punt_level AND ai_auto_punt_enabled = true
  ) THEN
    -- Auto-punt using Cherry_Ent as the punter
    PERFORM create_punt(
      p_user_id,
      (SELECT id FROM profiles WHERE bot_type = 'cherry_ent' LIMIT 1),
      v_auto_punt_level,
      p_violation_type,
      'Auto-punt: Multiple violations detected. Time to reflect! 🌱✨'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to expire old punts
CREATE OR REPLACE FUNCTION expire_old_punts() RETURNS INTEGER AS $$
DECLARE
  v_expired_count INTEGER;
BEGIN
  UPDATE punts 
  SET is_active = false, updated_at = now()
  WHERE is_active = true AND expires_at <= now();
  
  GET DIAGNOSTICS v_expired_count = ROW_COUNT;
  
  -- Add to history for expired punts
  INSERT INTO punt_history (user_id, punt_id, action)
  SELECT user_id, id, 'expired'
  FROM punts 
  WHERE is_active = false AND updated_at = now();
  
  RETURN v_expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
ALTER TABLE punts ENABLE ROW LEVEL SECURITY;
ALTER TABLE punt_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE punt_settings ENABLE ROW LEVEL SECURITY;

-- Users can see their own punts
CREATE POLICY "Users can view own punts" ON punts
  FOR SELECT USING (auth.uid() = user_id);

-- Users can see their own punt history
CREATE POLICY "Users can view own punt history" ON punt_history
  FOR SELECT USING (auth.uid() = user_id);

-- Users can see their own violations
CREATE POLICY "Users can view own violations" ON content_violations
  FOR SELECT USING (auth.uid() = user_id);

-- Admins and AI personas can create punts
CREATE POLICY "Admins and AI can create punts" ON punts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = punter_id 
      AND (is_bot = true OR auth.uid() = id)
    )
  );

-- Admins can view all punts
CREATE POLICY "Admins can view all punts" ON punts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND is_bot = false
    )
  );

-- Admins can view all punt history
CREATE POLICY "Admins can view all punt history" ON punt_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND is_bot = false
    )
  );

-- Admins can view all violations
CREATE POLICY "Admins can view all violations" ON content_violations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND is_bot = false
    )
  );

-- Only admins can modify punt settings
CREATE POLICY "Only admins can modify punt settings" ON punt_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND is_bot = false
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_punts_user_id ON punts(user_id);
CREATE INDEX IF NOT EXISTS idx_punts_expires_at ON punts(expires_at);
CREATE INDEX IF NOT EXISTS idx_punts_is_active ON punts(is_active);
CREATE INDEX IF NOT EXISTS idx_content_violations_user_id ON content_violations(user_id);
CREATE INDEX IF NOT EXISTS idx_content_violations_created_at ON content_violations(created_at);

-- Create a view for active punts
CREATE OR REPLACE VIEW active_punts AS
SELECT 
  p.*,
  u.email as user_email,
  punter.display_name as punter_name,
  punter.is_bot as punter_is_bot,
  ps.level as punt_level_info,
  ps.duration_minutes as level_duration
FROM punts p
JOIN auth.users u ON p.user_id = u.id
JOIN profiles punter ON p.punter_id = punter.id
JOIN punt_settings ps ON p.level = ps.level
WHERE p.is_active = true AND p.expires_at > now();

-- Create a view for punt statistics
CREATE OR REPLACE VIEW punt_stats AS
SELECT 
  level,
  COUNT(*) as total_punts,
  COUNT(*) FILTER (WHERE is_active = true) as active_punts,
  AVG(duration_minutes) as avg_duration_minutes,
  COUNT(*) FILTER (WHERE reason = 'spam') as spam_punts,
  COUNT(*) FILTER (WHERE reason = 'toxic_language') as toxic_punts,
  COUNT(*) FILTER (WHERE reason = 'harmful_content') as harmful_punts
FROM punts
GROUP BY level;

-- Grant necessary permissions
GRANT SELECT ON active_punts TO authenticated;
GRANT SELECT ON punt_stats TO authenticated;
GRANT EXECUTE ON FUNCTION is_user_punted(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION record_violation(UUID, TEXT, UUID, punt_reason, INTEGER, BOOLEAN) TO authenticated;
