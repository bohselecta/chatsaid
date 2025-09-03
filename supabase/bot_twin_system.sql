-- 🧠 Bot Twin System - Phase 1
-- Auto-generate bot personas from user input and enable autonomous interactions

-- Bot Twins table
CREATE TABLE IF NOT EXISTS bot_twins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bot_name TEXT NOT NULL,
    personality JSONB NOT NULL,          -- Traits, values, humor style
    quote_bank JSONB NOT NULL,           -- Array of bot-generated quotes
    avatar_seed TEXT,                    -- For generating consistent avatars
    active BOOLEAN DEFAULT true,
    last_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Bot Interactions table
CREATE TABLE IF NOT EXISTS bot_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bot_id UUID NOT NULL REFERENCES bot_twins(id) ON DELETE CASCADE,
    other_bot_id UUID NOT NULL REFERENCES bot_twins(id) ON DELETE CASCADE,
    interaction_type TEXT NOT NULL CHECK (interaction_type IN ('chat', 'react', 'shared_cherry')),
    content TEXT NOT NULL,
    metadata JSONB,                      -- Additional interaction data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Bot Interaction Queue for scheduling
CREATE TABLE IF NOT EXISTS bot_interaction_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bot_id UUID NOT NULL REFERENCES bot_twins(id) ON DELETE CASCADE,
    interaction_type TEXT NOT NULL,
    target_bot_id UUID REFERENCES bot_twins(id),
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    executed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Bot Settings for user control
CREATE TABLE IF NOT EXISTS bot_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    interaction_frequency INTEGER DEFAULT 30, -- seconds between interactions
    max_daily_interactions INTEGER DEFAULT 50,
    allow_autonomous_interactions BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default bot settings for new users
INSERT INTO bot_settings (user_id, interaction_frequency, max_daily_interactions, allow_autonomous_interactions)
SELECT id, 30, 50, true FROM auth.users
ON CONFLICT DO NOTHING;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bot_twins_user_id ON bot_twins(user_id);
CREATE INDEX IF NOT EXISTS idx_bot_twins_active ON bot_twins(active);
CREATE INDEX IF NOT EXISTS idx_bot_interactions_bot_id ON bot_interactions(bot_id);
CREATE INDEX IF NOT EXISTS idx_bot_interactions_created_at ON bot_interactions(created_at);
CREATE INDEX IF NOT EXISTS idx_bot_interaction_queue_scheduled_for ON bot_interaction_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_bot_interaction_queue_executed ON bot_interaction_queue(executed);

-- RLS Policies
ALTER TABLE bot_twins ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_interaction_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_settings ENABLE ROW LEVEL SECURITY;

-- Users can manage their own bot twins
CREATE POLICY "Users can manage own bot twins" ON bot_twins
    FOR ALL USING (auth.uid() = user_id);

-- Users can view all active bot twins (for interactions)
CREATE POLICY "Users can view all active bot twins" ON bot_twins
    FOR SELECT USING (active = true);

-- Users can view interactions involving their bots
CREATE POLICY "Users can view own bot interactions" ON bot_interactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bot_twins 
            WHERE id IN (bot_id, other_bot_id) 
            AND user_id = auth.uid()
        )
    );

-- Users can create interactions for their bots
CREATE POLICY "Users can create own bot interactions" ON bot_interactions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM bot_twins 
            WHERE id = bot_id 
            AND user_id = auth.uid()
        )
    );

-- Users can manage their own bot settings
CREATE POLICY "Users can manage own bot settings" ON bot_settings
    FOR ALL USING (auth.uid() = user_id);

-- Users can manage their own bot interaction queue
CREATE POLICY "Users can manage own bot queue" ON bot_interaction_queue
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM bot_twins 
            WHERE id = bot_id 
            AND user_id = auth.uid()
        )
    );

-- Views for easier querying
CREATE OR REPLACE VIEW active_bot_twins AS
SELECT 
    bt.*,
    u.email as user_email,
    bs.interaction_frequency,
    bs.max_daily_interactions,
    bs.allow_autonomous_interactions
FROM bot_twins bt
JOIN auth.users u ON bt.user_id = u.id
JOIN bot_settings bs ON bt.user_id = bs.user_id
WHERE bt.active = true;

CREATE OR REPLACE VIEW bot_interaction_feed AS
SELECT 
    bi.*,
    bot.bot_name as bot_name,
    bot.avatar_seed as bot_avatar_seed,
    other_bot.bot_name as other_bot_name,
    other_bot.avatar_seed as other_bot_avatar_seed,
    bot.user_id as bot_owner_id,
    other_bot.user_id as other_bot_owner_id
FROM bot_interactions bi
JOIN bot_twins bot ON bi.bot_id = bot.id
JOIN bot_twins other_bot ON bi.other_bot_id = other_bot.id
WHERE bot.active = true AND other_bot.active = true
ORDER BY bi.created_at DESC;

-- Grant necessary permissions
GRANT SELECT ON active_bot_twins TO authenticated;
GRANT SELECT ON bot_interaction_feed TO authenticated;
GRANT ALL ON bot_twins TO authenticated;
GRANT ALL ON bot_interactions TO authenticated;
GRANT ALL ON bot_settings TO authenticated;
GRANT ALL ON bot_interaction_queue TO authenticated;

