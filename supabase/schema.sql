-- IRCC Processing Times Tracker - Supabase Schema
-- Run this in your Supabase SQL editor

-- ─────────────────────────────────────────────
-- 1. Historical processing times (raw data)
-- ─────────────────────────────────────────────
create table if not exists processing_times (
  id             bigserial primary key,
  visa_type      text not null,          -- e.g. "visitor-outside-canada"
  visa_label     text not null,          -- e.g. "Visitor visa"
  country_code   text not null,          -- e.g. "IND"
  country_name   text not null,          -- e.g. "India"
  processing_weeks float not null,       -- e.g. 14.0
  unit           text default 'weeks',
  fetched_at     timestamptz not null default now()
);

-- Index for fast dashboard queries
create index if not exists idx_pt_visa_country on processing_times (visa_type, country_code);
create index if not exists idx_pt_fetched_at   on processing_times (fetched_at desc);

-- ─────────────────────────────────────────────
-- 2. Latest snapshot view (for dashboard)
-- ─────────────────────────────────────────────
create or replace view latest_processing_times as
select distinct on (visa_type, country_code)
  visa_type,
  visa_label,
  country_code,
  country_name,
  processing_weeks,
  unit,
  fetched_at
from processing_times
order by visa_type, country_code, fetched_at desc;

-- ─────────────────────────────────────────────
-- 3. Email alert subscriptions
-- ─────────────────────────────────────────────
create table if not exists alert_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  email        text not null,
  visa_type    text not null,             -- which visa type to watch
  country_code text not null,             -- which country
  threshold_weeks float,                  -- alert when drops below this (optional)
  confirmed    boolean default false,     -- email confirmed
  token        text unique default encode(gen_random_bytes(32), 'hex'),
  created_at   timestamptz default now()
);

create index if not exists idx_subs_email on alert_subscriptions (email);
create index if not exists idx_subs_visa  on alert_subscriptions (visa_type, country_code);

-- ─────────────────────────────────────────────
-- 4. Alert history (avoid duplicate sends)
-- ─────────────────────────────────────────────
create table if not exists alert_history (
  id              bigserial primary key,
  subscription_id uuid references alert_subscriptions(id) on delete cascade,
  old_weeks       float,
  new_weeks       float,
  sent_at         timestamptz default now()
);

-- ─────────────────────────────────────────────
-- 5. Row-level security (RLS)
-- ─────────────────────────────────────────────
alter table processing_times      enable row level security;
alter table alert_subscriptions   enable row level security;
alter table alert_history         enable row level security;

-- Public can read processing times
create policy "Public read processing_times"
  on processing_times for select using (true);

-- Anyone can insert their own subscription
create policy "Public insert subscriptions"
  on alert_subscriptions for insert with check (true);

-- Users can read/delete their own subscription via token
create policy "Owner read subscriptions"
  on alert_subscriptions for select using (true);
