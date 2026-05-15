-- AI Enthusiasts – Qazi Family
-- Run this in Supabase SQL Editor (Database → SQL) after creating a project.

-- Extensions
create extension if not exists "pgcrypto";

-- Cousins (participants)
create table if not exists public.cousins (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  display_name text not null,
  intro text not null,
  profile_image_url text,
  cloudinary_public_id text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Challenges (daily / weekly prompts)
create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  prompt text not null,
  challenge_date date not null,
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard', 'legendary')),
  ends_at timestamptz,
  is_active boolean not null default true,
  reference_image_url text,
  reference_cloudinary_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Migration: add reference image columns if table already exists
alter table public.challenges add column if not exists reference_image_url text;
alter table public.challenges add column if not exists reference_cloudinary_id text;

create index if not exists challenges_date_idx on public.challenges (challenge_date desc);
create index if not exists challenges_active_idx on public.challenges (is_active);

-- Submissions + AI scores (Gemini) on one row for simpler reads
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  cousin_id uuid not null references public.cousins (id) on delete cascade,
  challenge_id uuid references public.challenges (id) on delete set null,
  image_url text not null,
  cloudinary_public_id text,
  submitted_at timestamptz not null default now(),
  creativity numeric(4,2),
  adherence numeric(4,2),
  realism numeric(4,2),
  overall_ai numeric(4,2),
  final_score numeric(4,2) not null default 0,
  feedback text,
  improvement_tips text,
  roast text,
  gemini_raw jsonb,
  judged_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists submissions_cousin_idx on public.submissions (cousin_id, submitted_at desc);
create index if not exists submissions_challenge_idx on public.submissions (challenge_id);

-- Hall of Fame manual highlights (optional curator picks)
create table if not exists public.hall_of_fame (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions (id) on delete cascade,
  note text,
  created_at timestamptz not null default now()
);

-- Prevent duplicate Hall of Fame picks for the same submission
create unique index if not exists hall_of_fame_submission_unique on public.hall_of_fame (submission_id);

-- Row Level Security: public read, writes only via service role (API routes)
alter table public.cousins enable row level security;
alter table public.challenges enable row level security;
alter table public.submissions enable row level security;
alter table public.hall_of_fame enable row level security;

drop policy if exists "cousins_select_public" on public.cousins;
create policy "cousins_select_public" on public.cousins for select using (true);

drop policy if exists "challenges_select_public" on public.challenges;
create policy "challenges_select_public" on public.challenges for select using (true);

drop policy if exists "submissions_select_public" on public.submissions;
create policy "submissions_select_public" on public.submissions for select using (true);

drop policy if exists "hall_select_public" on public.hall_of_fame;
create policy "hall_select_public" on public.hall_of_fame for select using (true);

-- Seed cousins (exact copy from product brief)
insert into public.cousins (slug, display_name, intro, sort_order)
values
  ('bilal-sajid', 'Bilal Sajid', 'The man who is elder of them all yet smaller than Qadoos.', 1),
  ('talha-qazi', 'Talha Qazi', 'The man who will sell nuclear codes to the enemy just for the sake of Chicken Karahi.', 2),
  ('abdul-rehman', 'Abdul Rehman', 'He will vote Maryam Nawaz even if she joins PTI from PMLN. He accepts her as supreme leader.', 3),
  ('sufyan-qazi', 'Sufyan', 'Rumor has it his prompts are so detailed, Gemini asks *him* for clarification.', 4),
  ('abdullah', 'Abdullah', 'His English typo skills have made him quite famous among friends. His father owns a school, let''s see where he is going to take it.', 5),
  ('abdul-qadoos', 'Abdul Qadoos', 'Bigger than his whole bloodline, he stands as a mountain.', 6),
  ('abdul-basit', 'Abdul Basit', 'The man who speaks less than a dumb person.', 7)
on conflict (slug) do nothing;

-- Example challenge (only if none exists for UTC “today”)
insert into public.challenges (prompt, challenge_date, difficulty, is_active)
select
  'Create an image of a footballer playing with a football made of water while playing inside the sea.',
  (timezone('utc', now()))::date,
  'hard',
  true
where not exists (
  select 1
  from public.challenges c
  where c.challenge_date = (timezone('utc', now()))::date
);

-- updated_at trigger helper
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists cousins_updated_at on public.cousins;
create trigger cousins_updated_at before update on public.cousins
for each row execute function public.set_updated_at();

drop trigger if exists challenges_updated_at on public.challenges;
create trigger challenges_updated_at before update on public.challenges
for each row execute function public.set_updated_at();

drop trigger if exists submissions_updated_at on public.submissions;
create trigger submissions_updated_at before update on public.submissions
for each row execute function public.set_updated_at();
