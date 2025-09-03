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

-- Branch system (main categories)
create table if not exists branches (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  description text,
  color text, -- hex color for UI
  icon text, -- icon identifier
  is_primary boolean default false,
  created_at timestamp with time zone default now()
);

-- Twigs (sub-categories within branches)
create table if not exists twigs (
  id uuid primary key default uuid_generate_v4(),
  branch_id uuid not null references branches(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  created_at timestamp with time zone default now(),
  unique(branch_id, slug)
);

-- Cherry-branch relationships
create table if not exists cherry_branches (
  cherry_id uuid not null references cherries(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete cascade,
  twig_id uuid references twigs(id) on delete cascade,
  primary key (cherry_id, branch_id)
);

-- Likes (renamed from likes, now for cherries)
create table if not exists cherry_likes (
  user_id uuid references profiles(id) on delete cascade,
  cherry_id uuid references cherries(id) on delete cascade,
  created_at timestamp with time zone default now(),
  primary key (user_id, cherry_id)
);

-- Comments (threaded, for cherries)
create table if not exists comments (
  id uuid primary key default uuid_generate_v4(),
  cherry_id uuid references cherries(id) on delete cascade,
  author_id uuid references profiles(id) on delete cascade,
  parent_id uuid references comments(id) on delete cascade,
  content text not null check (char_length(content) <= 1000),
  created_at timestamp with time zone default now()
);

-- Bookmarks (user saved cherries)
create table if not exists bookmarks (
  user_id uuid references profiles(id),
  cherry_id uuid references cherries(id),
  created_at timestamp with time zone default now(),
  primary key (user_id, cherry_id)
);

-- Notifications (enhanced for friend requests, etc.)
create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id),
  type text not null, -- 'friend_request', 'friend_accepted', 'comment', 'like'
  title text not null,
  message text,
  payload jsonb, -- additional data
  read boolean default false,
  created_at timestamp with time zone default now()
);

-- Reports
create table if not exists reports (
  id uuid primary key default uuid_generate_v4(),
  reporter_id uuid references profiles(id),
  target_type text not null, -- 'cherry', 'comment', 'profile'
  target_id uuid not null,
  reason text,
  created_at timestamp with time zone default now(),
  handled boolean default false
);

-- Indexes for performance
create index if not exists idx_cherries_author_created on cherries(author_id, created_at desc);
create index if not exists idx_cherries_privacy_created on cherries(privacy_level, created_at desc);
create index if not exists idx_cherries_tags on cherries using gin(tags);
create index if not exists idx_cherries_branch on cherries(id) where privacy_level = 'public';
create index if not exists idx_friendships_status on friendships(status);
create index if not exists idx_friendships_users on friendships(requester_id, addressee_id);
create index if not exists idx_notifications_user_read on notifications(user_id, read, created_at desc);
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
  p.is_public as author_is_public,
  (select count(*) from cherry_likes cl where cl.cherry_id = c.id) as like_count,
  (select count(*) from comments cm where cm.cherry_id = c.id) as comment_count
from cherries c
left join profiles p on p.id = c.author_id;

-- Public cherries view (for canopy)
create or replace view public_cherries_view as
select * from cherries_view where privacy_level = 'public';

-- Friend cherries view (for pod)
create or replace view friend_cherries_view as
select distinct cv.*
from cherries_view cv
inner join friendships f on (
  (f.requester_id = auth.uid() and f.addressee_id = cv.author_id) or
  (f.addressee_id = auth.uid() and f.requester_id = cv.author_id)
)
where f.status = 'accepted' and cv.privacy_level in ('friends', 'public');

-- Enable RLS
alter table profiles enable row level security;
alter table cherries enable row level security;
alter table friendships enable row level security;
alter table cherry_likes enable row level security;
alter table comments enable row level security;
alter table bookmarks enable row level security;
alter table notifications enable row level security;
alter table reports enable row level security;
alter table branches enable row level security;
alter table twigs enable row level security;
alter table cherry_branches enable row level security;

-- RLS Policies

-- Profiles policies
create policy "Read public profiles" on profiles
  for select using (is_public = true or auth.uid() = id);
