from unittest.mock import AsyncMock, Mock, patch

import pandas as pd
import pytest
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

import main
import scoring
from scoring import apply_sentiment_and_rank, fetch_single_review_text


# main.score_venue

def _row(rating, rating_count):
    return {"rating": rating, "rating_count": rating_count}


def test_score_venue_known_value_formula():
    row = _row(rating=4.8, rating_count=500)
    # rating_perf = (4.8-4.0)/1.0 = 0.8 ; mystery = clamp(1-(500-10)/290) = 0.0
    expected = (0.8 * 0.6) + (0.0 * 0.4)
    assert main.score_venue(row) == pytest.approx(expected)


def test_score_venue_low_rating_clamps_perf_to_zero():
    row = _row(rating=3.5, rating_count=10)
    # rating_perf clamps to 0 ; mystery = clamp(1-(10-10)/290) = 1.0
    expected = (0.0 * 0.6) + (1.0 * 0.4)
    assert main.score_venue(row) == pytest.approx(expected)


def test_score_venue_low_rating_count_maximizes_mystery():
    row = _row(rating=4.0, rating_count=10)
    assert main.score_venue(row) == pytest.approx(0.4)


def test_score_venue_missing_rating_count_defaults_to_100():
    row_missing = {"rating": 4.5, "rating_count": float("nan")}
    row_explicit = {"rating": 4.5, "rating_count": 100.0}
    assert main.score_venue(row_missing) == pytest.approx(main.score_venue(row_explicit))


def test_score_venue_rating_count_clamped_at_upper_bound():
    row = _row(rating=4.0, rating_count=1000)  # would go negative without clamp
    # mystery = clamp(1-(1000-10)/290) -> clamps to 0.0
    assert main.score_venue(row) == pytest.approx(0.0)


# scoring.fetch_single_review_text

def _fake_response(status_code, json_data):
    resp = Mock()
    resp.status_code = status_code
    resp.json = Mock(return_value=json_data)
    return resp


@pytest.mark.asyncio
async def test_fetch_single_review_text_success_concatenates_reviews():
    client = Mock()
    client.get = AsyncMock(return_value=_fake_response(200, {
        "reviews": [{"text": {"text": "Great place"}}, {"text": {"text": "Loved it"}}]
    }))
    result = await fetch_single_review_text(client, "place123", "fake-key")
    assert result == "Great place Loved it"


@pytest.mark.asyncio
async def test_fetch_single_review_text_non_200_returns_empty_string():
    client = Mock()
    client.get = AsyncMock(return_value=_fake_response(500, {}))
    result = await fetch_single_review_text(client, "place123", "fake-key")
    assert result == ""


@pytest.mark.asyncio
async def test_fetch_single_review_text_exception_returns_empty_string():
    client = Mock()
    client.get = AsyncMock(side_effect=Exception("network down"))
    result = await fetch_single_review_text(client, "place123", "fake-key")
    assert result == ""


# scoring.apply_sentiment_and_rank

@pytest.mark.asyncio
async def test_apply_sentiment_and_rank_empty_df_short_circuits():
    empty_df = pd.DataFrame()
    with patch.object(scoring, "fetch_single_review_text", new=AsyncMock()) as mock_fetch:
        result = await apply_sentiment_and_rank(empty_df, "fake-key")
    assert result.empty
    mock_fetch.assert_not_called()


@pytest.mark.asyncio
async def test_apply_sentiment_and_rank_blank_review_text_defaults_sentiment_to_half():
    df = pd.DataFrame([{"place_id": "p1", "gem_score": 0.5}])
    with patch.object(scoring, "fetch_single_review_text", new=AsyncMock(return_value="")):
        result = await apply_sentiment_and_rank(df, "fake-key")
    assert result.iloc[0]["sentiment_score"] == pytest.approx(0.5)


@pytest.mark.asyncio
async def test_apply_sentiment_and_rank_positive_review_text_scores_above_half():
    df = pd.DataFrame([{"place_id": "p1", "gem_score": 0.5}])
    positive_text = "Absolutely amazing wonderful incredible experience!"
    with patch.object(scoring, "fetch_single_review_text", new=AsyncMock(return_value=positive_text)):
        result = await apply_sentiment_and_rank(df, "fake-key")
    assert result.iloc[0]["sentiment_score"] > 0.5


@pytest.mark.asyncio
async def test_apply_sentiment_and_rank_final_score_blend_formula():
    text = "Absolutely amazing wonderful incredible experience!"
    expected_sentiment = SentimentIntensityAnalyzer().polarity_scores(text)["compound"]
    gem_score = 0.6
    df = pd.DataFrame([{"place_id": "p1", "gem_score": gem_score}])
    with patch.object(scoring, "fetch_single_review_text", new=AsyncMock(return_value=text)):
        result = await apply_sentiment_and_rank(df, "fake-key")
    expected_final = gem_score * 0.8 + expected_sentiment * 0.2
    assert result.iloc[0]["final_combined_score"] == pytest.approx(expected_final)


@pytest.mark.asyncio
async def test_apply_sentiment_and_rank_sorts_descending_by_final_score():
    df = pd.DataFrame([
        {"place_id": "low", "gem_score": 0.1},
        {"place_id": "high", "gem_score": 0.9},
        {"place_id": "mid", "gem_score": 0.5},
    ])
    with patch.object(scoring, "fetch_single_review_text", new=AsyncMock(return_value="")):
        result = await apply_sentiment_and_rank(df, "fake-key")
    assert list(result["place_id"]) == ["high", "mid", "low"]
