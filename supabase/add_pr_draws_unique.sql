-- Adds a logical uniqueness constraint to pr_draws so the scrapers can
-- safely re-run without creating duplicates.
--
-- The combination (draw_date, draw_type, program) is unique in IRCC's data:
-- a given program in a given draw type only happens once per day.
--
-- Run this in Supabase SQL editor before relying on the scraper for dedup.

-- Drop any duplicates that may have been seeded manually before adding
-- the constraint. Keeps the lowest id row for each duplicate group.
delete from pr_draws a using pr_draws b
where a.id > b.id
  and a.draw_date = b.draw_date
  and coalesce(a.draw_type, '') = coalesce(b.draw_type, '')
  and coalesce(a.program, '')   = coalesce(b.program, '');

alter table pr_draws
  add constraint pr_draws_unique_draw
  unique (draw_date, draw_type, program);
