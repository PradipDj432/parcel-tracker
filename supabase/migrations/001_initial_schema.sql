-- ============================================
-- Phase 2: Database Schema
-- Tables, Indexes, RLS Policies, Triggers, Realtime
-- ============================================

-- 1. PROFILES TABLE
-- Linked to auth.users, stores role info
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'user' check (role in ('guest', 'user', 'admin')),
  created_at timestamptz not null default now()
);

-- 2. TRACKINGS TABLE
-- Core table for parcel tracking data
create table if not exists public.trackings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  tracking_number text not null,
  courier_code text not null,
  status text not null default 'pending',
  label text,
  last_event text,
  origin text,
  destination text,
  checkpoints jsonb default '[]'::jsonb,
  is_public boolean not null default false,
  public_slug text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. CONTACT_SUBMISSIONS TABLE
create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  ip_address inet,
  created_at timestamptz not null default now()
);

-- ============================================
-- INDEXES
-- ============================================
create index if not exists idx_trackings_user_id on public.trackings(user_id);
create index if not exists idx_trackings_tracking_number on public.trackings(tracking_number);
create index if not exists idx_trackings_public_slug on public.trackings(public_slug);
create index if not exists idx_trackings_status on public.trackings(status);
create index if not exists idx_contact_submissions_ip on public.contact_submissions(ip_address);

-- ============================================
-- ROW-LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.trackings enable row level security;
alter table public.contact_submissions enable row level security;

-- PROFILES policies
-- Users can read their own profile
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Admins can read all profiles
create policy "Admins can read all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- TRACKINGS policies
-- Users can read their own trackings
create policy "Users can read own trackings"
  on public.trackings for select
  using (auth.uid() = user_id);

-- Users can insert their own trackings
create policy "Users can insert own trackings"
  on public.trackings for insert
  with check (auth.uid() = user_id);

-- Users can update their own trackings
create policy "Users can update own trackings"
  on public.trackings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can delete their own trackings
create policy "Users can delete own trackings"
  on public.trackings for delete
  using (auth.uid() = user_id);

-- Anyone can read public trackings (shareable pages)
create policy "Anyone can read public trackings"
  on public.trackings for select
  using (is_public = true);

-- Admins can read all trackings
create policy "Admins can read all trackings"
  on public.trackings for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- CONTACT_SUBMISSIONS policies
-- Anyone can insert (submit contact form)
create policy "Anyone can submit contact form"
  on public.contact_submissions for insert
  with check (true);

-- Admins can read all submissions
create policy "Admins can read all contact submissions"
  on public.contact_submissions for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================
-- TRIGGER: Auto-create profile on signup
-- ============================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user');
  return new;
end;
$$;

-- Drop trigger if exists, then create
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- TRIGGER: Auto-update updated_at on trackings
-- ============================================
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_trackings_updated on public.trackings;
create trigger on_trackings_updated
  before update on public.trackings
  for each row execute function public.handle_updated_at();

-- ============================================
-- ENABLE REALTIME on trackings table
-- ============================================
alter publication supabase_realtime add table public.trackings;
