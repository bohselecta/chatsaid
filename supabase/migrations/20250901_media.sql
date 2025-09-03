-- Media assets associated with cherries or user profiles
create table if not exists media_assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  media_type text not null check (media_type in ('image','video','oembed')),
  mime text not null,
  width int,
  height int,
  duration_seconds numeric(6,2),
  alt_text text,
  caption text,
  ai_generated boolean default false,
  ai_model text,
  ai_prompt text,
  dominant_color text,
  blurhash text,
  oembed_url text,
  oembed_html text,
  safety_labels jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Many-to-many: ordered media in a cherry
create table if not exists cherry_media (
  cherry_id uuid not null references cherries(id) on delete cascade,
  media_id uuid not null references media_assets(id) on delete cascade,
  position int not null default 0,
  primary key (cherry_id, media_id)
);

-- Helpful indexes
create index if not exists media_assets_owner_idx on media_assets(owner_id);
create index if not exists cherry_media_cherry_idx on cherry_media(cherry_id);

-- RLS (owner may write, public readable when joined via a public cherry)
alter table media_assets enable row level security;
do $$ begin
  create policy media_owner_write on media_assets for all
    using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
exception when duplicate_object then null; end $$;

