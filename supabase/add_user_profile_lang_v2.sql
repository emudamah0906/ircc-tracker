-- Run this in the Supabase SQL editor to upgrade user_profiles for the
-- 2026-05-09 dashboard rewrite.
--
-- What this adds:
--   * Per-block language test types (applicant, spouse, French) so a candidate
--     can use IELTS for English while their spouse uses CELPIP, or so a French
--     speaker can store TEF/TCF results.
--   * Explicit English/French choice for each language block.
--   * A separate optional French language block — required to award the
--     +25 / +50 French bonus that the old schema couldn't capture.
--   * Tiered job-offer and Canadian-education columns so the +200 senior-mgmt
--     and +30 three-year-program bonuses become reachable. The old boolean
--     columns stay so legacy rows keep working until normalizeProfile() in
--     /dashboard backfills the new ones on read.
--
-- Safe to re-run — every clause uses `IF NOT EXISTS`.

alter table user_profiles
  -- Test types per block (default to 'ielts' so legacy single-test profiles read cleanly)
  add column if not exists first_lang_test  text default 'ielts',
  add column if not exists spouse_lang_test text default 'ielts',

  -- Which official language each block represents
  add column if not exists first_lang_choice  text default 'english',
  add column if not exists spouse_lang_choice text default 'english',

  -- Optional French block — null when the candidate has no French
  add column if not exists has_french_lang     boolean default false,
  add column if not exists french_lang_test    text,
  add column if not exists french_lang_reading   numeric,
  add column if not exists french_lang_writing   numeric,
  add column if not exists french_lang_listening numeric,
  add column if not exists french_lang_speaking  numeric,

  -- Tiered additional-points columns (replace the booleans on read)
  add column if not exists job_offer_tier         text default 'none',
  add column if not exists canadian_education_tier text default 'none';

-- Backfill the new columns from the legacy booleans for existing rows so the
-- dashboard scores the same number on first load after the migration.
update user_profiles
  set job_offer_tier = 'noc_teer_0_1_2_3'
  where has_job_offer = true and job_offer_tier = 'none';

update user_profiles
  set canadian_education_tier = 'one_or_two_year'
  where has_canadian_education = true and canadian_education_tier = 'none';

-- Migrate the legacy single lang_test column into the per-block test fields.
-- (Legacy rows used the same test for applicant + spouse — reasonable default.)
update user_profiles
  set first_lang_test  = lang_test
  where lang_test is not null and first_lang_test = 'ielts';

update user_profiles
  set spouse_lang_test = lang_test
  where lang_test is not null and spouse_lang_test = 'ielts';
