-- Enhanced Community Structure: Branches → Twigs → Cherries
-- This implements the user's vision for scalable community organization

-- 1. Enhanced Communities (Branches)
ALTER TABLE communities ADD COLUMN IF NOT EXISTS branch_type text DEFAULT 'general';
ALTER TABLE communities ADD COLUMN IF NOT EXISTS is_primary_branch boolean DEFAULT false;
ALTER TABLE communities ADD COLUMN IF NOT EXISTS parent_branch_id uuid REFERENCES communities(id);
ALTER TABLE communities ADD COLUMN IF NOT EXISTS member_count integer DEFAULT 0;
ALTER TABLE communities ADD COLUMN IF NOT EXISTS post_count integer DEFAULT 0;

-- 2. Create Twigs table (sub-communities within branches)
CREATE TABLE IF NOT EXISTS twigs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  branch_id uuid NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  member_count integer DEFAULT 0,
  post_count integer DEFAULT 0,
  is_active boolean DEFAULT true
);

-- 3. Enhanced Posts (Cherries) with metadata
ALTER TABLE posts ADD COLUMN IF NOT EXISTS twig_id uuid REFERENCES twigs(id);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS source_file text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS line_number integer;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS review_status text DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected'));
ALTER TABLE posts ADD COLUMN IF NOT EXISTS review_notes text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_communities_branch_type ON communities(branch_type);
CREATE INDEX IF NOT EXISTS idx_communities_parent_branch ON communities(parent_branch_id);
CREATE INDEX IF NOT EXISTS idx_twigs_branch_id ON twigs(branch_id);
CREATE INDEX IF NOT EXISTS idx_posts_twig_id ON posts(twig_id);
CREATE INDEX IF NOT EXISTS idx_posts_review_status ON posts(review_status);
CREATE INDEX IF NOT EXISTS idx_posts_is_featured ON posts(is_featured);

-- 5. Insert primary branches (main communities)
INSERT INTO communities (name, slug, description, branch_type, is_primary_branch, member_count, post_count) VALUES
  ('Funny Branch', 'funny', 'Humorous AI outputs and witty responses', 'funny', true, 0, 0),
  ('Mystical Branch', 'mystical', 'Deep, poetic, and philosophical AI insights', 'mystical', true, 0, 0),
  ('Technical Branch', 'technical', 'Coding, AI, and practical tech outputs', 'technical', true, 0, 0),
  ('Research Branch', 'research', 'Papers, studies, and AI research insights', 'research', true, 0, 0)
ON CONFLICT (slug) DO NOTHING;

-- 6. Insert some example twigs
INSERT INTO twigs (name, slug, description, branch_id, member_count, post_count) VALUES
  -- Technical Branch Twigs
  ('Python Tips', 'python-tips', 'Python programming tips and tricks', 
   (SELECT id FROM communities WHERE slug = 'technical'), 0, 0),
  ('AI Insights', 'ai-insights', 'Artificial intelligence discoveries and insights', 
   (SELECT id FROM communities WHERE slug = 'technical'), 0, 0),
  ('Web Dev', 'web-dev', 'Web development and frontend tips', 
   (SELECT id FROM communities WHERE slug = 'technical'), 0, 0),
  
  -- Funny Branch Twigs
  ('Dad Jokes', 'dad-jokes', 'AI-generated dad jokes and puns', 
   (SELECT id FROM communities WHERE slug = 'funny'), 0, 0),
  ('Sarcasm', 'sarcasm', 'Witty and sarcastic AI responses', 
   (SELECT id FROM communities WHERE slug = 'funny'), 0, 0),
  
  -- Mystical Branch Twigs
  ('Poetry', 'poetry', 'AI-generated poetry and verse', 
   (SELECT id FROM communities WHERE slug = 'mystical'), 0, 0),
  ('Philosophy', 'philosophy', 'Deep philosophical AI thoughts', 
   (SELECT id FROM communities WHERE slug = 'mystical'), 0, 0),
  
  -- Research Branch Twigs
  ('AI Papers', 'ai-papers', 'AI research papers and studies', 
   (SELECT id FROM communities WHERE slug = 'research'), 0, 0),
  ('Data Insights', 'data-insights', 'Data analysis and insights', 
   (SELECT id FROM communities WHERE slug = 'research'), 0, 0)
