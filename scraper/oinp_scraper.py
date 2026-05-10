"""
Ontario OINP Draws Scraper.

Ontario publishes Provincial Nominee draw results as HTML on a yearly
"program updates" page (e.g. /page/2026-ontario-immigrant-nominee-program-updates).
Each draw lives under an H4 with a regional/stream title; the most recent
preceding H3 carries the date. There's no JSON feed.

This scraper:
  1. Fetches the current year's page (falls back to previous year if 404).
  2. Walks each <h4> draw, pairs it with its preceding <h3> date.
  3. Extracts invitation count from the first paragraph and the minimum
     stream cutoff score from the body bullets.
  4. Upserts new rows into the existing pr_draws table with
     province='Ontario', draw_type='OINP'. The IG worker already publishes
     any pr_draws row with province IS NOT NULL through its PNP path.

Dedup key: (draw_date, draw_type, program) — same as the federal scraper.
The H4 text already includes the region/stream for uniqueness within a date.

Run via GitHub Actions cron (every 6 hours) or manually:
    python scraper/oinp_scraper.py
"""

from __future__ import annotations

import os
import re
import sys
from datetime import datetime, timezone

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]

PAGE_URL_TEMPLATE = (
    "https://www.ontario.ca/page/{year}-ontario-immigrant-nominee-program-updates"
)

HTTP_HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; IRCC-Tracker/1.0)",
    "Accept": "text/html,application/xhtml+xml",
}

SUPABASE_HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal,resolution=ignore-duplicates",
}

MONTHS = {
    "january": 1, "february": 2, "march": 3, "april": 4, "may": 5, "june": 6,
    "july": 7, "august": 8, "september": 9, "october": 10, "november": 11, "december": 12,
}


def fetch_page() -> tuple[str, str]:
    """Returns (html, source_url). Tries current year, falls back to previous
    year — covers the early-January window when last year's page still holds
    draws we haven't seen yet."""
    year = datetime.now(timezone.utc).year
    for candidate in (year, year - 1):
        url = PAGE_URL_TEMPLATE.format(year=candidate)
        response = requests.get(url, headers=HTTP_HEADERS, timeout=30)
        if response.status_code == 200 and "candidates invited" in response.text.lower():
            return response.text, url
        print(f"[oinp] {candidate} page returned {response.status_code}, trying older year...")
    raise RuntimeError("Could not find an OINP updates page for current or previous year")


def parse_date(text: str) -> str | None:
    """Parses 'April 30, 2026' (with optional nbsp) into 'YYYY-MM-DD'."""
    cleaned = text.replace("\xa0", " ").strip().rstrip(",")
    # Tolerate missing year (e.g. "March 16") by defaulting to current year.
    match = re.match(r"(?i)([A-Za-z]+)\s+(\d{1,2})(?:,\s*(\d{4}))?$", cleaned)
    if not match:
        return None
    month_name, day, year = match.groups()
    month = MONTHS.get(month_name.lower())
    if not month:
        return None
    year = int(year) if year else datetime.now(timezone.utc).year
    try:
        return datetime(year, month, int(day)).date().isoformat()
    except ValueError:
        return None


def extract_invitations(text: str) -> int | None:
    """First paragraph reads 'we issued N invitations to apply' or
    'N notifications of interest'. Pulls the first integer near those phrases."""
    lowered = text.lower()
    # Look for "issued N invit..." / "issued N notification..."
    match = re.search(r"issued\s+([\d,]+)\s+(?:invitation|notification)", lowered)
    if match:
        return int(match.group(1).replace(",", ""))
    # Fallback: first integer at all
    match = re.search(r"([\d,]+)\s+(?:invitation|notification)", lowered)
    if match:
        return int(match.group(1).replace(",", ""))
    return None


