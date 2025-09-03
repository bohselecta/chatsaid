-- Missing Views Migration - Add views referenced by the code but missing from schema
-- This fixes the schema mismatch that's preventing the site from loading

-- 1. Posts View (referenced by multiple components)
CREATE OR REPLACE VIEW posts_view AS
SELECT 
  p.id,
  p.body as content,
  p.created_at,
  p.author_id,
  p.community_id,
  p.author_display_name,
  p.author_avatar,
  c.slug as community_slug,
  c.name as community_name,
  COALESCE(pl.like_count, 0) as like_count,
  COALESCE(pc.comment_count, 0) as comment_count
FROM posts p
LEFT JOIN communities c ON p.community_id = c.id
LEFT JOIN (
  SELECT post_id, COUNT(*) as like_count
  FROM post_likes
  GROUP BY post_id
) pl ON p.id = pl.post_id
LEFT JOIN (
  SELECT post_id, COUNT(*) as comment_count
  FROM comments
  GROUP BY post_id
) pc ON p.id = pc.post_id;

-- 2. Communities View (if not exists)
CREATE OR REPLACE VIEW communities_view AS
SELECT 
  c.*,
  COALESCE(m.member_count, 0) as member_count,
  COALESCE(p.post_count, 0) as post_count
FROM communities c
LEFT JOIN (
  SELECT community_id, COUNT(*) as member_count
  FROM community_members
  GROUP BY community_id
) m ON c.id = m.community_id
LEFT JOIN (
  SELECT community_id, COUNT(*) as post_count
  FROM posts
  GROUP BY community_id
) p ON c.id = p.community_id;

-- 3. Enhanced Cherry View with Engagement
CREATE OR REPLACE VIEW enhanced_cherries_view AS
SELECT 
  c.*,
  p.display_name as author_display_name,
  p.avatar_url as author_avatar,
  COALESCE(ce.total_reactions, 0) as total_reactions,
  COALESCE(ce.total_comments, 0) as total_comments,
  COALESCE(ce.total_shares, 0) as total_shares,
  COALESCE(ce.engagement_score, 0) as engagement_score
FROM cherries c
LEFT JOIN profiles p ON c.author_id = p.id
LEFT JOIN cherry_engagement ce ON c.id = ce.cherry_id;

-- 4. User Activity Summary View
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT 
  ua.user_id,
  ua.activity_type,
  COUNT(*) as activity_count,
  MAX(ua.created_at) as last_activity
FROM user_activity_cache ua
WHERE ua.expires_at > NOW()
GROUP BY ua.user_id, ua.activity_type;

-- 5. Bot Interaction Summary View
CREATE OR REPLACE VIEW bot_interaction_summary AS
SELECT 
  bi.bot_id,
  bi.target_type,
  bi.interaction_type,
  COUNT(*) as interaction_count,
  AVG(CASE WHEN bi.metadata->>'success_score' IS NOT NULL 
    THEN (bi.metadata->>'success_score')::DECIMAL 
    ELSE 0.5 END) as avg_success_score,
  MAX(bi.created_at) as last_interaction
FROM bot_interactions bi
GROUP BY bi.bot_id, bi.target_type, bi.interaction_type;

-- Grant permissions to authenticated users
GRANT SELECT ON posts_view TO authenticated;
GRANT SELECT ON communities_view TO authenticated;
GRANT SELECT ON enhanced_cherries_view TO authenticated;
GRANT SELECT ON user_activity_summary TO authenticated;
GRANT SELECT ON bot_interaction_summary TO authenticated;
