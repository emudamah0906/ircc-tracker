-- Run this in the Supabase SQL editor.
--
-- Creates the scraper_health table — a shared status board for the GitHub
-- Actions cron scrapers and the Heroku IG worker. The scrapers write a row
-- after each run (success or failure); the IG worker reads on each polling
-- cycle and refuses to publish stale spotlights when the data pipeline is
-- broken (preventing another silent 25-day failure like the one we hit on
-- 2026-04-15).
--
-- Read-pattern: one row per scraper, upserted by primary key (scraper_name).
-- Safe to re-run.

create table if not exists scraper_health (
  scraper_name text primary key,
  last_attempt_at  timestamptz not null default now(),
  last_success_at  timestamptz,
  last_status      text not null default 'unknown',  -- 'success' | 'failed' | 'unknown'
  last_error       text,
  last_run_id      text,                              -- GH Actions run id, optional
  metadata         jsonb,                              -- e.g. { "rows_inserted": 3 }
  updated_at       timestamptz not null default now()
);

create index if not exists idx_scraper_health_status on scraper_health (last_status);

-- Anyone with the service role can read/write. The IG worker uses the service
-- key. RLS is unnecessary here since the table holds no user data.
alter table scraper_health enable row level security;

drop policy if exists "service role full access" on scraper_health;
create policy "service role full access"
  on scraper_health for all
  using (true) with check (true);

-- Seed empty rows for the three known scrapers so the IG worker's first cycle
-- doesn't see a missing-row error on a fresh DB. Leave last_success_at null
-- so the freshness guard correctly treats them as "never succeeded yet".
insert into scraper_health (scraper_name, last_status)
values
  ('draws',           'unknown'),
  ('processing_times','unknown'),
  ('ircc_news',       'unknown')
on conflict (scraper_name) do nothing;