create policy "Read friend profiles" on profiles
  for select using (
    exists (
      select 1 from friendships f 
      where f.status = 'accepted' 
      and ((f.requester_id = auth.uid() and f.addressee_id = profiles.id) 
           or (f.addressee_id = auth.uid() and f.requester_id = profiles.id))
    )
  );
create policy "User can insert self profile" on profiles
  for insert with check (auth.uid() = id);
create policy "User can update own profile" on profiles
  for update using (auth.uid() = id);

-- Cherries policies
create policy "Read own cherries" on cherries
  for select using (auth.uid() = author_id);
create policy "Read public cherries" on cherries
  for select using (privacy_level = 'public');
create policy "Read friend cherries" on cherries
  for select using (
    privacy_level = 'friends' and
    exists (
      select 1 from friendships f 
      where f.status = 'accepted' 
      and ((f.requester_id = auth.uid() and f.addressee_id = author_id) 
           or (f.addressee_id = auth.uid() and f.requester_id = author_id))
    )
  );
create policy "Insert own cherries" on cherries
  for insert with check (auth.uid() = author_id);
create policy "Update own cherries" on cherries
  for update using (auth.uid() = author_id);
create policy "Delete own cherries" on cherries
  for delete using (auth.uid() = author_id);

-- Friendships policies
create policy "Read own friendships" on friendships
  for select using (auth.uid() = requester_id or auth.uid() = addressee_id);
create policy "Insert friend requests" on friendships
  for insert with check (auth.uid() = requester_id);
create policy "Update own friend requests" on friendships
  for update using (auth.uid() = addressee_id);
create policy "Delete own friendships" on friendships
  for delete using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Cherry likes policies
create policy "Read all cherry likes" on cherry_likes
  for select using (true);
create policy "Insert own likes" on cherry_likes
  for insert with check (auth.uid() = user_id);
create policy "Delete own likes" on cherry_likes
  for delete using (auth.uid() = user_id);

-- Comments policies
create policy "Read comments on visible cherries" on comments
  for select using (
    exists (
      select 1 from cherries c 
      where c.id = comments.cherry_id 
      and (c.privacy_level = 'public' 
           or c.author_id = auth.uid()
           or (c.privacy_level = 'friends' and
               exists (
                 select 1 from friendships f 
                 where f.status = 'accepted' 
                 and ((f.requester_id = auth.uid() and f.addressee_id = c.author_id) 
                      or (f.addressee_id = auth.uid() and f.requester_id = c.author_id))
               )))
    )
  );
create policy "Insert own comments" on comments
  for insert with check (auth.uid() = author_id);
create policy "Update own comments" on comments
  for update using (auth.uid() = author_id);
create policy "Delete own comments" on comments
  for delete using (auth.uid() = author_id);

-- Notifications policies
create policy "Read own notifications" on notifications
  for select using (auth.uid() = user_id);
create policy "Update own notifications" on notifications
  for update using (auth.uid() = user_id);

-- Branches and twigs policies (public read, admin write)
create policy "Read all branches" on branches
  for select using (true);
create policy "Read all twigs" on twigs
  for select using (true);

-- Profile upsert function (trigger on signup)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Insert default branches
INSERT INTO branches (name, slug, description, color, icon, is_primary) VALUES
  ('Funny', 'funny', 'Humor and entertainment', '#eab308', 'funny.png', true),
  ('Mystical', 'mystical', 'Spiritual and philosophical', '#a855f7', 'mystical.png', true),
  ('Technical', 'technical', 'Technology and programming', '#3b82f6', 'technical.png', true),
  ('Research', 'research', 'Academic and scientific', '#10b981', 'research.png', true)
ON CONFLICT (slug) DO NOTHING;

-- Insert some example twigs
INSERT INTO twigs (branch_id, name, slug, description) VALUES
  ((SELECT id FROM branches WHERE slug = 'technical'), 'JavaScript', 'javascript', 'JavaScript programming'),
  ((SELECT id FROM branches WHERE slug = 'technical'), 'Python', 'python', 'Python programming'),
  ((SELECT id FROM branches WHERE slug = 'funny'), 'Memes', 'memes', 'Internet memes and humor'),
  ((SELECT id FROM branches WHERE slug = 'research'), 'AI Ethics', 'ai-ethics', 'Artificial intelligence ethics')
ON CONFLICT DO NOTHING;
