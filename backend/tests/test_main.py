from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock, patch

import pandas as pd
import pytest

import main


# get_vibe 

@pytest.mark.parametrize("primary_type,expected_vibe", [
    ("cafe", "Coffee"),
    ("bakery", "Fuel Stop"),
    ("italian_restaurant", "Main Event"),
    ("bar", "Social Hour"),
    ("ramen_restaurant", "Quick & Local"),
    ("museum", "Culture"),
    ("park", "Outdoors"),
    ("tourist_attraction", "Urban Adventure"),
])
def test_get_vibe_known_type_maps_to_correct_bucket(primary_type, expected_vibe):
    assert main.get_vibe(primary_type) == expected_vibe


def test_get_vibe_unknown_type_returns_other():
    assert main.get_vibe("some_made_up_type") == "Other"


def test_get_vibe_cleans_bracketed_and_quoted_input():
    assert main.get_vibe("['cafe']") == "Coffee"
    assert main.get_vibe("cafe, bakery") == "Coffee"


# fetch_stop_reviews

def _fake_response(status_code, json_data):
    resp = Mock()
    resp.status_code = status_code
    resp.json = Mock(return_value=json_data)
    return resp


@pytest.mark.asyncio
async def test_fetch_stop_reviews_filters_non_english_and_truncates():
    long_review = " ".join(["word"] * 150)
    reviews = [
        {"text": {"languageCode": "fr", "text": "Ceci n'est pas anglais"}},
        {"text": {"languageCode": "en", "text": long_review}},
        {"text": {"languageCode": "en", "text": "short english review"}},
        {"text": {"languageCode": "en", "text": "another english review"}},
        {"text": {"languageCode": "en", "text": "a fourth english review that should be dropped"}},
    ]
    client = Mock()
    client.get = AsyncMock(return_value=_fake_response(200, {"reviews": reviews}))
    result = await main.fetch_stop_reviews(client, "place123")

    snippets = result.split(" | ")
    assert len(snippets) == 3
    assert len(snippets[0].split()) == 100
    assert snippets[1] == "short english review"
    assert snippets[2] == "another english review"


@pytest.mark.asyncio
async def test_fetch_stop_reviews_non_200_returns_empty_string():
    client = Mock()
    client.get = AsyncMock(return_value=_fake_response(500, {}))
    result = await main.fetch_stop_reviews(client, "place123")
    assert result == ""


@pytest.mark.asyncio
async def test_fetch_stop_reviews_exception_returns_empty_string():
    client = Mock()
    client.get = AsyncMock(side_effect=Exception("network down"))
    result = await main.fetch_stop_reviews(client, "place123")
    assert result == ""


# --- generate_clue -------------------------------------------------------------

def _fake_groq_response(content):
    return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=content))])


@pytest.mark.asyncio
async def test_generate_clue_success_calls_groq_and_returns_content():
    stop = {"name": "Secret Cafe", "category": "food", "vibe": "Coffee", "price_level": 2}
    with patch.object(
        main.groq_client.chat.completions, "create",
        new=AsyncMock(return_value=_fake_groq_response("  A mysterious clue.  ")),
    ) as mock_create:
        result = await main.generate_clue(stop)

    assert result == "A mysterious clue."
    _, kwargs = mock_create.call_args
    assert kwargs["model"] == "llama-3.3-70b-versatile"
    assert kwargs["max_tokens"] == 120
    assert kwargs["temperature"] == 0.85


@pytest.mark.asyncio
async def test_generate_clue_exception_falls_back_to_fallback_clues():
    stop = {"name": "Secret Cafe", "category": "food", "vibe": "Coffee", "price_level": 2}
    with patch.object(
        main.groq_client.chat.completions, "create",
        new=AsyncMock(side_effect=Exception("groq down")),
    ):
        result = await main.generate_clue(stop)
    assert result == main.FALLBACK_CLUES[("food", "Coffee")]


@pytest.mark.asyncio
async def test_generate_clue_exception_unknown_category_vibe_uses_generic_fallback():
    stop = {"name": "Odd Stop", "category": "activity", "vibe": "Coffee", "price_level": 1}
    with patch.object(
        main.groq_client.chat.completions, "create",
        new=AsyncMock(side_effect=Exception("groq down")),
    ):
        result = await main.generate_clue(stop)
    assert result == "Something unexpected awaits. Keep walking."


# GET /

def test_root_returns_status_running(client):
    resp = client.get("/")
    assert resp.status_code == 200
    assert resp.json() == {"status": "Routlette backend is running"}


# GET /generate-route 

