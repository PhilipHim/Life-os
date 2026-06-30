-- Run in Supabase SQL Editor after 001_profiles.sql

create or replace function public.delete_own_account ()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.profiles where id = auth.uid ();
  delete from auth.users where id = auth.uid ();
end;
$$;

revoke all on function public.delete_own_account () from public;
grant execute on function public.delete_own_account () to authenticated;