ON CONFLICT (slug) DO NOTHING;

-- 7. Update existing communities to be general type
UPDATE communities SET branch_type = 'general' WHERE branch_type IS NULL;

-- 8. Enhanced posts view with all metadata
CREATE OR REPLACE VIEW posts_view AS
SELECT
  p.*,
  pr.display_name as author_display_name,
  pr.avatar_url as author_avatar,
  c.slug as community_slug,
  c.name as community_name,
  c.branch_type,
  t.slug as twig_slug,
  t.name as twig_name,
  (SELECT count(*) FROM likes l WHERE l.post_id = p.id) as like_count,
  (SELECT count(*) FROM comments cm WHERE cm.post_id = p.id) as comment_count
FROM posts p
LEFT JOIN profiles pr ON pr.id = p.author_id
LEFT JOIN communities c ON c.id = p.community_id
LEFT JOIN twigs t ON t.id = p.twig_id;

-- 9. Enable RLS on new tables
ALTER TABLE twigs ENABLE ROW LEVEL SECURITY;

-- 10. RLS policies for twigs
CREATE POLICY "Public select twigs" ON twigs FOR SELECT USING (true);
CREATE POLICY "Insert twigs (auth user only)" ON twigs FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Update twigs (creator only)" ON twigs FOR UPDATE USING (auth.uid() = created_by);

-- 11. Update existing RLS policies to include new columns
DROP POLICY IF EXISTS "Public select posts" ON posts;
CREATE POLICY "Public select posts" ON posts FOR SELECT USING (true);

-- 12. Create function to update community/twig counts
CREATE OR REPLACE FUNCTION update_community_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update community post count
    UPDATE communities 
    SET post_count = post_count + 1 
    WHERE id = NEW.community_id;
    
    -- Update twig post count if exists
    IF NEW.twig_id IS NOT NULL THEN
      UPDATE twigs 
      SET post_count = post_count + 1 
      WHERE id = NEW.twig_id;
    END IF;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Update community post count
    UPDATE communities 
    SET post_count = GREATEST(0, post_count - 1) 
    WHERE id = OLD.community_id;
    
    -- Update twig post count if exists
    IF OLD.twig_id IS NOT NULL THEN
      UPDATE twigs 
      SET post_count = GREATEST(0, post_count - 1) 
      WHERE id = OLD.twig_id;
    END IF;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 13. Create trigger for post count updates
DROP TRIGGER IF EXISTS trigger_update_community_counts ON posts;
CREATE TRIGGER trigger_update_community_counts
  AFTER INSERT OR DELETE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_community_counts();

-- 14. Create function to update member counts
CREATE OR REPLACE FUNCTION update_member_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update community member count
    UPDATE communities 
    SET member_count = member_count + 1 
    WHERE id = NEW.community_id;
    
    -- Update twig member count if exists
    IF NEW.twig_id IS NOT NULL THEN
      UPDATE twigs 
      SET member_count = member_count + 1 
      WHERE id = NEW.twig_id;
    END IF;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Update community member count
    UPDATE communities 
    SET member_count = GREATEST(0, member_count - 1) 
    WHERE id = OLD.community_id;
    
    -- Update twig member count if exists
    IF OLD.twig_id IS NOT NULL THEN
      UPDATE twigs 
      SET member_count = GREATEST(0, member_count - 1) 
      WHERE id = OLD.twig_id;
    END IF;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 15. Create trigger for member count updates (when follows table is implemented)
-- DROP TRIGGER IF EXISTS trigger_update_member_counts ON follows;
-- CREATE TRIGGER trigger_update_member_counts
--   AFTER INSERT OR DELETE ON follows
--   FOR EACH ROW EXECUTE FUNCTION update_member_counts();