def _big_synthetic_df():
    """A larger synthetic venue pool with enough spread across ratings/rating_counts
    to produce non-empty results under every mode's threshold table, all located at
    the same base coordinate (0m apart) so walking radius never excludes anything.
    """
    base_lat, base_lng = 1.3000, 103.8500
    rows = []

    def add(name, category, primary_type, rating, rating_count, price_level=2):
        rows.append({
            "place_id": f"pid-{name}", "name": name, "category": category,
            "primary_type": primary_type, "address": f"{name} Rd",
            "lat": base_lat, "lng": base_lng, "price_level": price_level,
            "rating": rating, "rating_count": rating_count, "neighbourhood": "Testville",
        })

    # Food (cafe -> Coffee), spread across safe/balanced/chaotic thresholds
    add("FoodSafe1", "food", "cafe", 4.6, 60)
    add("FoodSafe2", "food", "cafe", 4.5, 80)
    add("FoodBalancedOnly1", "food", "cafe", 4.1, 100)
    add("FoodBalancedOnly2", "food", "cafe", 4.2, 200)
    add("FoodChaoticOnly1", "food", "cafe", 3.6, 50)
    add("FoodChaoticOnly2", "food", "cafe", 3.7, 20)

    # Activity (museum -> Culture)
    add("ActSafe1", "activity", "museum", 4.7, 45)
    add("ActSafe2", "activity", "museum", 4.4, 90)
    add("ActBalancedOnly1", "activity", "museum", 4.1, 100)
    add("ActBalancedOnly2", "activity", "museum", 4.2, 200)
    add("ActChaoticOnly1", "activity", "museum", 3.6, 300)
    add("ActChaoticOnly2", "activity", "museum", 3.8, 400)

    return pd.DataFrame(rows)


@pytest.fixture
def mocked_generation(monkeypatch):
    """Patches main.df with a rich synthetic pool and stubs out the two external-call
    layers (Groq clue generation, sentiment reranking) so /generate-route tests are
    fast, deterministic, and make no real network calls.
    """
    monkeypatch.setattr(main, "df", _big_synthetic_df())

    async def fake_generate_clue(stop):
        return "A mysterious clue."

    async def fake_apply_sentiment_and_rank(pool_df, api_key):
        result = pool_df.copy()
        result["sentiment_score"] = 0.5
        result["final_combined_score"] = result["gem_score"]
        return result

    with patch.object(main, "generate_clue", new=AsyncMock(side_effect=fake_generate_clue)), \
         patch.object(main, "apply_sentiment_and_rank", new=AsyncMock(side_effect=fake_apply_sentiment_and_rank)) as mock_sentiment:
        yield mock_sentiment


BASE_PARAMS = {"lat": 1.3000, "lng": 103.8500, "budget": 2, "walking": 5}


def test_generate_route_default_params_returns_200_with_stops(client, mocked_generation):
    resp = client.get("/generate-route", params=BASE_PARAMS)
    assert resp.status_code == 200
    body = resp.json()
    assert "stops" in body
    assert 0 < len(body["stops"]) <= 3  # default num_food=2 + num_activities=1
    for stop in body["stops"]:
        for key in ("name", "category", "vibe", "address", "lat", "lng", "price_level", "score", "clue", "side_quest"):
            assert key in stop
        assert "place_id" not in stop
        assert "review_snippets" not in stop


def test_generate_route_mode_chaotic_skips_sentiment_ranking(client, mocked_generation):
    resp = client.get("/generate-route", params={**BASE_PARAMS, "mode": "chaotic"})
    assert resp.status_code == 200
    mocked_generation.assert_not_called()


@pytest.mark.parametrize("mode", ["balanced", "safe"])
def test_generate_route_mode_balanced_or_safe_calls_sentiment_ranking(client, mocked_generation, mode):
    resp = client.get("/generate-route", params={**BASE_PARAMS, "mode": mode})
    assert resp.status_code == 200
    mocked_generation.assert_called()


def test_generate_route_num_food_and_num_activities_control_stop_count(client, mocked_generation):
    resp = client.get("/generate-route", params={**BASE_PARAMS, "num_food": 1, "num_activities": 1})
    assert resp.status_code == 200
    assert len(resp.json()["stops"]) <= 2

    resp2 = client.get("/generate-route", params={**BASE_PARAMS, "num_food": 3, "num_activities": 2})
    assert resp2.status_code == 200
    assert len(resp2.json()["stops"]) <= 5


def test_generate_route_empty_filter_pool_returns_200_with_error_key(client):
    # Real static venues.csv covers central Singapore only — the endpoint's own
    # default lat/lng (NUS) falls outside the walking radius of any real venue,
    # so leaving lat/lng at their defaults naturally yields an empty pool.
    resp = client.get("/generate-route")
    assert resp.status_code == 200
    body = resp.json()
    assert body["stops"] == []
    assert "error" in body


def test_generate_route_unauthenticated_request_uses_guest_user_id(client, mocked_generation):
    resp = client.get("/generate-route", params=BASE_PARAMS)
    assert resp.status_code == 200


def test_generate_route_invalid_bearer_token_returns_401(client, mocked_generation):
    resp = client.get("/generate-route", params=BASE_PARAMS, headers={"Authorization": "not-bearer"})
    assert resp.status_code == 401


def test_generate_route_budget_out_of_range_returns_422(client):
    resp = client.get("/generate-route", params={**BASE_PARAMS, "budget": 5})
    assert resp.status_code == 422


def test_generate_route_invalid_mode_returns_422(client):
    resp = client.get("/generate-route", params={**BASE_PARAMS, "mode": "invalid_mode"})
    assert resp.status_code == 422


def test_rate_limit_returns_429_after_10_requests_per_minute(client):
    # `client` fixture already reset the limiter, giving this test a clean bucket.
    # Uses the real static dataset with default (empty-pool) params so no clue/
    # sentiment mocking is needed — every call still counts against the limiter.
    for _ in range(10):
        resp = client.get("/generate-route")
        assert resp.status_code == 200

    resp = client.get("/generate-route")
    assert resp.status_code == 429
