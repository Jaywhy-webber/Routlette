-- Run this manually in the Supabase SQL editor (Project -> SQL Editor).
-- This repo has no migration files or Supabase CLI config (see README.md's
-- Database section) — schema changes are applied directly against the
-- hosted project, same convention as the existing `saved_routes` table.
--
-- Tracks every completed adventure by an authenticated user, per planning
-- area touched, independent of whether the route is ever saved via the
-- existing "save route" form. A neighbourhood's "discovered" state and
-- route-count are derived reads (COUNT(*) GROUP BY planning_area), not
-- stored directly.

create table public.route_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  planning_area text not null,
  route_token text not null,
  completed_at timestamptz not null default now()
);

-- Idempotency key: route_token = "{journeyStartTime}-{journeyEndTime}"
-- (both already exist on CompletionScreen / saved_routes' journey_start_time
-- and journey_end_time). Prevents double-counting the same completed
-- adventure touching the same area twice — e.g. a double-fired client
-- effect, or re-running the historical backfill script.
create unique index route_completions_dedupe_idx
  on public.route_completions (user_id, planning_area, route_token);

alter table public.route_completions enable row level security;

create policy "Users can insert their own completions"
  on public.route_completions for insert
  with check (auth.uid() = user_id);

create policy "Users can read their own completions"
  on public.route_completions for select
  using (auth.uid() = user_id);

-- No update/delete policy: nothing in the app ever mutates a completion row.
-- Manual cleanup, if ever needed, goes through the Supabase dashboard's
-- service-role access, which bypasses RLS entirely.
