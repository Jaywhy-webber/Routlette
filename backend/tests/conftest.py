import os

# Must be set before `main` is imported anywhere in the test session (fixture
# collection imports this conftest before any test module), since main.py
# builds the module-level `_jwks_client` at import time from this env var.
# See tests/test_auth.py for the fuller explanation.
os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")

# Tests must be deterministic and offline regardless of the developer's local
# backend/.env, pin this to the static-CSV path so a locally-set
# USE_LIVE_API=true (for manually running the app) never makes tests issue
# real Google Places requests.
os.environ["USE_LIVE_API"] = "false"

import pandas as pd
import pytest
from fastapi.testclient import TestClient

import main


@pytest.fixture
def client():
    main.limiter.reset()
    return TestClient(main.app)


@pytest.fixture
def sample_df():
    """Small synthetic venue pool matching venues.csv's columns.

    Rows are centered around NUS (1.2966, 103.7764) and deliberately cover:
    - an excluded type (shopping_mall)
    - a missing price_level
    - a venue outside a tight walking radius
    - a missing rating
    - enough valid food/activity rows to survive full filtering
    """
    return pd.DataFrame(
        [
            {
                "place_id": "p1", "name": "Good Cafe", "category": "food",
                "primary_type": "cafe", "address": "1 Test Rd",
                "lat": 1.2970, "lng": 103.7768, "price_level": 2,
                "rating": 4.5, "rating_count": 50, "neighbourhood": "Kent Ridge",
            },
            {
                "place_id": "p2", "name": "Good Museum", "category": "activity",
                "primary_type": "museum", "address": "2 Test Rd",
                "lat": 1.2968, "lng": 103.7766, "price_level": 1,
                "rating": 4.6, "rating_count": 60, "neighbourhood": "Kent Ridge",
            },
            {
                "place_id": "p3", "name": "Excluded Mall", "category": "activity",
                "primary_type": "shopping_mall", "address": "3 Test Rd",
                "lat": 1.2969, "lng": 103.7765, "price_level": 2,
                "rating": 4.2, "rating_count": 100, "neighbourhood": "Kent Ridge",
            },
            {
                "place_id": "p4", "name": "No Price Restaurant", "category": "food",
                "primary_type": "restaurant", "address": "4 Test Rd",
                "lat": 1.2971, "lng": 103.7769, "price_level": None,
                "rating": 4.4, "rating_count": 30, "neighbourhood": "Kent Ridge",
            },
            {
                "place_id": "p5", "name": "Far Away Park", "category": "activity",
                "primary_type": "park", "address": "5 Far Rd",
                "lat": 1.4000, "lng": 103.9000, "price_level": 1,
                "rating": 4.3, "rating_count": 20, "neighbourhood": "Far District",
            },
            {
                "place_id": "p6", "name": "No Rating Bakery", "category": "food",
                "primary_type": "bakery", "address": "6 Test Rd",
                "lat": 1.2967, "lng": 103.7767, "price_level": 1,
                "rating": None, "rating_count": 10, "neighbourhood": "Kent Ridge",
            },
            {
                "place_id": "p7", "name": "Second Cafe", "category": "food",
                "primary_type": "cafe", "address": "7 Test Rd",
                "lat": 1.2972, "lng": 103.7770, "price_level": 2,
                "rating": 4.1, "rating_count": 200, "neighbourhood": "Kent Ridge",
            },
            {
                "place_id": "p8", "name": "Second Park", "category": "activity",
                "primary_type": "park", "address": "8 Test Rd",
                "lat": 1.2965, "lng": 103.7763, "price_level": 1,
                "rating": 4.0, "rating_count": 25, "neighbourhood": "Kent Ridge",
            },
        ]
    )
