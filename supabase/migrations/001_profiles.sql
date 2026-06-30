-- Run this in Supabase SQL Editor (Dashboard → SQL → New query)

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Explorer',
  active_title_id text not null default 'beginner',
  onboarding_completed_at timestamptz,
  focus_areas text[] not null default '{}',
  vision text,
  wake_up_time text,
  bedtime text,
  deep_work_time text,
  workout_time text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid () = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid () = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid () = id);

-- Optional: auto-create profile on signup
create or replace function public.handle_new_user ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user ();
