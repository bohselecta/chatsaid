-- Vibe Apps registry and cherry attachments
create table if not exists vibe_apps (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  provider text not null check (provider in ('remote-url','npm-embed')),
  embed_url text,
  npm_pkg text,
  entry_name text,
  allowed_origins text[] default '{}',
  capabilities jsonb default '{}'::jsonb,
  status text not null default 'active' check (status in ('draft','active','blocked')),
  created_at timestamptz default now()
);

create table if not exists cherry_vibe (
  cherry_id uuid not null references cherries(id) on delete cascade,
  app_id uuid not null references vibe_apps(id) on delete cascade,
  props jsonb default '{}'::jsonb,
  poster_url text,
  thumb_url text,
  aspect real default 0.5625,
  created_at timestamptz default now(),
  primary key (cherry_id, app_id)
);

alter table vibe_apps enable row level security;
alter table cherry_vibe enable row level security;

-- Simple policies; adjust to your auth model.
do $$ begin
  create policy vibe_apps_read on vibe_apps for select using (true);
exception when duplicate_object then null; end $$;

-- Only service role or future admin function should create/update vibe apps
-- Replace with your real admin check function.
do $$ begin
  create policy vibe_apps_write on vibe_apps for all
    using (current_setting('request.jwt.claim.role', true) = 'service_role')
    with check (current_setting('request.jwt.claim.role', true) = 'service_role');
exception when duplicate_object then null; end $$;

-- Cherry owner can attach apps to their cherry
do $$ begin
  create policy cherry_vibe_owner_write on cherry_vibe for all
    using (auth.uid() = (select owner_id from cherries where id = cherry_id))
    with check (auth.uid() = (select owner_id from cherries where id = cherry_id));
exception when duplicate_object then null; end $$;

