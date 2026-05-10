-- Permit-expiry email reminders captured from /tracker.
-- Each row = one reminder request.  We email the user on `remind_date`
-- (which the front-end calculates as expiry minus the recommended apply-
-- before window for that permit type).
--
-- Run this once in the Supabase SQL editor, then re-run the front-end —
-- /tracker "Remind Me" submissions will start saving instead of failing
-- silently.

create table if not exists permit_reminders (
  id           bigserial primary key,
  email        text not null,
  permit_type  text not null,            -- 'work' | 'study' | 'visitor' | 'pr_card'
  expiry_date  date not null,            -- the user's permit expiry
  remind_date  date,                     -- when to send the reminder
  sent_at      timestamptz,              -- null until reminder email goes out
  unsubscribed boolean default false,
  token        text unique default encode(gen_random_bytes(24), 'hex'),
  created_at   timestamptz not null default now()
);

create index if not exists idx_pr_email      on permit_reminders (email);
create index if not exists idx_pr_remind_due on permit_reminders (remind_date)
  where sent_at is null and unsubscribed = false;
create index if not exists idx_pr_expiry     on permit_reminders (expiry_date);

-- Row-level security: anyone can insert a reminder for themselves; nobody
-- can read others' reminders. (Reads happen via the service-role key in
-- the future reminder-sender Edge Function.)
alter table permit_reminders enable row level security;

create policy "Anyone can sign up for a reminder"
  on permit_reminders for insert with check (true);

-- No SELECT policy = anon role cannot read. Service role bypasses RLS.

comment on table  permit_reminders is 'Email reminders for permit/PR-card expiry, captured on /tracker.';
comment on column permit_reminders.permit_type is 'Matches the PERMIT_CONFIG keys in tracker/page.tsx.';
comment on column permit_reminders.token        is 'Unique token used in the unsubscribe URL.';
