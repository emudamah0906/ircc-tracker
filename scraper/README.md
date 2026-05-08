# IRCC Scrapers

Pulls public IRCC data into the `ircctracker.org` Supabase database.

## Scrapers

| Script | Source | Target table | Frequency |
|---|---|---|---|
| `draws_scraper.py` | `ee_rounds_123_en.json` (canada.ca) | `pr_draws` | Every 6h |
| `scraper.py` | `data-ptime-en.json` (canada.ca) | `processing_times` | Every 6h |

Both run via the GitHub Actions workflow at [.github/workflows/scrapers.yml](../.github/workflows/scrapers.yml).

## Local development

```bash
cd scraper
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# fill in SUPABASE_URL and SUPABASE_SERVICE_KEY
python draws_scraper.py
python scraper.py
```

## Production schedule (GitHub Actions)

The workflow runs every 6 hours (`cron: '15 */6 * * *'`) and on manual trigger.

### Required GitHub repo secrets

In GitHub → Settings → Secrets and variables → Actions, add:

- `SUPABASE_URL` — your Supabase project URL
- `SUPABASE_SERVICE_KEY` — service_role key (full access; never commit)

### First-time setup

1. Add the GitHub secrets above
2. Run the unique-constraint migration once in Supabase SQL editor:
   ```sql
   -- contents of supabase/add_pr_draws_unique.sql
   ```
3. Trigger the workflow manually first time: GitHub → Actions → "IRCC scrapers" → Run workflow
4. Watch the run logs to confirm draws and processing times got inserted

### Monitoring

- Check the latest workflow runs at: GitHub → Actions tab
- A successful `draws_scraper.py` run prints `[draws] inserted N new rows`
- Set up GitHub Actions email/Slack notifications for failed runs

## Dedup behavior

`draws_scraper.py` queries existing `(draw_date, draw_type, program)` tuples before inserting,
so re-runs are safe and idempotent. The `pr_draws_unique_draw` constraint provides a hard
backstop in the database.

## Adding more scrapers

1. Add a new Python file in `scraper/` (or another language)
2. Add a step to `.github/workflows/scrapers.yml`
3. Update this README

Likely next scrapers:
- PNP draws per province (Ontario OINP, BC PNP, AAIP — each has its own page)
- IRCC news (already exists as a Supabase Edge Function — see `supabase/functions/fetch-ircc-news/`)
