"""
Tiny helper that lets each scraper report its status to the shared
`scraper_health` Supabase table after every run.

Why this exists: a silent scraper failure went 25 days unnoticed in
April 2026 because the GitHub Actions cron tab was the only signal
and nobody was watching it. This table is the second signal. The
Heroku IG worker reads it on every polling cycle and refuses to
post stale spotlights when the upstream data pipeline is broken.

Usage:
    from health import report_success, report_failure

    try:
        do_work()
        report_success("draws", metadata={"rows_inserted": n})
    except Exception as exc:
        report_failure("draws", error=str(exc))
        raise
"""

from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Optional

import requests


def _supabase_url() -> str:
    return os.environ["SUPABASE_URL"].rstrip("/")


def _headers() -> dict[str, str]:
    key = os.environ["SUPABASE_SERVICE_KEY"]
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        # Upsert by primary key (scraper_name)
        "Prefer": "resolution=merge-duplicates,return=minimal",
    }


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _post(row: dict) -> None:
    """Best-effort upsert. We swallow network errors so a broken health table
    NEVER causes a working scraper to be marked as failed (would create a
    spurious red-alert downstream)."""
    try:
        url = f"{_supabase_url()}/rest/v1/scraper_health?on_conflict=scraper_name"
        response = requests.post(url, headers=_headers(), json=row, timeout=15)
        if response.status_code not in (200, 201, 204):
            print(
                f"[health] WARN: upsert returned {response.status_code}: "
                f"{response.text[:200]}"
            )
    except Exception as exc:  # noqa: BLE001 — best-effort
        print(f"[health] WARN: failed to upsert health row: {exc}")


def report_success(
    scraper_name: str,
    metadata: Optional[dict] = None,
    run_id: Optional[str] = None,
) -> None:
    now = _now_iso()
    _post({
        "scraper_name": scraper_name,
        "last_attempt_at": now,
        "last_success_at": now,
        "last_status": "success",
        "last_error": None,
        "last_run_id": run_id or os.environ.get("GITHUB_RUN_ID"),
        "metadata": metadata,
        "updated_at": now,
    })


def report_failure(
    scraper_name: str,
    error: str,
    run_id: Optional[str] = None,
) -> None:
    """Note: leaves last_success_at unchanged so the freshness guard can still
    see how long ago the scraper last actually worked."""
    now = _now_iso()
    _post({
        "scraper_name": scraper_name,
        "last_attempt_at": now,
        "last_status": "failed",
        "last_error": (error or "")[:1000],  # cap to keep row small
        "last_run_id": run_id or os.environ.get("GITHUB_RUN_ID"),
        "updated_at": now,
    })
