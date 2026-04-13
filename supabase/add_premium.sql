-- Run this in Supabase SQL editor to add premium support

alter table alert_subscriptions
  add column if not exists is_premium boolean default false,
  add column if not exists stripe_customer_id text;
