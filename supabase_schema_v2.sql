-- ═══════════════════════════════════════════════════════════════
--  Resume × JD Analyzer — NEW TABLES (run after existing schema)
-- ═══════════════════════════════════════════════════════════════

-- 5. TRACKED RESUMES (resume tracker page)
create table if not exists tracked_resumes (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,                    -- e.g. "Resume v3 — Mech Design"
  company          text default '',
  role             text default '',
  job_url          text,
  score            integer default 0,
  score_title      text default '',
  matched_keywords text[]  default '{}',
  missing_keywords text[]  default '{}',
  suggestions      text,                             -- AI edit suggestions (plain text)
  resume_content   text,                             -- full resume pasted by user
  jd_snippet       text,
  status           text default 'draft'
                   check (status in ('draft','ready','applied','interview','offer','rejected')),
  created_at       timestamptz default now()
);

-- 6. RESUME NOTES (timeline notes per tracked resume)
create table if not exists resume_notes (
  id         uuid primary key default gen_random_uuid(),
  resume_id  uuid not null references tracked_resumes(id) on delete cascade,
  text       text not null,
  created_at timestamptz default now()
);

create index if not exists idx_resume_notes_resume_id on resume_notes(resume_id);

-- RLS
alter table tracked_resumes enable row level security;
alter table resume_notes     enable row level security;

create policy "anon_all_tracked_resumes" on tracked_resumes for all to anon using (true) with check (true);
create policy "anon_all_resume_notes"    on resume_notes    for all to anon using (true) with check (true);