def extract_min_score(text: str) -> int | None:
    """OINP's body text contains lines like 'Candidates with a score of 57 and above'
    or 'a score of 35 and above'. Each stream in a draw may have its own threshold;
    we take the MIN as the representative cutoff (= the lowest bar to clear)."""
    scores = [int(m) for m in re.findall(r"score of\s+(\d{1,3})\b", text.lower())]
    if not scores:
        return None
    # Filter implausibly high values — OINP scores are typically 20-100.
    plausible = [s for s in scores if s <= 200]
    if not plausible:
        return None
    return min(plausible)


def clean_program(raw: str) -> str:
    """Collapse whitespace, fix '( GTA )' padding from <abbr> rendering, strip
    trailing punctuation in the H4 title."""
    collapsed = re.sub(r"\s+", " ", raw)
    fixed = re.sub(r"\(\s+", "(", re.sub(r"\s+\)", ")", collapsed))
    return fixed.strip().rstrip(".:")


def parse_draws(html: str, source_url: str) -> list[dict]:
    soup = BeautifulSoup(html, "html.parser")
    rows: list[dict] = []

    for h4 in soup.find_all("h4"):
        # Find the closest preceding H3 in document order.
        h3 = h4.find_previous("h3")
        if not h3:
            continue
        draw_date = parse_date(h3.get_text(" ", strip=True))
        if not draw_date:
            continue

        program = clean_program(h4.get_text(" ", strip=True))
        if not program:
            continue

        # Gather the H4's body — every sibling until the next H3/H4.
        body_parts: list[str] = []
        for sibling in h4.find_all_next():
            if sibling.name in ("h2", "h3", "h4"):
                break
            if sibling.name in ("p", "ul", "ol"):
                body_parts.append(sibling.get_text(" ", strip=True))
        body_text = " ".join(body_parts)

        invitations = extract_invitations(body_text)
        crs_score = extract_min_score(body_text)

        # Skip non-draw entries (policy announcements, allocation updates).
        # A real draw always has an invitation count. Without it, the IG worker
        # would post about a "draw" that didn't actually happen.
        if invitations is None:
            continue

        rows.append({
            "draw_number": None,  # Ontario doesn't number draws
            "draw_date": draw_date,
            "draw_type": "OINP",
            "province": "Ontario",
            "program": program,
            "invitations": invitations,
            "crs_score": crs_score,
            "tie_breaking_date": None,
            "source_url": source_url,
        })

    return rows


def fetch_existing_keys() -> set[tuple[str, str | None, str | None]]:
    url = (
        f"{SUPABASE_URL}/rest/v1/pr_draws"
        "?select=draw_date,draw_type,program&draw_type=eq.OINP&limit=10000"
    )
    response = requests.get(
        url,
        headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"},
        timeout=30,
    )
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


def main() -> int:
    started = datetime.now(timezone.utc).isoformat()
    print(f"[oinp] started at {started}")

    html, source_url = fetch_page()
    print(f"[oinp] fetched {source_url} ({len(html)} chars)")

    transformed = parse_draws(html, source_url)
    print(f"[oinp] parsed {len(transformed)} draws from page")

    existing = fetch_existing_keys()
    print(f"[oinp] {len(existing)} existing OINP draws in DB")

    new_rows = [
        r for r in transformed
        if (r["draw_date"], r["draw_type"], r["program"]) not in existing
    ]
    print(f"[oinp] {len(new_rows)} new rows to insert")

    for r in new_rows[:5]:
        print(f"  + {r['draw_date']} | {r['program'][:60]} | ITAs={r['invitations']} | min-score={r['crs_score']}")
    if len(new_rows) > 5:
        print(f"  ... and {len(new_rows) - 5} more")

    inserted = insert_new_draws(new_rows)
    print(f"[oinp] inserted {inserted} new rows")
    print("[oinp] done.")
    return inserted


if __name__ == "__main__":
    from health import report_success, report_failure
    try:
        n = main()
        report_success("oinp", metadata={"rows_inserted": n})
    except Exception as exc:
        print(f"[oinp] ERROR: {exc}", file=sys.stderr)
        report_failure("oinp", error=str(exc))
        sys.exit(1)
