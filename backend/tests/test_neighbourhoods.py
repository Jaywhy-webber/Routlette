import json

import pytest

import neighbourhoods


def _write_synthetic_geojson(path):
    features = [
        {
            "type": "Feature",
            "properties": {"PLN_AREA_N": "REGION A"},
            "geometry": {
                "type": "Polygon",
                "coordinates": [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
            },
        },
        {
            "type": "Feature",
            "properties": {"PLN_AREA_N": "REGION D"},
            "geometry": {
                "type": "Polygon",
                # shares the lng=1 edge with Region A
                "coordinates": [[[1, 0], [2, 0], [2, 1], [1, 1], [1, 0]]],
            },
        },
        {
            "type": "Feature",
            "properties": {"PLN_AREA_N": "REGION C"},
            "geometry": {
                "type": "MultiPolygon",
                "coordinates": [
                    [[[5, 0], [6, 0], [6, 1], [5, 1], [5, 0]]],
                    [[[7, 0], [8, 0], [8, 1], [7, 1], [7, 0]]],
                ],
            },
        },
    ]
    with open(path, "w", encoding="utf-8") as f:
        json.dump({"type": "FeatureCollection", "features": features}, f)


@pytest.fixture(autouse=True)
def synthetic_boundaries(tmp_path, monkeypatch):
    geojson_path = tmp_path / "synthetic.geojson"
    _write_synthetic_geojson(geojson_path)

    monkeypatch.setattr(neighbourhoods, "GEOJSON_PATH", geojson_path)
    monkeypatch.setattr(neighbourhoods, "_names", [])
    monkeypatch.setattr(neighbourhoods, "_prepared_geoms", [])
    monkeypatch.setattr(neighbourhoods, "_tree", None)
    yield


def test_resolve_neighbourhood_point_inside_polygon():
    assert neighbourhoods.resolve_neighbourhood(0.5, 0.5) == "Region A"


def test_resolve_neighbourhood_point_inside_multipolygon_second_part():
    assert neighbourhoods.resolve_neighbourhood(0.5, 7.5) == "Region C"


def test_resolve_neighbourhood_point_outside_all_polygons_returns_none():
    assert neighbourhoods.resolve_neighbourhood(50.0, 50.0) is None


def test_resolve_neighbourhood_point_on_shared_boundary_does_not_raise():
    # lng=1 is the shared edge between Region A and Region D
    result = neighbourhoods.resolve_neighbourhood(0.5, 1.0)
    assert result in ("Region A", "Region D")


def test_resolve_neighbourhood_load_is_idempotent():
    neighbourhoods.resolve_neighbourhood(0.5, 0.5)
    tree_after_first_call = neighbourhoods._tree
    neighbourhoods.resolve_neighbourhood(0.5, 7.5)
    assert neighbourhoods._tree is tree_after_first_call


def test_resolve_neighbourhood_applies_region_merge_map(monkeypatch):
    monkeypatch.setattr(
        neighbourhoods,
        "REGION_MERGE_MAP",
        {"Region A": "Merged Region", "Region D": "Merged Region"},
    )

    # A point in either source polygon resolves to the merged name, not its
    # original individual name.
    assert neighbourhoods.resolve_neighbourhood(0.5, 0.5) == "Merged Region"
    assert neighbourhoods.resolve_neighbourhood(0.5, 1.5) == "Merged Region"
    # Untouched region keeps its own name.
    assert neighbourhoods.resolve_neighbourhood(0.5, 7.5) == "Region C"
