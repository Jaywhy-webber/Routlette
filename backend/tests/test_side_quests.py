import pytest

from side_quests import (
    get_side_quest,
    SIDE_QUESTS,
    GENERAL_FOOD_QUESTS,
    GENERAL_ACTIVITY_QUESTS,
)


@pytest.mark.parametrize("primary_type", list(SIDE_QUESTS.keys()))
def test_get_side_quest_known_type_returns_from_matching_list(primary_type):
    result = get_side_quest(primary_type, category="food")
    assert result in SIDE_QUESTS[primary_type]


def test_get_side_quest_cleans_bracketed_input():
    result = get_side_quest("['park']", category="activity")
    assert result in SIDE_QUESTS["park"]


def test_get_side_quest_cleans_comma_separated_input():
    result = get_side_quest("cafe, bakery", category="food")
    assert result in SIDE_QUESTS["cafe"]


def test_get_side_quest_unknown_type_food_falls_back_to_general_food_quests():
    result = get_side_quest("unknown_type", category="food")
    assert result in GENERAL_FOOD_QUESTS


def test_get_side_quest_unknown_type_activity_falls_back_to_general_activity_quests():
    result = get_side_quest("unknown_type", category="activity")
    assert result in GENERAL_ACTIVITY_QUESTS
