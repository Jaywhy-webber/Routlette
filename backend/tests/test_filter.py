import math

import pandas as pd
import pytest

from filter import apply_filters, haversine, WALKING_MAP


def test_haversine_same_point_returns_zero():
    assert haversine(1.3521, 103.8198, 1.3521, 103.8198) == pytest.approx(0.0, abs=1e-6)


def test_haversine_same_longitude_matches_closed_form_arc_length():
    # On the same meridian, great-circle distance reduces exactly to R * delta_latitude_radians.
    R = 6_371_000
    lat1, lat2, lng = 1.0, 2.0, 103.0
    expected = R * math.radians(lat2 - lat1)
    assert haversine(lat1, lng, lat2, lng) == pytest.approx(expected, rel=1e-6)


def _row(**overrides):
    base = {
        "place_id": "p", "name": "Venue", "category": "food",
        "primary_type": "cafe", "address": "Addr",
        "lat": 1.2966, "lng": 103.7764, "price_level": 2,
        "rating": 4.5, "rating_count": 50, "neighbourhood": "Test",
    }
    base.update(overrides)
    return base


def test_apply_filters_drops_excluded_types():
    df = pd.DataFrame([
        _row(name="Mall", primary_type="shopping_mall"),
        _row(name="Cafe", primary_type="cafe"),
    ])
    result = apply_filters(df, 1.2966, 103.7764, budget=2, category="both", walking=5)
    assert list(result["name"]) == ["Cafe"]


def test_apply_filters_budget_window_includes_boundary_tiers():
    df = pd.DataFrame([
        _row(name="Cheap", price_level=1),
        _row(name="Moderate", price_level=2),
        _row(name="Premium", price_level=3),
    ])
    result = apply_filters(df, 1.2966, 103.7764, budget=2, category="both", walking=5)
    assert set(result["name"]) == {"Cheap", "Moderate"}


def test_apply_filters_budget_drops_missing_price_level():
    df = pd.DataFrame([
        _row(name="NoPrice", price_level=None),
        _row(name="HasPrice", price_level=2),
    ])
    result = apply_filters(df, 1.2966, 103.7764, budget=2, category="both", walking=5)
    assert list(result["name"]) == ["HasPrice"]


def test_apply_filters_category_food_only():
    df = pd.DataFrame([
        _row(name="Food", category="food"),
        _row(name="Activity", category="activity"),
    ])
    result = apply_filters(df, 1.2966, 103.7764, budget=2, category="food", walking=5)
    assert list(result["name"]) == ["Food"]


def test_apply_filters_category_activity_only():
    df = pd.DataFrame([
        _row(name="Food", category="food"),
        _row(name="Activity", category="activity"),
    ])
    result = apply_filters(df, 1.2966, 103.7764, budget=2, category="activity", walking=5)
    assert list(result["name"]) == ["Activity"]


def test_apply_filters_category_both_keeps_all():
    df = pd.DataFrame([
        _row(name="Food", category="food"),
        _row(name="Activity", category="activity"),
    ])
    result = apply_filters(df, 1.2966, 103.7764, budget=2, category="both", walking=5)
    assert set(result["name"]) == {"Food", "Activity"}


def test_apply_filters_walking_radius_boundary():
    lat, lng = 1.2966, 103.7764
    radius_m = WALKING_MAP[1]  # 300m

    # ~250m north (within radius) and ~500m north (outside radius)
    inside_lat = lat + (250 / 111_320)
    outside_lat = lat + (500 / 111_320)

    df = pd.DataFrame([
        _row(name="Inside", lat=inside_lat, lng=lng),
        _row(name="Outside", lat=outside_lat, lng=lng),
    ])
    result = apply_filters(df, lat, lng, budget=2, category="both", walking=1)
    assert list(result["name"]) == ["Inside"]
    assert radius_m == 300


def test_apply_filters_drops_rows_missing_critical_fields():
    df = pd.DataFrame([
        _row(name="MissingName"), _row(name="Valid"),
    ])
    df.loc[df["name"] == "MissingName", "name"] = None
    result = apply_filters(df, 1.2966, 103.7764, budget=2, category="both", walking=5)
    assert list(result["name"]) == ["Valid"]

    df2 = pd.DataFrame([_row(name="NoRating", rating=None), _row(name="Valid")])
    result2 = apply_filters(df2, 1.2966, 103.7764, budget=2, category="both", walking=5)
    assert list(result2["name"]) == ["Valid"]


def test_apply_filters_sorts_by_distance_ascending():
    lat, lng = 1.2966, 103.7764
    df = pd.DataFrame([
        _row(name="Far", lat=lat + 0.002, lng=lng),
        _row(name="Near", lat=lat + 0.0001, lng=lng),
        _row(name="Mid", lat=lat + 0.001, lng=lng),
    ])
    result = apply_filters(df, lat, lng, budget=2, category="both", walking=5)
    assert result["distance_m"].is_monotonic_increasing
    assert list(result["name"]) == ["Near", "Mid", "Far"]


def test_apply_filters_returns_empty_df_when_nothing_survives():
    df = pd.DataFrame([_row(primary_type="shopping_mall")])
    result = apply_filters(df, 1.2966, 103.7764, budget=2, category="both", walking=5)
    assert result.empty
