-- Adds the "highlights" table (the big numbers under the hero) to an existing project.
-- Run once in Supabase → SQL Editor. Safe to run again. New projects get this from schema.sql.

create table if not exists public.highlights (
  id uuid primary key default gen_random_uuid(),
  value text not null,
  label text not null,
  note text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.highlights enable row level security;
drop policy if exists "Public can read" on public.highlights;
create policy "Public can read" on public.highlights for select to anon, authenticated using (true);
drop policy if exists "Admins can insert" on public.highlights;
create policy "Admins can insert" on public.highlights for insert to authenticated with check ((select public.is_admin()));
drop policy if exists "Admins can update" on public.highlights;
create policy "Admins can update" on public.highlights for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "Admins can delete" on public.highlights;
create policy "Admins can delete" on public.highlights for delete to authenticated using ((select public.is_admin()));
grant select on public.highlights to anon, authenticated;
grant insert, update, delete on public.highlights to authenticated;
drop trigger if exists touch_updated_at on public.highlights;
create trigger touch_updated_at before update on public.highlights for each row execute function public.touch_updated_at();
