-- Docked Assistant Bot System Migration
-- This migration adds the core tables for the permanent docked assistant bot

-- Enable UUIDs if not already enabled
create extension if not exists "uuid-ossp";

-- 1. Bot Profiles (one per user)
create table if not exists bot_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null default 'My Bot',
  avatar_url text,
  description text,
  persona jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

-- 2. Bot Settings (autonomy and behavior controls)
create table if not exists bot_settings (
  user_id uuid primary key references profiles(id) on delete cascade,
  autonomy_level text not null default 'suggestive' check (autonomy_level in ('passive', 'suggestive', 'active')),
  category_scope text[] not null default '{}',
  daily_save_cap int not null default 5,
  daily_react_cap int not null default 15,
  snoozed_until timestamptz,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Bot Reports (proposals and suggestions from bot to user)
create table if not exists bot_reports (
  id bigserial primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  kind text not null check (kind in ('found_cherry', 'follow_suggestion', 'reply_suggestion', 'save_suggestion', 'react_suggestion')),
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'dismissed', 'expired')),
  confidence_score decimal(3,2) not null default 0.5,
  created_at timestamptz default now(),
  seen_at timestamptz,
  responded_at timestamptz
);

-- 4. Bot Actions (auditable log of all bot actions)
create table if not exists bot_actions (
  id bigserial primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  bot_profile_id uuid references bot_profiles(id) on delete set null,
  action text not null check (action in ('save', 'react', 'follow', 'comment', 'ping', 'report_generated', 'settings_updated')),
  subject_id uuid, -- cherry_id, bot_id, or other relevant ID
  subject_type text, -- 'cherry', 'bot', 'user', etc.
  meta jsonb not null default '{}'::jsonb,
  approved_by_user boolean default true,
  created_at timestamptz default now()
);

-- 5. Bot Conversations (chat history with the docked assistant)
create table if not exists bot_conversations (
  id bigserial primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  message_type text not null check (message_type in ('user', 'bot', 'system')),
  content text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Create indexes for performance
create index if not exists idx_bot_profiles_user_id on bot_profiles(user_id);
create index if not exists idx_bot_settings_user_id on bot_settings(user_id);
create index if not exists idx_bot_reports_user_id on bot_reports(user_id);
create index if not exists idx_bot_reports_status on bot_reports(status);
create index if not exists idx_bot_reports_created_at on bot_reports(created_at desc);
create index if not exists idx_bot_actions_user_id on bot_actions(user_id);
create index if not exists idx_bot_actions_created_at on bot_actions(created_at desc);
create index if not exists idx_bot_conversations_user_id on bot_conversations(user_id);
create index if not exists idx_bot_conversations_created_at on bot_conversations(created_at desc);

-- Create updated_at trigger function if it doesn't exist
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add updated_at triggers
create trigger update_bot_profiles_updated_at before update on bot_profiles
  for each row execute function update_updated_at_column();

create trigger update_bot_settings_updated_at before update on bot_settings
  for each row execute function update_updated_at_column();

-- Row Level Security (RLS) policies
alter table bot_profiles enable row level security;
alter table bot_settings enable row level security;
alter table bot_reports enable row level security;
alter table bot_actions enable row level security;
alter table bot_conversations enable row level security;

-- Bot Profiles RLS
create policy "Users can view their own bot profile" on bot_profiles
  for select using (auth.uid() = user_id);

create policy "Users can insert their own bot profile" on bot_profiles
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own bot profile" on bot_profiles
  for update using (auth.uid() = user_id);

create policy "Users can delete their own bot profile" on bot_profiles
  for delete using (auth.uid() = user_id);

-- Bot Settings RLS
create policy "Users can view their own bot settings" on bot_settings
  for select using (auth.uid() = user_id);

create policy "Users can insert their own bot settings" on bot_settings
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own bot settings" on bot_settings
  for update using (auth.uid() = user_id);

create policy "Users can delete their own bot settings" on bot_settings
  for delete using (auth.uid() = user_id);

-- Bot Reports RLS
create policy "Users can view their own bot reports" on bot_reports
  for select using (auth.uid() = user_id);

create policy "Users can insert their own bot reports" on bot_reports
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own bot reports" on bot_reports
  for update using (auth.uid() = user_id);

create policy "Users can delete their own bot reports" on bot_reports
  for delete using (auth.uid() = user_id);

-- Bot Actions RLS
create policy "Users can view their own bot actions" on bot_actions
  for select using (auth.uid() = user_id);

create policy "Users can insert their own bot actions" on bot_actions
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own bot actions" on bot_actions
  for update using (auth.uid() = user_id);

create policy "Users can delete their own bot actions" on bot_actions
  for delete using (auth.uid() = user_id);

-- Bot Conversations RLS
create policy "Users can view their own bot conversations" on bot_conversations
  for select using (auth.uid() = user_id);

create policy "Users can insert their own bot conversations" on bot_conversations
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own bot conversations" on bot_conversations
  for update using (auth.uid() = user_id);

create policy "Users can delete their own bot conversations" on bot_conversations
  for delete using (auth.uid() = user_id);

-- Insert default bot profiles for existing users
insert into bot_profiles (user_id, name, description, persona)
select 
  id as user_id,
  'My Assistant' as name,
  'Your personal AI companion for exploring and organizing cherries' as description,
  jsonb_build_object(
    'tone', 'friendly',
    'expertise', array['content_discovery', 'organization', 'summarization'],
    'personality', 'helpful and curious'
  ) as persona
from profiles
where not exists (
  select 1 from bot_profiles where bot_profiles.user_id = profiles.id
);

-- Insert default bot settings for existing users
insert into bot_settings (user_id, autonomy_level, category_scope, daily_save_cap, daily_react_cap)
select 
  id as user_id,
  'suggestive' as autonomy_level,
  array['Technical', 'Funny', 'Ideas'] as category_scope,
  5 as daily_save_cap,
  15 as daily_react_cap
from profiles
where not exists (
  select 1 from bot_settings where bot_settings.user_id = profiles.id
);

-- Add comments for documentation
comment on table bot_profiles is 'One bot profile per user - their personal AI assistant';
comment on table bot_settings is 'Bot autonomy and behavior settings';
comment on table bot_reports is 'Proposals and suggestions from bot to user';
comment on table bot_actions is 'Auditable log of all bot actions';
comment on table bot_conversations is 'Chat history with the docked assistant';

comment on column bot_profiles.persona is 'JSON object containing bot personality and behavior traits';
comment on column bot_settings.autonomy_level is 'passive: only reports, suggestive: proposes actions, active: can auto-act within caps';
comment on column bot_reports.kind is 'Type of proposal: found_cherry, follow_suggestion, reply_suggestion, etc.';
comment on column bot_reports.payload is 'JSON object containing proposal details and context';
comment on column bot_actions.approved_by_user is 'Whether the action was explicitly approved by the user';
