-- Adds dungeon ranks (E to S) and the reason for the rank to projects.
-- Run once in Supabase → SQL Editor. Safe to run again. New projects get this from schema.sql.

alter table public.projects add column if not exists rank text;
alter table public.projects add column if not exists rank_reason text;

alter table public.projects drop constraint if exists projects_rank_check;
alter table public.projects add constraint projects_rank_check check (rank is null or rank in ('E', 'D', 'C', 'B', 'A', 'S'));
