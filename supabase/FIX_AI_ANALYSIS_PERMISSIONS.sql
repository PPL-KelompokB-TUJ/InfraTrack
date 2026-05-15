-- ================================================================
-- FIX: AI Analysis Results Permissions
-- Run this in Supabase SQL Editor to fix permission issues.
-- This disables RLS on the ai_analysis_results table since
-- it only stores machine-generated data (no sensitive user data).
-- ================================================================

-- Disable RLS entirely — this table only has AI-generated analysis data
alter table public.ai_analysis_results disable row level security;

-- Drop any existing policies (they're no longer needed)
drop policy if exists "Allow anyone insert ai_analysis_results" on public.ai_analysis_results;
drop policy if exists "Allow anyone read ai_analysis_results" on public.ai_analysis_results;
drop policy if exists "Admin full access ai_analysis_results" on public.ai_analysis_results;
drop policy if exists "Allow public insert" on public.ai_analysis_results;
drop policy if exists "Allow public select" on public.ai_analysis_results;
drop policy if exists "anon_insert_ai_analysis" on public.ai_analysis_results;
drop policy if exists "anon_select_ai_analysis" on public.ai_analysis_results;
drop policy if exists "admin_manage_ai_analysis" on public.ai_analysis_results;

-- Grant full access to both roles
grant all on public.ai_analysis_results to anon;
grant all on public.ai_analysis_results to authenticated;
