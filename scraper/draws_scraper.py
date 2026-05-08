"""
IRCC Express Entry Draws Scraper.

Pulls the canonical IRCC JSON published at canada.ca for Express Entry rounds
of invitation, transforms each round into the pr_draws schema, and upserts
new rows into Supabase via PostgREST. Existing rows are left alone (dedup by
draw_number + draw_type).

Run via GitHub Actions cron (every 6 hours) or manually:
    python scraper/draws_scraper.py
"""

from __future__ import annotations

import os
import sys
from datetime import datetime, timezone

import requests
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]

# Canonical IRCC JSON for Express Entry rounds. Same canada.ca/content/dam/ircc/json
# pattern your processing-times scraper uses.
IRCC_ROUNDS_URL = (
    "https://www.canada.ca/content/dam/ircc/documents/json/ee_rounds_123_en.json"
)

IRCC_HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; IRCC-Tracker/1.0)",
    "Accept": "application/json",
    "Referer": (
        "https://www.canada.ca/en/immigration-refugees-citizenship/services/"
        "immigrate-canada/express-entry/submit-profile/rounds-invitations.html"
    ),
}

SUPABASE_HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal,resolution=ignore-duplicates",
}


def fetch_rounds_json() -> list[dict]:
    response = requests.get(IRCC_ROUNDS_URL, headers=IRCC_HEADERS, timeout=30)
    response.raise_for_status()
    payload = response.json()

    # IRCC payload is typically { "rounds": [ {...}, ... ] }, but be defensive.
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict):
        for key in ("rounds", "roundList", "data", "items"):
            if isinstance(payload.get(key), list):
                return payload[key]
    raise ValueError(f"Unexpected IRCC payload shape; top-level keys: {list(payload)[:10]}")


def parse_int(value) -> int | None:
    if value is None:
        return None
    try:
        # IRCC sometimes returns "3,000" with a comma.
        return int(str(value).replace(",", "").strip())
    except (ValueError, TypeError):
        return None


def parse_date(value) -> str | None:
    """Returns YYYY-MM-DD or None. IRCC publishes dates as 'YYYY-MM-DD' typically."""
    if not value:
        return None
    text = str(value).strip()
    # Already YYYY-MM-DD
    if len(text) >= 10 and text[4] == "-" and text[7] == "-":
        return text[:10]
    # Other formats — try iso parse
    try:
        return datetime.fromisoformat(text).date().isoformat()
    except ValueError:
        return None


def derive_province(draw_name: str | None) -> str | None:
    """Federal Express Entry draws have province=null. Some PNP-only category
    draws are still federal (province=null) because they're administered by IRCC.
    All draws from this JSON are federal Express Entry rounds, so always null.
    """
    return None


def transform_rounds(rounds: list[dict]) -> list[dict]:
    rows: list[dict] = []
    for r in rounds:
        # IRCC field names — being generous because they sometimes change.
        draw_number = parse_int(r.get("drawNumber") or r.get("draw_number"))
        draw_date = parse_date(r.get("drawDate") or r.get("draw_date"))
        draw_name = (r.get("drawName") or r.get("draw_name") or "").strip() or None
        invitations = parse_int(r.get("drawSize") or r.get("draw_size"))
        crs = parse_int(r.get("drawCRS") or r.get("draw_crs"))
        tie_breaking = (r.get("drawCutOff") or r.get("draw_cutoff") or "").strip() or None

        if not draw_date:
            # Drop unusable rows
            continue

        rows.append({
            "draw_number": draw_number,
            "draw_date": draw_date,
            "draw_type": "Express Entry",
            "province": derive_province(draw_name),
            "program": draw_name,
            "invitations": invitations,
            "crs_score": crs,
            "tie_breaking_date": tie_breaking,
            "source_url": (
                "https://www.canada.ca/en/immigration-refugees-citizenship/services/"
                "immigrate-canada/express-entry/submit-profile/rounds-invitations.html"
            ),
        })
    return rows


def fetch_existing_keys() -> set[tuple[str, str | None, str | None]]:
    """Build a set of unique keys for existing draws so we can skip them.

    Key: (draw_date, draw_type, program) — the realistic uniqueness in IRCC data.
    """
    url = (
        f"{SUPABASE_URL}/rest/v1/pr_draws"
        "?select=draw_date,draw_type,program&limit=10000"
    )
    response = requests.get(url, headers={
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    }, timeout=30)
    response.raise_for_status()
    rows = response.json() or []
    return {(r.get("draw_date"), r.get("draw_type"), r.get("program")) for r in rows}


def insert_new_draws(rows: list[dict]) -> int:
    if not rows:
        return 0
    url = f"{SUPABASE_URL}/rest/v1/pr_draws"
    response = requests.post(url, headers=SUPABASE_HEADERS, json=rows, timeout=30)
    if response.status_code not in (200, 201):
        raise Exception(f"Supabase insert failed: {response.status_code} {response.text}")
    return len(rows)


def main() -> None:
    started = datetime.now(timezone.utc).isoformat()
    print(f"[draws] started at {started}")

    print("[draws] fetching IRCC rounds JSON...")
    rounds = fetch_rounds_json()
    print(f"[draws] fetched {len(rounds)} rounds from IRCC")

    transformed = transform_rounds(rounds)
    print(f"[draws] transformed {len(transformed)} rows")

    print("[draws] checking existing rows in Supabase...")
    existing = fetch_existing_keys()
    print(f"[draws] {len(existing)} existing draws in DB")

    new_rows = [
        r for r in transformed
        if (r["draw_date"], r["draw_type"], r["program"]) not in existing
    ]
    print(f"[draws] {len(new_rows)} new rows to insert")

    if new_rows:
        for r in new_rows[:5]:
            print(f"  + {r['draw_date']} {r['program']} CRS {r['crs_score']} ({r['invitations']} ITAs)")
        if len(new_rows) > 5:
            print(f"  ... and {len(new_rows) - 5} more")

    inserted = insert_new_draws(new_rows)
    print(f"[draws] inserted {inserted} new rows")
    print("[draws] done.")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"[draws] ERROR: {exc}", file=sys.stderr)
        sys.exit(1)
