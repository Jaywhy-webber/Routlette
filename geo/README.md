# geo/

Shared geographic reference data — the single source of truth for "which Singapore neighbourhood is this point in," used by both the backend (`backend/neighbourhoods.py`, point-in-polygon resolution at route-generation time) and the offline SVG map-asset generator (`geo/scripts/generate_map_asset.py`, consumed by the frontend's discovery map screen). Neither `backend/` nor `frontend/` owns this data, hence its own top-level directory.

## `singapore-planning-areas.geojson`

- **Source**: data.gov.sg, dataset "Master Plan 2025 Planning Area Boundary (No Sea)", published by URA.
  - Dataset page: https://data.gov.sg/datasets/d_2cc750190544007400b2cfd5d7f53209/view
  - Dataset ID: `d_2cc750190544007400b2cfd5d7f53209`
  - Downloaded via the data.gov.sg Open Data API (`GET /v1/public/api/datasets/{id}/poll-download`).
- **Format**: GeoJSON `FeatureCollection`, WGS84 (no explicit `crs`, per GeoJSON spec default), coordinates in `[lng, lat]` order.
- **Feature count**: 55 (one per official URA Planning Area). 48 `Polygon`, 7 `MultiPolygon` — both geometry types must be handled by any consumer.
- **Name property**: `PLN_AREA_N`, e.g. `"BUKIT TIMAH"` — always upper-case in the source data. Consumers normalize this to title case (`"Bukit Timah"`) for anything user-facing or stored as a neighbourhood label; the raw upper-case form is never surfaced directly.
- **No duplicate names** across the 55 features (verified at ingestion time).

## Re-fetching

If a newer Master Plan boundary revision is published, re-download via:
```bash
curl -s "https://api-open.data.gov.sg/v1/public/api/datasets/<dataset-id>/poll-download" -o /tmp/poll.json
python3 -c "import json; print(json.load(open('/tmp/poll.json'))['data']['url'])" > /tmp/url.txt
python3 -c "import urllib.request; urllib.request.urlretrieve(open('/tmp/url.txt').read().strip(), 'geo/singapore-planning-areas.geojson')"
```
(The signed S3 URL in the poll response contains query-string characters that break naive shell quoting — routing it through a file rather than inlining it in a `curl -o` command avoids that.)

After re-fetching, re-run `geo/scripts/generate_map_asset.py` to regenerate `frontend/assets/mapData/planningAreas.ts`, and confirm `PLN_AREA_N` is still the correct name property (data.gov.sg export schemas have varied across Master Plan vintages).

## `scripts/generate_map_asset.py`

One-time offline generator, run via `python geo/scripts/generate_map_asset.py`. Re-run only when the boundary source changes; not part of any runtime path. Writes `frontend/assets/mapData/planningAreas.ts`.

- Imports `GEOJSON_PATH`/`PLANNING_AREA_NAME_PROPERTY` directly from `backend/neighbourhoods.py` rather than duplicating them, so the map shapes and the backend's point-in-polygon resolution can never disagree on the source file or name property.
- Simplification tolerance: see the script's `SIMPLIFY_TOLERANCE` constant (currently `0.0005` degrees — eyeballed for recognizable silhouettes, adjust and re-run if a region looks wrong).
- Region polygons that contain holes (an enclave of a different area) are rendered with SVG `fill-rule="evenodd"` on the frontend `<Path>`, not by manually reversing ring winding order — evenodd fills correctly regardless of ring direction, which sidesteps needing to get winding right in the generator itself.
- Colours are assigned deterministically (seeded shuffle + evenly-spaced HSL hues) — see `generate_map_asset.py`'s `_assign_colours`. Re-running with the same `SHUFFLE_SEED` always reproduces the same palette.
