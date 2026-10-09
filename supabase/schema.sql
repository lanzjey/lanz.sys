-- ============================================================================
-- LANZ.SYS portfolio — database schema
-- Run this once in Supabase → SQL Editor. It is safe to run again: every
-- statement is idempotent (create if not exists / create or replace).
--
-- Security model
--   • Everyone (anon) can READ portfolio content.
--   • Only users listed in public.admins can WRITE content or upload files.
--   • Contact messages are written only by the `contact` Edge Function
--     (service role) and are readable only by admins.
-- ============================================================================

-- ── Admins ──────────────────────────────────────────────────────────────────
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

drop policy if exists "Admins can see their own row" on public.admins;
create policy "Admins can see their own row" on public.admins
  for select to authenticated using (user_id = (select auth.uid()));

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;
grant execute on function public.is_admin() to anon, authenticated;

-- Public sign-up is disabled, so the account(s) you created in
-- Authentication → Users before running this script become the admins.
insert into public.admins (user_id)
select id from auth.users
on conflict do nothing;

-- ── Shared helpers ──────────────────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── Single-record tables ────────────────────────────────────────────────────
create table if not exists public.profile (
  id smallint primary key default 1 check (id = 1),
  name text not null default '',
  roles text[] not null default '{}',
  role text,
  tagline text,
  intro text,
  about text,
  image text,
  image_alt text,
  player_class text,
  specialization text,
  availability text,
  location text,
  email text,
  career_goal text,
  updated_at timestamptz not null default now()
);

create table if not exists public.resume (
  id smallint primary key default 1 check (id = 1),
  title text,
  description text,
  file text,
  url text,
  status text,
  updated_at timestamptz not null default now()
);

-- ── List tables ─────────────────────────────────────────────────────────────
create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  level text check (level in ('Beginner', 'Intermediate', 'Advanced', 'Expert')),
  description text,
  experience text,
  related text[] not null default '{}',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  description text,
  capabilities text[] not null default '{}',
  deliverables text[] not null default '{}',
  tools text[] not null default '{}',
  availability text check (availability in ('Available', 'Limited Availability', 'Not Currently Available', 'Coming Soon')),
  starting_price text,
  turnaround text,
  image text,
  related_projects text[] not null default '{}',
  cta text,
  featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  usage text,
  proficiency text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  status text check (status in ('Planned', 'Ongoing', 'In Progress', 'Completed', 'On Hold', 'Archived')),
  year text,
  description text,
  objective text,
  challenge text,
  solution text,
  role text,
  features text[] not null default '{}',
  results text[] not null default '{}',
  tech text[] not null default '{}',
  cover_image text,
  video text,
  gallery jsonb not null default '[]'::jsonb,
  github_url text,
  rank text check (rank in ('E', 'D', 'C', 'B', 'A', 'S')),
  rank_reason text,
  live_url text,
  featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.experience (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  organization text,
  period text,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.education (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  organization text,
  period text,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  issuer text,
  issued_on date,
  expires_on date,
  credential_id text,
  credential_url text,
  description text,
  image text,
  file text,
  related_skills text[] not null default '{}',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null default 'other' check (platform in ('facebook', 'messenger', 'instagram', 'linkedin', 'github', 'email', 'x', 'youtube', 'tiktok', 'website', 'other')),
  label text not null,
  url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  message text not null,
  project text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.highlights (
  id uuid primary key default gen_random_uuid(),
  value text not null,
  label text not null,
  note text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Contact inbox ───────────────────────────────────────────────────────────
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) between 3 and 254),
  message text not null check (char_length(message) between 1 and 5000),
  ip_hash text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists messages_created_at_idx on public.messages (created_at desc);
create index if not exists messages_ip_hash_idx on public.messages (ip_hash, created_at desc);

-- ── Policies, grants and triggers for every content table ───────────────────
do $$
declare
  t text;
begin
  foreach t in array array['profile', 'resume', 'skills', 'services', 'tools', 'projects', 'experience', 'education', 'certificates', 'social_links', 'testimonials', 'highlights']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "Public can read" on public.%I', t);
    execute format('create policy "Public can read" on public.%I for select to anon, authenticated using (true)', t);
    execute format('drop policy if exists "Admins can insert" on public.%I', t);
    execute format('create policy "Admins can insert" on public.%I for insert to authenticated with check ((select public.is_admin()))', t);
    execute format('drop policy if exists "Admins can update" on public.%I', t);
    execute format('create policy "Admins can update" on public.%I for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))', t);
    execute format('drop policy if exists "Admins can delete" on public.%I', t);
    execute format('create policy "Admins can delete" on public.%I for delete to authenticated using ((select public.is_admin()))', t);
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant insert, update, delete on public.%I to authenticated', t);
    execute format('drop trigger if exists touch_updated_at on public.%I', t);
    execute format('create trigger touch_updated_at before update on public.%I for each row execute function public.touch_updated_at()', t);
  end loop;
end
$$;

alter table public.messages enable row level security;
drop policy if exists "Admins can read messages" on public.messages;
create policy "Admins can read messages" on public.messages
  for select to authenticated using ((select public.is_admin()));
drop policy if exists "Admins can update messages" on public.messages;
create policy "Admins can update messages" on public.messages
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "Admins can delete messages" on public.messages;
create policy "Admins can delete messages" on public.messages
  for delete to authenticated using ((select public.is_admin()));
revoke all on public.messages from anon;
grant select, update, delete on public.messages to authenticated;

-- ── File storage (images, videos, PDFs) ─────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 52428800, array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'video/mp4', 'video/webm', 'application/pdf'])
on conflict (id) do update
set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins can upload media" on storage.objects;
create policy "Admins can upload media" on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and (select public.is_admin()));
drop policy if exists "Admins can update media" on storage.objects;
create policy "Admins can update media" on storage.objects
  for update to authenticated using (bucket_id = 'media' and (select public.is_admin()));
drop policy if exists "Admins can delete media" on storage.objects;
create policy "Admins can delete media" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and (select public.is_admin()));
drop policy if exists "Admins can list media" on storage.objects;
create policy "Admins can list media" on storage.objects
  for select to authenticated using (bucket_id = 'media' and (select public.is_admin()));
