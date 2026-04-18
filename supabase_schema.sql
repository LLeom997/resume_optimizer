-- ═══════════════════════════════════════════════════════════════
--  Career OS — Complete Supabase Schema
--  Run in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════

-- 1. ANALYSIS HISTORY (from Analyzer page)
create table if not exists resume_keywords (
  id          uuid primary key default gen_random_uuid(),
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

-- 2. ANALYSIS REMARKS
create table if not exists job_remarks (
  id         uuid primary key default gen_random_uuid(),
  job_id     uuid not null references resume_keywords(id) on delete cascade,
  text       text not null,
  created_at timestamptz default now()
);
create index if not exists idx_job_remarks_job_id on job_remarks(job_id);

-- 3. TRACKED RESUMES (Tracker page — core table)
create table if not exists tracked_resumes (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  company          text default '',
  role             text default '',
  job_url          text,
  score            integer default 0,
  score_title      text default '',
  matched_keywords text[] default '{}',
  missing_keywords text[] default '{}',
  suggestions      text,       -- AI edit suggestions (plain text)
  resume_content   text,       -- full resume pasted by user (markdown)
  jd_snippet       text,
  status           text default 'draft'
                   check (status in ('draft','ready','applied','interview','offer','rejected')),
  fit_decision     text,       -- YES/NO/MAYBE from AI
  fit_confidence   integer,    -- 0-100
  positioning      text,       -- application positioning angle
  email_pitch      text,       -- generated email pitch
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);
create index if not exists idx_tracked_resumes_status  on tracked_resumes(status);
create index if not exists idx_tracked_resumes_created on tracked_resumes(created_at desc);
create index if not exists idx_tracked_resumes_score   on tracked_resumes(score desc);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger tracked_resumes_updated_at
  before update on tracked_resumes
  for each row execute function update_updated_at();

-- 4. RESUME NOTES (timeline per tracked resume)
create table if not exists resume_notes (
  id         uuid primary key default gen_random_uuid(),
  resume_id  uuid not null references tracked_resumes(id) on delete cascade,
  text       text not null,
  created_at timestamptz default now()
);
create index if not exists idx_resume_notes_resume_id on resume_notes(resume_id);

-- 5. RESUME FILES (storage bucket links for versioned PDFs/MDs)
create table if not exists resume_files (
  id           uuid primary key default gen_random_uuid(),
  resume_id    uuid references tracked_resumes(id) on delete cascade,
  version      text not null default 'v1',
  file_name    text not null,
  storage_path text not null,
  public_url   text,
  file_size    integer,
  notes        text,
  created_at   timestamptz default now()
);
create index if not exists idx_resume_files_resume_id on resume_files(resume_id);

-- 6. LEARNING LOOP SNAPSHOTS (store AI learning results)
create table if not exists learning_snapshots (
  id                         uuid primary key default gen_random_uuid(),
  patterns_success           text[],
  patterns_failure           text[],
  keyword_impact             jsonb,
  resume_version_performance jsonb,
  recommendations            text[],
  resumes_analysed           integer,
  created_at                 timestamptz default now()
);

-- ── ROW LEVEL SECURITY ──────────────────────────────────────────
alter table resume_keywords     enable row level security;
alter table job_remarks         enable row level security;
alter table tracked_resumes     enable row level security;
alter table resume_notes        enable row level security;
alter table resume_files        enable row level security;
alter table learning_snapshots  enable row level security;

-- Anon full access (personal use — tighten for multi-user with auth)
create policy "anon_all" on resume_keywords    for all to anon using (true) with check (true);
create policy "anon_all" on job_remarks        for all to anon using (true) with check (true);
create policy "anon_all" on tracked_resumes    for all to anon using (true) with check (true);
create policy "anon_all" on resume_notes       for all to anon using (true) with check (true);
create policy "anon_all" on resume_files       for all to anon using (true) with check (true);
create policy "anon_all" on learning_snapshots for all to anon using (true) with check (true);

-- ── STORAGE BUCKET ──────────────────────────────────────────────
-- Stores versioned resume files (.md, .txt, .pdf)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resume-versions',
  'resume-versions',
  false,
  5242880,  -- 5MB
  array['text/plain','text/markdown','application/pdf','application/octet-stream']
)
on conflict (id) do nothing;

-- Storage RLS
create policy "anon_upload"  on storage.objects for insert to anon with check (bucket_id = 'resume-versions');
create policy "anon_select"  on storage.objects for select to anon using (bucket_id = 'resume-versions');
create policy "anon_delete"  on storage.objects for delete to anon using (bucket_id = 'resume-versions');

-- ── UPGRADE NOTES (if running on existing DB) ───────────────────
-- alter table tracked_resumes add column if not exists fit_decision text;
-- alter table tracked_resumes add column if not exists fit_confidence integer;
-- alter table tracked_resumes add column if not exists positioning text;
-- alter table tracked_resumes add column if not exists email_pitch text;
-- alter table tracked_resumes add column if not exists updated_at timestamptz default now();
