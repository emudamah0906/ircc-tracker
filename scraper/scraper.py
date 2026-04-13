"""
IRCC Processing Times Scraper
Fetches data from Canada.ca JSON endpoints and stores in Supabase via REST API.
Run daily via cron or Railway scheduler.
"""

import os
import json
import requests
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]

IRCC_PTIME_URL = "https://www.canada.ca/content/dam/ircc/documents/json/data-ptime-en.json"
IRCC_COUNTRY_URL = "https://www.canada.ca/content/dam/ircc/documents/json/data-country-name-en.json"

IRCC_HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; IRCC-Tracker/1.0)",
    "Accept": "application/json",
    "Referer": "https://www.canada.ca/en/immigration-refugees-citizenship/services/application/check-processing-times.html",
}

SUPABASE_HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}

VISA_LABELS = {
    "visitor-outside-canada": "Visitor Visa",
    "supervisa": "Super Visa",
    "study": "Study Permit",
    "work": "Work Permit",
    "child_dependent": "Dependent Child",
    "pr": "Permanent Residence",
    "citizenship": "Citizenship",
    "sponsorship": "Sponsorship",
    "refugee": "Refugee",
    "trv": "Temporary Resident Visa",
}


def fetch_json(url: str) -> dict:
    response = requests.get(url, headers=IRCC_HEADERS, timeout=30)
    response.raise_for_status()
    return response.json()


def flatten_processing_times(data: dict, country_map: dict) -> list[dict]:
    """
    IRCC JSON structure:
    {
      "visitor-outside-canada": { "AF": "41 days", "IND": "54 days", ... },
      "study": { "AF": "30 days", ... },
    }
    """
    rows = []
    fetched_at = datetime.now(timezone.utc).isoformat()

    for visa_key, country_data in data.items():
        if not isinstance(country_data, dict):
            continue

        visa_label = VISA_LABELS.get(visa_key, visa_key.replace("-", " ").title())

        for country_code, timing_str in country_data.items():
            if not isinstance(timing_str, str):
                continue
            if "No processing time" in timing_str:
                continue

            parts = timing_str.strip().split()
            if len(parts) < 2:
                continue
            try:
                value = float(parts[0])
            except ValueError:
                continue

            unit = parts[1].rstrip("s")  # "days" → "day"

            rows.append({
                "visa_type": visa_key,
                "visa_label": visa_label,
                "country_code": country_code,
                "country_name": country_map.get(country_code, country_code),
                "processing_weeks": value,
                "unit": unit,
                "fetched_at": fetched_at,
            })

    return rows


def insert_to_supabase(rows: list[dict]):
    if not rows:
        print("No rows to insert.")
        return

    url = f"{SUPABASE_URL}/rest/v1/processing_times"
    batch_size = 500

    for i in range(0, len(rows), batch_size):
        batch = rows[i: i + batch_size]
        response = requests.post(url, headers=SUPABASE_HEADERS, json=batch, timeout=30)
        if response.status_code in (200, 201):
            print(f"Inserted batch {i // batch_size + 1}: {len(batch)} rows")
        else:
            print(f"Error inserting batch: {response.status_code} {response.text}")
            raise Exception(f"Supabase insert failed: {response.text}")


def main():
    print(f"Starting IRCC scrape at {datetime.now(timezone.utc).isoformat()}")

    print("Fetching processing times...")
    ptime_data = fetch_json(IRCC_PTIME_URL)

    print("Fetching country names...")
    try:
        country_raw = requests.get(IRCC_COUNTRY_URL, headers=IRCC_HEADERS, timeout=30)
        country_raw.encoding = "utf-8-sig"  # handle BOM
        country_data = country_raw.json()
        if isinstance(country_data, list):
            country_map = {c["code"]: c["name"] for c in country_data if "code" in c}
        else:
            country_map = country_data
        print(f"Loaded {len(country_map)} country names")
    except Exception as e:
        print(f"Warning: could not fetch country names ({e}), using codes only")
        country_map = {}

    rows = flatten_processing_times(ptime_data, country_map)
    print(f"Flattened {len(rows)} rows")

    insert_to_supabase(rows)
    print("Done.")


if __name__ == "__main__":
    main()
