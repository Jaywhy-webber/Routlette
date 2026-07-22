from pathlib import Path
import json

from shapely.geometry import Point, shape
from shapely.prepared import prep
from shapely.strtree import STRtree

GEOJSON_PATH = Path(__file__).resolve().parent.parent / "geo" / "singapore-planning-areas.geojson"
PLANNING_AREA_NAME_PROPERTY = "PLN_AREA_N"

# Small, tightly-clustered central/CBD planning areas that are merged into one
# "Central" neighbourhood for the discovery map — individually distinguishing
# them isn't meaningful at the map's scale. Shared with geo/scripts/generate_map_asset.py
# so point-in-polygon resolution and the rendered map shape never disagree.
REGION_MERGE_MAP: dict[str, str] = {
    "Downtown Core": "Central",
    "Museum": "Central",
    "Newton": "Central",
    "Orchard": "Central",
    "Outram": "Central",
    "River Valley": "Central",
    "Rochor": "Central",
    "Singapore River": "Central",
    "Straits View": "Central",
    "Marina East": "Central",
    "Marina South": "Central",
}

_names: list[str] = []
_prepared_geoms: list = []
_tree: STRtree | None = None


def _load() -> None:
    global _tree
    if _tree is not None:
        return

    with open(GEOJSON_PATH, encoding="utf-8") as f:
        geojson = json.load(f)

    geoms = []
    for feature in geojson["features"]:
        name = feature["properties"][PLANNING_AREA_NAME_PROPERTY].title()
        name = REGION_MERGE_MAP.get(name, name)
        geom = shape(feature["geometry"])
        _names.append(name)
        geoms.append(geom)
        _prepared_geoms.append(prep(geom))

    _tree = STRtree(geoms)


def resolve_neighbourhood(lat: float, lng: float) -> str | None:
    _load()

    point = Point(lng, lat)
    for idx in _tree.query(point):
        if _prepared_geoms[idx].intersects(point):
            return _names[idx]
    return None
