-- Run this in the Supabase SQL editor.
--
-- Enables Supabase Realtime broadcasting for pr_draws so the /draws page can
-- subscribe to INSERT events and live-prepend new IRCC draws without the
-- visitor having to reload. Idempotent (uses DO block to guard against
-- "table is already a member of publication").

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'pr_draws'
  ) then
    execute 'alter publication supabase_realtime add table pr_draws';
  end if;
end $$;
