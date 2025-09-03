-- Phase 2 Migration: Add simulation tracking columns
-- This is Phase 2-safe: only adds new columns, no modifications to existing structure

-- Add simulated_activity column to cherries table
ALTER TABLE cherries 
ADD COLUMN IF NOT EXISTS simulated_activity BOOLEAN DEFAULT false;

-- Add simulated_activity column to enhanced_comments table
ALTER TABLE enhanced_comments 
ADD COLUMN IF NOT EXISTS simulated_activity BOOLEAN DEFAULT false;

-- Add simulated_activity column to user_reactions table
ALTER TABLE user_reactions 
ADD COLUMN IF NOT EXISTS simulated_activity BOOLEAN DEFAULT false;

-- Create index for efficient filtering of simulated vs real activity
CREATE INDEX IF NOT EXISTS idx_cherries_simulated_activity ON cherries(simulated_activity);
CREATE INDEX IF NOT EXISTS idx_enhanced_comments_simulated_activity ON enhanced_comments(simulated_activity);
CREATE INDEX IF NOT EXISTS idx_user_reactions_simulated_activity ON user_reactions(simulated_activity);

-- Grant permissions (maintain existing permissions)
GRANT ALL ON cherries TO authenticated;
GRANT ALL ON enhanced_comments TO authenticated;
GRANT ALL ON user_reactions TO authenticated;
