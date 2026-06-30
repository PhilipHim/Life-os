-- Run in Supabase SQL Editor (project: same as NEXT_PUBLIC_SUPABASE_URL)
-- After running: Table Editor → public → feedback should appear

create extension if not exists pgcrypto;

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  category text not null,
  message text not null,
  page text,
  status text not null default 'new' check (status in ('new', 'in_progress', 'resolved', 'closed')),
  name text,
  email text,
  browser text,
  os text,
  app_version text,
  created_at timestamptz not null default now()
);

create index if not exists feedback_created_at_idx on public.feedback (created_at desc);
create index if not exists feedback_status_idx on public.feedback (status);

alter table public.feedback enable row level security;

drop policy if exists "Anyone can submit feedback" on public.feedback;

create policy "Anyone can submit feedback"
  on public.feedback for insert
  to anon, authenticated
  with check (true);

grant usage on schema public to anon, authenticated;
grant insert on table public.feedback to anon, authenticated;

-- Admin reads via service role API route (bypasses RLS)
