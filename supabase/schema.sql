-- Run this whole file in Supabase: SQL Editor > New query > Run.
create extension if not exists pgcrypto;

create table if not exists public.battle_submissions (
  id uuid primary key default gen_random_uuid(),
  battle_id text not null,
  image_url text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.battle_polls (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.battle_poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.battle_polls(id) on delete cascade,
  submission_id uuid not null references public.battle_submissions(id) on delete cascade,
  unique (poll_id, submission_id)
);

create table if not exists public.battle_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.battle_polls(id) on delete cascade,
  option_id uuid not null references public.battle_poll_options(id) on delete cascade,
  voter_hash text not null,
  created_at timestamptz not null default now(),
  unique (poll_id, voter_hash)
);

-- The app uses the service-role key only on the server. Do not expose it in the browser.
alter table public.battle_submissions enable row level security;
alter table public.battle_polls enable row level security;
alter table public.battle_poll_options enable row level security;
alter table public.battle_votes enable row level security;

-- Create a public image bucket for screenshots.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('battle-images', 'battle-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880;
