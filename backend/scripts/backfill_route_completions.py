"""One-time migration: backfill route_completions from existing saved_routes rows.

Run manually, once, after `supabase/route_completions.sql` has been applied and
main.py's live neighbourhood resolution has shipped:

    python backend/scripts/backfill_route_completions.py

Safe to re-run — inserts use `Prefer: resolution=ignore-duplicates` against the
unique index on (user_id, planning_area, route_token), so a repeat run is a no-op.

Needs SUPABASE_SERVICE_ROLE_KEY in backend/.env (Supabase dashboard -> Project
Settings -> API -> service_role key). This bypasses RLS to read every user's
saved_routes, so it is used only here, never by main.py, and must never be
committed or exposed client-side.
"""

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import requests
from dotenv import load_dotenv

from neighbourhoods import resolve_neighbourhood

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("EXPO_PUBLIC_SUPABASE_URL")
SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")


def _require_config() -> None:
    if not SUPABASE_URL:
        raise SystemExit("SUPABASE_URL (or EXPO_PUBLIC_SUPABASE_URL) is not set in backend/.env")
    if not SERVICE_ROLE_KEY:
        raise SystemExit(
            "SUPABASE_SERVICE_ROLE_KEY is not set in backend/.env — fetch it from "
            "Project Settings -> API in the Supabase dashboard."
        )


def _fetch_saved_routes() -> list[dict]:
    resp = requests.get(
        f"{SUPABASE_URL}/rest/v1/saved_routes",
        params={"select": "user_id,stops,journey_start_time,journey_end_time"},
        headers={
            "apikey": SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
        },
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()


def _completion_rows_for_route(route: dict) -> list[dict]:
    stops = route.get("stops") or []
    areas = {
        resolve_neighbourhood(float(stop["lat"]), float(stop["lng"]))
        for stop in stops
        if stop.get("lat") is not None and stop.get("lng") is not None
    }
    areas.discard(None)

    if not areas:
        return []

    route_token = f"{route['journey_start_time']}-{route['journey_end_time']}"
    return [
        {
            "user_id": route["user_id"],
            "planning_area": area,
            "route_token": route_token,
        }
        for area in areas
    ]


def _insert_rows(rows: list[dict]) -> None:
    if not rows:
        return
    resp = requests.post(
        f"{SUPABASE_URL}/rest/v1/route_completions",
        params={"on_conflict": "user_id,planning_area,route_token"},
        headers={
            "apikey": SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "resolution=ignore-duplicates",
        },
        json=rows,
        timeout=30,
    )
    resp.raise_for_status()


def main() -> None:
    _require_config()

    routes = _fetch_saved_routes()
    print(f"Fetched {len(routes)} saved_routes rows.")

    all_rows: list[dict] = []
    unresolved_routes = 0
    for route in routes:
        rows = _completion_rows_for_route(route)
        if not rows:
            unresolved_routes += 1
        all_rows.extend(rows)

    _insert_rows(all_rows)

    print(
        f"Routes processed: {len(routes)} | "
        f"Completion rows inserted (or already present): {len(all_rows)} | "
        f"Routes with no resolvable neighbourhood: {unresolved_routes}"
    )


if __name__ == "__main__":
    main()
