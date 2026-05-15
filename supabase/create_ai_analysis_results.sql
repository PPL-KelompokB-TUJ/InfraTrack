-- ================================================================
-- AI Analysis Results Table
-- Stores automatic AI detection results for damage reports.
-- Run this script in Supabase SQL Editor.
-- ================================================================

create table if not exists public.ai_analysis_results (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.damage_reports(id) on delete cascade,
  predictions jsonb not null default '[]'::jsonb,
  image_width int default 0,
  image_height int default 0,
  severity_level text check (severity_level in ('none', 'low', 'medium', 'high')),
  total_detections int not null default 0,
  avg_confidence float not null default 0,
  confidence_threshold int not null default 25,
  error_message text,
  analyzed_at timestamptz not null default now(),
  constraint ai_analysis_results_report_id_unique unique (report_id)
);

-- Indexes
create index if not exists ai_analysis_results_report_id_idx
  on public.ai_analysis_results(report_id);

-- Enable RLS
alter table public.ai_analysis_results enable row level security;

-- ============================================================
-- RLS Policies
-- ============================================================

-- Drop all existing policies first to avoid conflicts
drop policy if exists "Allow anyone insert ai_analysis_results" on public.ai_analysis_results;
drop policy if exists "Allow anyone read ai_analysis_results" on public.ai_analysis_results;
drop policy if exists "Admin full access ai_analysis_results" on public.ai_analysis_results;
drop policy if exists "Allow public insert" on public.ai_analysis_results;
drop policy if exists "Allow public select" on public.ai_analysis_results;

-- Allow anyone (including anonymous public users) to INSERT
create policy "anon_insert_ai_analysis"
  on public.ai_analysis_results
  for insert
  with check (true);

-- Allow anyone to SELECT (so results show in report detail)
create policy "anon_select_ai_analysis"
  on public.ai_analysis_results
  for select
  using (true);

-- Allow authenticated admin to UPDATE/DELETE
create policy "admin_manage_ai_analysis"
  on public.ai_analysis_results
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- Grants — ensure anon and authenticated roles can access
-- ============================================================
grant usage on schema public to anon, authenticated;
grant select, insert on public.ai_analysis_results to anon;
grant select, insert, update, delete on public.ai_analysis_results to authenticated;
