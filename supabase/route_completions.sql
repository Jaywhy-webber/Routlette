
create table public.route_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  planning_area text not null,
  route_token text not null,
  completed_at timestamptz not null default now()
);


create unique index route_completions_dedupe_idx
  on public.route_completions (user_id, planning_area, route_token);

alter table public.route_completions enable row level security;

create policy "Users can insert their own completions"
  on public.route_completions for insert
  with check (auth.uid() = user_id);

create policy "Users can read their own completions"
  on public.route_completions for select
  using (auth.uid() = user_id);

