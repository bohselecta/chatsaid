-- Social ingest v1: accounts, posts, rules, mapping

create table if not exists social_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('x','youtube','reddit','rss','email')),
  handle text not null,
  config jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active','paused','error')),
  last_synced_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists social_posts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references social_accounts(id) on delete cascade,
  platform_post_id text,
  url text,
  title text,
  body text,
  media jsonb not null default '[]'::jsonb,
  posted_at timestamptz,
  hash text,
  ingest_meta jsonb not null default '{}'::jsonb,
  review_status text not null default 'new' check (review_status in ('new','ignored','converted')),
  created_at timestamptz default now()
);

create table if not exists import_rules (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references social_accounts(id) on delete cascade,
  persona_slug text,
  branch text,
  filters jsonb not null default '{}'::jsonb,
  image_policy text not null default 'suggest' check (image_policy in ('none','suggest','auto-generate')),
  auto_convert boolean not null default false,
  created_at timestamptz default now()
);

-- assumes cherries table already exists
create table if not exists social_to_cherry (
  social_post_id uuid not null references social_posts(id) on delete cascade,
  cherry_id uuid not null references cherries(id) on delete cascade,
  converted_at timestamptz default now(),
  primary key (social_post_id, cherry_id)
);

-- Indexes
create index if not exists idx_social_accounts_user on social_accounts(user_id);
create index if not exists idx_social_posts_account on social_posts(account_id);
create index if not exists idx_social_posts_status on social_posts(review_status);
create index if not exists idx_social_posts_hash on social_posts(hash);
create index if not exists idx_import_rules_account on import_rules(account_id);

-- RLS
alter table social_accounts enable row level security;
alter table social_posts enable row level security;
alter table import_rules enable row level security;
alter table social_to_cherry enable row level security;

-- Policies: owner-only
create policy "Users manage own social_accounts" on social_accounts
  for all using (auth.uid() = user_id);

create policy "Users manage own social_posts" on social_posts
  for all using (exists (
    select 1 from social_accounts a where a.id = social_posts.account_id and a.user_id = auth.uid()
  ));

create policy "Users manage own import_rules" on import_rules
  for all using (exists (
    select 1 from social_accounts a where a.id = import_rules.account_id and a.user_id = auth.uid()
  ));

-- social_to_cherry: readable by owner via join path; inserts by service role
create policy "Owner read mapping" on social_to_cherry
  for select using (exists (
    select 1 from social_posts p join social_accounts a on a.id = p.account_id
    where p.id = social_to_cherry.social_post_id and a.user_id = auth.uid()
  ))
;

