-- PR Draws table
create table if not exists pr_draws (
  id            bigserial primary key,
  draw_number   int,
  draw_date     date not null,
  draw_type     text not null,  -- "Express Entry", "Ontario PNP", "BC PNP" etc
  province      text,           -- null = federal (Express Entry)
  program       text,           -- "Canadian Experience Class", "FSW", "Trade Occupations" etc
  invitations   int,
  crs_score     int,            -- lowest CRS score invited (Express Entry only)
  tie_breaking_date text,       -- tie breaking rule date
  source_url    text,
  created_at    timestamptz default now()
);

create index if not exists idx_draws_date     on pr_draws (draw_date desc);
create index if not exists idx_draws_province on pr_draws (province);
create index if not exists idx_draws_type     on pr_draws (draw_type);

-- RLS
alter table pr_draws enable row level security;
create policy "Public read pr_draws" on pr_draws for select using (true);

-- Seed with recent Express Entry draws
insert into pr_draws (draw_number, draw_date, draw_type, province, program, invitations, crs_score) values
(408, '2026-04-02', 'Express Entry', null, 'Trade Occupations', 3000, 477),
(407, '2026-03-31', 'Express Entry', null, 'Canadian Experience Class', 2250, 509),
(406, '2026-03-30', 'Express Entry', null, 'Provincial Nominee Program', 356, 802),
(405, '2026-03-18', 'Express Entry', null, 'French Language Proficiency', 4000, 393),
(404, '2026-03-17', 'Express Entry', null, 'Canadian Experience Class', 4000, 507),
(403, '2026-03-16', 'Express Entry', null, 'Provincial Nominee Program', 362, 742),
(402, '2026-03-05', 'Express Entry', null, 'Senior Managers', 250, 429),
(401, '2026-03-04', 'Express Entry', null, 'French Language Proficiency', 5500, 397),
(400, '2026-03-03', 'Express Entry', null, 'Canadian Experience Class', 6000, 508),
(399, '2026-03-02', 'Express Entry', null, 'Provincial Nominee Program', 264, 710),
(398, '2026-02-19', 'Express Entry', null, 'Canadian Experience Class', 4500, 511),
(397, '2026-02-18', 'Express Entry', null, 'Provincial Nominee Program', 298, 762),
(396, '2026-02-05', 'Express Entry', null, 'French Language Proficiency', 6000, 379),
(395, '2026-02-04', 'Express Entry', null, 'Canadian Experience Class', 5000, 504),
(394, '2026-02-03', 'Express Entry', null, 'Provincial Nominee Program', 289, 730)
on conflict do nothing;
