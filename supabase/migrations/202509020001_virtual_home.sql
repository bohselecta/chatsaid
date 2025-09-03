-- Virtual Home scene storage
create table if not exists public.virtual_home (
  user_id uuid primary key references auth.users(id) on delete cascade,
  background_url text not null,
  desk_url text not null,
  items jsonb not null default '[]'::jsonb,
  updated_at timestamptz default now()
);

-- Helpful index for partial updates by user
create index if not exists idx_virtual_home_user on public.virtual_home(user_id);

