-- Minimal Supabase schema required by the current app
-- Run in Supabase SQL Editor.

create extension if not exists pgcrypto;

-- Analyzer history
create table if not exists resume_keywords (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  company     text default '',
  role        text default '',
  score       integer,
  score_title text,
  job_url     text,
  jd_snippet  text,
  matched     text[] default '{}',
  missing     text[] default '{}',
  partial     text[] default '{}',
  created_at  timestamptz default now()
);

create table if not exists job_remarks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  job_id     uuid not null references resume_keywords(id) on delete cascade,
  text       text not null,
  created_at timestamptz default now()
);
create index if not exists idx_job_remarks_job_id on job_remarks(job_id);

-- Resume tracker
create table if not exists tracked_resumes (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name             text not null,
  company          text default '',
  role             text default '',
  job_url          text,
  resume_doc_url   text,
  score            integer default 0,
  score_title      text default '',
  matched_keywords text[] default '{}',
  missing_keywords text[] default '{}',
  suggestions      text,
  resume_content   text,
  jd_snippet       text,
  status           text default 'draft'
                   check (status in ('draft','ready','applied','interview','offer','rejected')),
  fit_decision     text,
  fit_confidence   integer,
  positioning      text,
  email_pitch      text,
  last_applied_at  timestamptz,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create index if not exists idx_tracked_resumes_status on tracked_resumes(status);
create index if not exists idx_tracked_resumes_created on tracked_resumes(created_at desc);
create index if not exists idx_tracked_resumes_score on tracked_resumes(score desc);

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tracked_resumes_updated_at on tracked_resumes;
create trigger tracked_resumes_updated_at
before update on tracked_resumes
for each row execute function update_updated_at();

create table if not exists resume_notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  resume_id  uuid not null references tracked_resumes(id) on delete cascade,
  text       text not null,
  created_at timestamptz default now()
);
create index if not exists idx_resume_notes_resume_id on resume_notes(resume_id);

-- RLS for authenticated users: each user can access only their own rows
-- Upgrade support for existing DBs (must run before policies that reference user_id)
alter table if exists resume_keywords add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table if exists job_remarks add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table if exists tracked_resumes add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table if exists resume_notes add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table if exists resume_keywords alter column user_id set default auth.uid();
alter table if exists job_remarks alter column user_id set default auth.uid();
alter table if exists tracked_resumes alter column user_id set default auth.uid();
alter table if exists resume_notes alter column user_id set default auth.uid();

alter table if exists tracked_resumes add column if not exists resume_doc_url text;
alter table if exists tracked_resumes add column if not exists last_applied_at timestamptz;
alter table if exists tracked_resumes add column if not exists updated_at timestamptz default now();
create index if not exists idx_tracked_resumes_last_applied on tracked_resumes(last_applied_at desc);
create index if not exists idx_job_remarks_user_id on job_remarks(user_id);
create index if not exists idx_tracked_resumes_user_id on tracked_resumes(user_id);
create index if not exists idx_resume_notes_user_id on resume_notes(user_id);

alter table resume_keywords disable row level security;
alter table job_remarks disable row level security;
alter table tracked_resumes disable row level security;
alter table resume_notes disable row level security;

drop policy if exists "anon_all_resume_keywords" on resume_keywords;
drop policy if exists "anon_all_job_remarks" on job_remarks;
drop policy if exists "anon_all_tracked_resumes" on tracked_resumes;
drop policy if exists "anon_all_resume_notes" on resume_notes;

drop policy if exists "user_own_resume_keywords" on resume_keywords;
drop policy if exists "user_own_tracked_resumes" on tracked_resumes;
drop policy if exists "user_own_job_remarks" on job_remarks;
drop policy if exists "user_own_resume_notes" on resume_notes;

-- If this is an existing database with legacy rows, assign user_id before enforcing NOT NULL:
-- update tracked_resumes set user_id = '<your-user-uuid>' where user_id is null;
-- update resume_notes set user_id = '<your-user-uuid>' where user_id is null;
-- update resume_keywords set user_id = '<your-user-uuid>' where user_id is null;
-- update job_remarks set user_id = '<your-user-uuid>' where user_id is null;
