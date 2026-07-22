"""One-time offline generator: simplifies the official Singapore planning-area
boundaries into flat SVG path data for the frontend's discovery map screen.

Boundaries never change, so this is a build step, not a runtime computation.
Re-run only after geo/singapore-planning-areas.geojson is updated:

    python geo/scripts/generate_map_asset.py

Writes frontend/assets/mapData/planningAreas.ts.

Uses the same geo/singapore-planning-areas.geojson and the same
PLANNING_AREA_NAME_PROPERTY constant as backend/neighbourhoods.py (imported
directly, not duplicated) so the map shapes and the backend's point-in-polygon
resolution can never name a region differently.
"""

import colorsys
import json
import random
import sys
from math import cos, radians
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent / "backend"))

from shapely.geometry import shape
from shapely.ops import unary_union

from neighbourhoods import GEOJSON_PATH, PLANNING_AREA_NAME_PROPERTY, REGION_MERGE_MAP

OUTPUT_PATH = Path(__file__).resolve().parent.parent.parent / "frontend" / "assets" / "mapData" / "planningAreas.ts"

SIMPLIFY_TOLERANCE = 0.0005  # degrees; eyeballed for recognizable silhouettes, not survey accuracy
CANVAS_WIDTH = 1000  # arbitrary SVG units; the RN <Svg> scales this via viewBox
COORD_PRECISION = 2

UNDISCOVERED_GREY = "#d1d5db"
HUE_SATURATION = 0.55
HUE_LIGHTNESS = 0.55
SHUFFLE_SEED = 42


def _load_features() -> list[dict]:
    with open(GEOJSON_PATH, encoding="utf-8") as f:
        geojson = json.load(f)
    return geojson["features"]


def _build_projection(geoms: list) -> tuple:
    min_lng = min(g.bounds[0] for g in geoms)
    min_lat = min(g.bounds[1] for g in geoms)
    max_lng = max(g.bounds[2] for g in geoms)
    max_lat = max(g.bounds[3] for g in geoms)

    mean_lat = (min_lat + max_lat) / 2
    lat_correction = cos(radians(mean_lat))

    lng_span = max_lng - min_lng
    lat_span = (max_lat - min_lat) * lat_correction

    scale = CANVAS_WIDTH / lng_span
    canvas_height = lat_span * scale

    def project(lng: float, lat: float) -> tuple[float, float]:
        x = (lng - min_lng) * scale
        y = (max_lat - lat) * lat_correction * scale  # flipped: SVG y grows downward
        return round(x, COORD_PRECISION), round(y, COORD_PRECISION)

    return project, canvas_height


def _ring_to_path(ring, project) -> str:
    points = [project(lng, lat) for lng, lat in ring.coords]
    d = f"M{points[0][0]},{points[0][1]}"
    for x, y in points[1:]:
        d += f" L{x},{y}"
    return d + " Z"


def _polygon_to_subpaths(polygon, project) -> list[str]:
    subpaths = [_ring_to_path(polygon.exterior, project)]
    for interior in polygon.interiors:
        subpaths.append(_ring_to_path(interior, project))
    return subpaths


def _geometry_to_path_d(geom, project) -> str:
    if geom.geom_type == "Polygon":
        subpaths = _polygon_to_subpaths(geom, project)
    else:  # MultiPolygon
        subpaths = []
        for polygon in geom.geoms:
            subpaths.extend(_polygon_to_subpaths(polygon, project))
    return " ".join(subpaths)


def _assign_colours(names: list[str]) -> dict[str, str]:
    shuffled = names.copy()
    random.Random(SHUFFLE_SEED).shuffle(shuffled)

    colours = {}
    for i, name in enumerate(shuffled):
        hue = i / len(shuffled)
        r, g, b = colorsys.hls_to_rgb(hue, HUE_LIGHTNESS, HUE_SATURATION)
        colours[name] = "#{:02x}{:02x}{:02x}".format(round(r * 255), round(g * 255), round(b * 255))
    return colours


def _group_geometries_by_final_name(features: list[dict]) -> dict[str, list]:
    """Raw (pre-simplification) geometries, grouped by post-merge name.

    Unioning raw geometries (which share exact boundary coordinates with
    their neighbours in the source data) keeps merged shapes seamless.
    Unioning already-independently-simplified geometries instead risks thin
    sliver gaps where neighbours' simplified edges no longer align exactly.
    """
    groups: dict[str, list] = {}
    for feature in features:
        raw_name = feature["properties"][PLANNING_AREA_NAME_PROPERTY].title()
        final_name = REGION_MERGE_MAP.get(raw_name, raw_name)
        groups.setdefault(final_name, []).append(shape(feature["geometry"]))
    return groups


def main() -> None:
    features = _load_features()
    groups = _group_geometries_by_final_name(features)

    names = list(groups.keys())
    simplified_geoms = [
        (geoms[0] if len(geoms) == 1 else unary_union(geoms)).simplify(
            SIMPLIFY_TOLERANCE, preserve_topology=True
        )
        for geoms in groups.values()
    ]

    project, canvas_height = _build_projection(simplified_geoms)
    colours = _assign_colours(names)

    entries = []
    for name, geom in zip(names, simplified_geoms):
        path_d = _geometry_to_path_d(geom, project)
        centroid_x, centroid_y = project(geom.centroid.x, geom.centroid.y)

        min_lng, min_lat, max_lng, max_lat = geom.bounds
        min_x, min_y = project(min_lng, max_lat)  # top-left: min lng, max lat (y flips)
        max_x, max_y = project(max_lng, min_lat)  # bottom-right: max lng, min lat

        entries.append(
            {
                "name": name,
                "path": path_d,
                "color": colours[name],
                "centroid": {"x": centroid_x, "y": centroid_y},
                "bounds": {"minX": min_x, "minY": min_y, "maxX": max_x, "maxY": max_y},
            }
        )

    _write_output(entries, canvas_height)
    print(f"Wrote {len(entries)} planning areas to {OUTPUT_PATH}")


def _write_output(entries: list[dict], canvas_height: float) -> None:
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    lines = [
        "// Generated by geo/scripts/generate_map_asset.py — do not edit by hand.",
        "// Re-run that script after geo/singapore-planning-areas.geojson changes.",
        "",
        f'export const SG_MAP_VIEWBOX = "0 0 {CANVAS_WIDTH} {round(canvas_height, COORD_PRECISION)}";',
        f'export const UNDISCOVERED_COLOR = "{UNDISCOVERED_GREY}";',
        "",
        "export type PlanningAreaShape = {",
        "  name: string;",
        "  path: string;",
        "  color: string;",
        "  centroid: { x: number; y: number };",
        "  bounds: { minX: number; minY: number; maxX: number; maxY: number };",
        "};",
        "",
        "export const PLANNING_AREAS: PlanningAreaShape[] = [",
    ]
    for entry in entries:
        b = entry["bounds"]
        lines.append(
            "  { name: %s, path: %s, color: %s, centroid: { x: %s, y: %s }, bounds: { minX: %s, minY: %s, maxX: %s, maxY: %s } },"
            % (
                json.dumps(entry["name"]),
                json.dumps(entry["path"]),
                json.dumps(entry["color"]),
                entry["centroid"]["x"],
                entry["centroid"]["y"],
                b["minX"], b["minY"], b["maxX"], b["maxY"],
            )
        )
    lines.append("];")
    lines.append("")

    OUTPUT_PATH.write_text("\n".join(lines), encoding="utf-8")


if __name__ == "__main__":
    main()
