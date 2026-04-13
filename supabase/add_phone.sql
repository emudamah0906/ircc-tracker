-- Run this in Supabase SQL editor
alter table alert_subscriptions
  add column if not exists phone text;
