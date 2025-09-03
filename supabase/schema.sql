-- ChatSaid v2 Schema - Privacy System & Friend Management

-- Enable UUIDs
create extension if not exists "uuid-ossp";

-- Profiles (enhanced with privacy settings)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  bio text,
  avatar_url text,
  is_public boolean default true, -- whether profile is visible to non-friends
  is_bot boolean default false, -- whether this is an AI bot profile
  bot_type text check (bot_type in ('cherry_ent', 'crystal_maize') or bot_type is null), -- type of bot if applicable
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Friend relationships
create table if not exists friendships (
  id uuid primary key default uuid_generate_v4(),
  requester_id uuid not null references profiles(id) on delete cascade,
  addressee_id uuid not null references profiles(id) on delete cascade,
  status text not null check (status in ('pending', 'accepted', 'declined')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

-- Privacy levels enum
create type privacy_level as enum ('private', 'friends', 'public');

-- Cherries (renamed from posts, enhanced with privacy and metadata)
create table if not exists cherries (
  id uuid primary key default uuid_generate_v4(),
  author_id uuid not null references profiles(id) on delete cascade,
  title text,
  content text not null check (char_length(content) <= 2000),
  privacy_level privacy_level not null default 'private',
  tags text[], -- array of tags for search
  source_file text, -- where this AI snippet came from
  line_number integer, -- specific line reference
  image_url text, -- optional image attachment
  review_status text default 'pending' check (review_status in ('pending', 'reviewed', 'archived')),
  review_notes text,
  reviewed_by uuid references profiles(id),
  reviewed_at timestamp with time zone,
  is_featured boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Branches (primary community categories)
create table if not exists branches (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  description text,
  color text, -- hex color for UI
  icon text, -- icon identifier
  is_primary boolean default false, -- whether this is a main branch
  created_at timestamp with time zone default now()
);

-- Twigs (sub-communities within branches)
create table if not exists twigs (
  id uuid primary key default uuid_generate_v4(),
  branch_id uuid not null references branches(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  created_at timestamp with time zone default now(),
  unique(branch_id, slug)
);

-- Link cherries to branches and twigs
create table if not exists cherry_branches (
  id uuid primary key default uuid_generate_v4(),
  cherry_id uuid not null references cherries(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete cascade,
  twig_id uuid references twigs(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(cherry_id, branch_id, twig_id)
);

-- Cherry likes
create table if not exists cherry_likes (
  user_id uuid references profiles(id) on delete cascade,
  cherry_id uuid references cherries(id) on delete cascade,
  created_at timestamp with time zone default now(),
  primary key (user_id, cherry_id)
);

-- Comments (updated to reference cherries)
create table if not exists comments (
  id uuid primary key default uuid_generate_v4(),
  cherry_id uuid references cherries(id) on delete cascade, -- renamed from post_id
  author_id uuid references profiles(id) on delete cascade,
  parent_id uuid references comments(id) on delete cascade,
  body text not null check (char_length(body) <= 1000),
  created_at timestamp with time zone default now()
);

-- Bookmarks (updated to reference cherries)
create table if not exists bookmarks (
  user_id uuid references profiles(id),
  cherry_id uuid references cherries(id), -- renamed from post_id
  created_at timestamp with time zone default now(),
  primary key (user_id, cherry_id)
);

-- Notifications (enhanced)
create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id),
  type text not null check (type in ('friend_request', 'friend_accepted', 'comment', 'like')),
  title text,
  message text,
  payload jsonb, -- additional data
  read boolean default false,
  created_at timestamp with time zone default now()
);

-- Reports (enhanced)
create table if not exists reports (
  id uuid primary key default uuid_generate_v4(),
  reporter_id uuid references profiles(id),
  target_type text not null check (target_type in ('cherry', 'comment', 'profile')),
  target_id uuid not null,
  reason text,
  created_at timestamp with time zone default now(),
  handled boolean default false
);

-- Indexes for performance
create index if not exists idx_cherries_author_created on cherries(author_id, created_at desc);
create index if not exists idx_cherries_privacy_created on cherries(privacy_level, created_at desc);
create index if not exists idx_cherries_tags on cherries using gin(tags);
create index if not exists idx_cherries_branch on cherry_branches(branch_id);
create index if not exists idx_friendships_status on friendships(status);
create index if not exists idx_friendships_users on friendships(requester_id, addressee_id);
create index if not exists idx_notifications_user_read on notifications(user_id, read);
create index if not exists idx_comments_cherry_created on comments(cherry_id, created_at desc);

-- Views for easier querying
create or replace view cherries_view as
select
  c.id,
  c.title,
  c.content,
  c.privacy_level,
  c.tags,
  c.source_file,
  c.line_number,
  c.image_url,
  c.review_status,
  c.is_featured,
  c.created_at,
  c.updated_at,
  c.author_id,
  p.display_name as author_display_name,
  p.avatar_url as author_avatar,
  coalesce(cl.like_count, 0) as like_count,
  coalesce(cc.comment_count, 0) as comment_count
from cherries c
left join profiles p on c.author_id = p.id
left join (
  select cherry_id, count(*) as like_count
  from cherry_likes
  group by cherry_id
) cl on c.id = cl.cherry_id
left join (
  select cherry_id, count(*) as comment_count
  from comments
  group by cherry_id
) cc on c.id = cc.cherry_id;

-- Public cherries view (for non-authenticated users)
create or replace view public_cherries_view as
select * from cherries_view where privacy_level = 'public';

-- Friend cherries view (for authenticated users to see friends' content)
create or replace view friend_cherries_view as
select cv.* from cherries_view cv
where cv.privacy_level in ('friends', 'public');

-- RLS Policies
alter table profiles enable row level security;
alter table cherries enable row level security;
alter table cherry_likes enable row level security;
alter table comments enable row level security;
alter table friendships enable row level security;
alter table notifications enable row level security;
alter table branches enable row level security;
alter table twigs enable row level security;

-- Profiles policies
create policy "Users can read public profiles" on profiles
  for select using (is_public = true);

create policy "Users can read friend profiles" on profiles
  for select using (
    exists (
      select 1 from friendships f
      where f.status = 'accepted'
      and (
        (f.requester_id = auth.uid() and f.addressee_id = id) or
        (f.addressee_id = auth.uid() and f.requester_id = id)
      )
    )
  );

create policy "Users can insert their own profile" on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update their own profile" on profiles
  for update using (auth.uid() = id);

-- Cherries policies
create policy "Users can read public cherries" on cherries
  for select using (privacy_level = 'public');

create policy "Users can read their own cherries" on cherries
  for select using (auth.uid() = author_id);

create policy "Users can read friends' cherries" on cherries
  for select using (
    privacy_level in ('friends', 'public') and
    exists (
      select 1 from friendships f
      where f.status = 'accepted'
      and (
        (f.requester_id = auth.uid() and f.addressee_id = author_id) or
        (f.addressee_id = auth.uid() and f.requester_id = author_id)
      )
    )
  );

create policy "Users can insert their own cherries" on cherries
  for insert with check (auth.uid() = author_id);

create policy "Users can update their own cherries" on cherries
  for update using (auth.uid() = author_id);

create policy "Users can delete their own cherries" on cherries
  for delete using (auth.uid() = author_id);

-- Cherry likes policies
create policy "Users can read likes on visible cherries" on cherry_likes
  for select using (
    exists (
      select 1 from cherries c
      where c.id = cherry_id
      and (
        c.privacy_level = 'public' or
        c.author_id = auth.uid() or
        exists (
          select 1 from friendships f
          where f.status = 'accepted'
          and (
            (f.requester_id = auth.uid() and f.addressee_id = c.author_id) or
            (f.addressee_id = auth.uid() and f.requester_id = c.author_id)
          )
        )
      )
    )
  );

create policy "Users can insert their own likes" on cherry_likes
  for insert with check (auth.uid() = user_id);

create policy "Users can delete their own likes" on cherry_likes
  for delete using (auth.uid() = user_id);

-- Comments policies
create policy "Users can read comments on visible cherries" on comments
  for select using (
    exists (
      select 1 from cherries c
      where c.id = cherry_id
      and (
        c.privacy_level = 'public' or
        c.author_id = auth.uid() or
        exists (
          select 1 from friendships f
          where f.status = 'accepted'
          and (
            (f.requester_id = auth.uid() and f.addressee_id = c.author_id) or
            (f.addressee_id = auth.uid() and f.requester_id = c.author_id)
          )
        )
      )
    )
  );

create policy "Users can insert their own comments" on comments
  for insert with check (auth.uid() = author_id);

create policy "Users can update their own comments" on comments
  for update using (auth.uid() = author_id);

create policy "Users can delete their own comments" on comments
  for delete using (auth.uid() = author_id);

-- Friendships policies
create policy "Users can read their own friendships" on friendships
  for select using (
    auth.uid() = requester_id or auth.uid() = addressee_id
  );

create policy "Users can insert friend requests" on friendships
  for insert with check (auth.uid() = requester_id);

create policy "Users can update their own friendships" on friendships
  for update using (
    auth.uid() = requester_id or auth.uid() = addressee_id
  );

create policy "Users can delete their own friendships" on friendships
  for delete using (
    auth.uid() = requester_id or auth.uid() = addressee_id
  );

-- Notifications policies
create policy "Users can read their own notifications" on notifications
  for select using (auth.uid() = user_id);

create policy "Users can insert notifications" on notifications
  for insert with check (true);

create policy "Users can update their own notifications" on notifications
  for update using (auth.uid() = user_id);

-- Branches and twigs policies (public read access)
create policy "Anyone can read branches" on branches
  for select using (true);

create policy "Anyone can read twigs" on twigs
  for select using (true);

-- Functions and triggers
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Insert default branches
insert into branches (name, slug, description, color, icon, is_primary) values
  ('Funny Branch', 'funny', 'Humor and entertainment from AI conversations', '#fbbf24', 'funny', true),
  ('Mystical Branch', 'mystical', 'Spiritual, philosophical, and mystical insights', '#a855f7', 'mystical', true),
  ('Technical Branch', 'technical', 'Technical discussions, code, and engineering', '#3b82f6', 'technical', true),
  ('Research Branch', 'research', 'Academic research, analysis, and discoveries', '#10b981', 'research', true),
  ('Ideas Branch', 'ideas', 'Sparks, brainstorms, unfinished but promising', '#f59e0b', 'ideas', true)
on conflict (slug) do nothing;

-- Insert example twigs
insert into twigs (branch_id, name, slug, description) 
select b.id, 'General', 'general', 'General discussions in this branch'
from branches b
on conflict (branch_id, slug) do nothing;
