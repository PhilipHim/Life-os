-- Run in Supabase SQL Editor after 001_profiles.sql

alter table public.profiles
  add column if not exists first_mission_completed_at timestamptz;
