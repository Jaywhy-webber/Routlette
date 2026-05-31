from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import pandas as pd
import random
from filter import apply_filters

app = FastAPI()

# Allows the React Native frontend to talk to this server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:8081", "http://10.0.2.2:8081", "http://192.168.1.12:8081"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the CSV dataset once on startup
df = pd.read_csv("venues.csv")

# Vibe buckets available for each category
FOOD_VIBES = ["Fuel Stop", "Quick & Local", "Main Event"]
ACTIVITY_VIBES = ["Culture", "Outdoors", "Urban Adventure"]

# Maps each Google Places primary_type to a vibe bucket
VIBE_MAPPING = {
    # quick meal (cafe, coffee, pastries etc)
    'acai_shop': 'Fuel Stop', 'bagel_shop': 'Fuel Stop', 'bakery': 'Fuel Stop',
    'cake_shop': 'Fuel Stop', 'candy_store': 'Fuel Stop', 'cat_cafe': 'Fuel Stop',
    'chocolate_factory': 'Fuel Stop', 'chocolate_shop': 'Fuel Stop', 'coffee_roastery': 'Fuel Stop',
    'coffee_shop': 'Fuel Stop', 'coffee_stand': 'Fuel Stop', 'confectionery': 'Fuel Stop',
    'deli': 'Fuel Stop', 'dessert_restaurant': 'Fuel Stop', 'dessert_shop': 'Fuel Stop',
    'dog_cafe': 'Fuel Stop', 'donut_shop': 'Fuel Stop', 'ice_cream_shop': 'Fuel Stop',
    'juice_shop': 'Fuel Stop', 'pastry_shop': 'Fuel Stop', 'salad_shop': 'Fuel Stop',
    'sandwich_shop': 'Fuel Stop', 'snack_bar': 'Fuel Stop', 'soup_restaurant': 'Fuel Stop',
    'tea_house': 'Fuel Stop', 'cafe': 'Fuel Stop',

    # full meal (actual restaurants)
    'afghani_restaurant': 'Main Event', 'african_restaurant': 'Main Event', 'american_restaurant': 'Main Event',
    'argentinian_restaurant': 'Main Event', 'asian_fusion_restaurant': 'Main Event', 'asian_restaurant': 'Main Event',
    'australian_restaurant': 'Main Event', 'austrian_restaurant': 'Main Event', 'bangladeshi_restaurant': 'Main Event',
    'basque_restaurant': 'Main Event', 'bavarian_restaurant': 'Main Event', 'belgian_restaurant': 'Main Event',
    'bistro': 'Main Event', 'brazilian_restaurant': 'Main Event', 'breakfast_restaurant': 'Main Event',
    'british_restaurant': 'Main Event', 'brunch_restaurant': 'Main Event', 'buffet_restaurant': 'Main Event',
    'burmese_restaurant': 'Main Event', 'cafeteria': 'Main Event', 'cajun_restaurant': 'Main Event',
    'californian_restaurant': 'Main Event', 'cambodian_restaurant': 'Main Event', 'cantonese_restaurant': 'Main Event',
    'caribbean_restaurant': 'Main Event', 'chilean_restaurant': 'Main Event', 'chinese_noodle_restaurant': 'Main Event',
    'chinese_restaurant': 'Main Event', 'colombian_restaurant': 'Main Event', 'croatian_restaurant': 'Main Event',
    'cuban_restaurant': 'Main Event', 'czech_restaurant': 'Main Event', 'danish_restaurant': 'Main Event',
    'dim_sum_restaurant': 'Main Event', 'diner': 'Main Event', 'dutch_restaurant': 'Main Event',
    'eastern_european_restaurant': 'Main Event', 'ethiopian_restaurant': 'Main Event', 'european_restaurant': 'Main Event',
    'family_restaurant': 'Main Event', 'filipino_restaurant': 'Main Event', 'fine_dining_restaurant': 'Main Event',
    'food_court': 'Main Event', 'french_restaurant': 'Main Event', 'fusion_restaurant': 'Main Event',
    'german_restaurant': 'Main Event', 'greek_restaurant': 'Main Event', 'hawaiian_restaurant': 'Main Event',
    'hot_pot_restaurant': 'Main Event', 'hungarian_restaurant': 'Main Event', 'indian_restaurant': 'Main Event',
    'indonesian_restaurant': 'Main Event', 'irish_restaurant': 'Main Event', 'israeli_restaurant': 'Main Event',
    'italian_restaurant': 'Main Event', 'japanese_curry_restaurant': 'Main Event', 'japanese_izakaya_restaurant': 'Main Event',
    'japanese_restaurant': 'Main Event', 'korean_barbecue_restaurant': 'Main Event', 'korean_restaurant': 'Main Event',
    'latin_american_restaurant': 'Main Event', 'lebanese_restaurant': 'Main Event', 'malaysian_restaurant': 'Main Event',
    'mediterranean_restaurant': 'Main Event', 'mexican_restaurant': 'Main Event', 'middle_eastern_restaurant': 'Main Event',
    'mongolian_barbecue_restaurant': 'Main Event', 'moroccan_restaurant': 'Main Event', 'north_indian_restaurant': 'Main Event',
    'pakistani_restaurant': 'Main Event', 'persian_restaurant': 'Main Event', 'peruvian_restaurant': 'Main Event',
    'polish_restaurant': 'Main Event', 'portuguese_restaurant': 'Main Event', 'restaurant': 'Main Event',
    'romanian_restaurant': 'Main Event', 'russian_restaurant': 'Main Event', 'scandinavian_restaurant': 'Main Event',
    'seafood_restaurant': 'Main Event', 'south_american_restaurant': 'Main Event', 'south_indian_restaurant': 'Main Event',
    'southwestern_us_restaurant': 'Main Event', 'spanish_restaurant': 'Main Event', 'sri_lankan_restaurant': 'Main Event',
    'steak_house': 'Main Event', 'sushi_restaurant': 'Main Event', 'swiss_restaurant': 'Main Event',
    'taiwanese_restaurant': 'Main Event', 'tapas_restaurant': 'Main Event', 'thai_restaurant': 'Main Event',
    'tibetan_restaurant': 'Main Event', 'turkish_restaurant': 'Main Event', 'ukrainian_restaurant': 'Main Event',
    'vegan_restaurant': 'Main Event', 'vegetarian_restaurant': 'Main Event', 'vietnamese_restaurant': 'Main Event',
    'western_restaurant': 'Main Event',

    # drinks etc
    'bar': 'Social Hour', 'bar_and_grill': 'Social Hour', 'beer_garden': 'Social Hour',
    'brewery': 'Social Hour', 'brewpub': 'Social Hour', 'cocktail_bar': 'Social Hour',
    'gastropub': 'Social Hour', 'hookah_bar': 'Social Hour', 'irish_pub': 'Social Hour',
    'lounge_bar': 'Social Hour', 'oyster_bar_restaurant': 'Social Hour', 'pub': 'Social Hour',
    'sports_bar': 'Social Hour', 'wine_bar': 'Social Hour', 'winery': 'Social Hour',

    # quick local bites
    'barbecue_restaurant': 'Quick & Local', 'burrito_restaurant': 'Quick & Local', 'chicken_restaurant': 'Quick & Local',
    'chicken_wings_restaurant': 'Quick & Local', 'dumpling_restaurant': 'Quick & Local', 'falafel_restaurant': 'Quick & Local',
    'fast_food_restaurant': 'Quick & Local', 'fish_and_chips_restaurant': 'Quick & Local', 'fondue_restaurant': 'Quick & Local',
    'gyro_restaurant': 'Quick & Local', 'halal_restaurant': 'Quick & Local', 'hamburger_restaurant': 'Quick & Local',
    'hot_dog_restaurant': 'Quick & Local', 'hot_dog_stand': 'Quick & Local', 'kebab_shop': 'Quick & Local',
    'meal_delivery': 'Quick & Local', 'meal_takeaway': 'Quick & Local', 'noodle_shop': 'Quick & Local',
    'pizza_delivery': 'Quick & Local', 'pizza_restaurant': 'Quick & Local', 'ramen_restaurant': 'Quick & Local',
    'shawarma_restaurant': 'Quick & Local', 'soul_food_restaurant': 'Quick & Local', 'taco_restaurant': 'Quick & Local',
    'tonkatsu_restaurant': 'Quick & Local', 'yakiniku_restaurant': 'Quick & Local', 'yakitori_restaurant': 'Quick & Local',

    # culture
    'art_gallery': 'Culture', 'museum': 'Culture', 'library': 'Culture', 'cultural_center': 'Culture',
    'planetarium': 'Culture', 'aquarium': 'Culture',

    # outdoors
    'park': 'Outdoors', 'garden': 'Outdoors', 'hiking_area': 'Outdoors', 'dog_park': 'Outdoors',
    'zoo': 'Outdoors', 'nature_reserve': 'Outdoors', 'national_park': 'Outdoors',

    # urban
    'tourist_attraction': 'Urban Adventure', 'landmark': 'Urban Adventure', 'historical_landmark': 'Urban Adventure',
    'movie_theater': 'Urban Adventure', 'bowling_alley': 'Urban Adventure', 'amusement_park': 'Urban Adventure',
}


def get_vibe(primary_type) -> str:
    # clean before lookup
    clean = str(primary_type).strip("[]'\" ").split(',')[0].strip()
    return VIBE_MAPPING.get(clean, "Other")


@app.get("/")
def root():
    return {"status": "Routlette backend is running"}


@app.get("/generate-route")
def generate_route(
    lat: float = Query(default=1.2966),
    lng: float = Query(default=103.7764),
    budget: int = Query(default=2, ge=1, le=4),
    walking: int = Query(default=5, ge=1, le=5),
    mode: str = Query(default="balanced"),
    # User-selected vibe buckets — repeated query params e.g. ?food_vibes=Fuel+Stop&food_vibes=Main+Event
    food_vibes: List[str] = Query(default=FOOD_VIBES),
    activity_vibes: List[str] = Query(default=ACTIVITY_VIBES),
):
    # Run the filter pipeline: exclude bad types, enforce budget, clip by radius
    # Pass category="both" so both food and activity venues are included
    filtered = apply_filters(df, lat, lng, budget, "both", walking)

    if filtered.empty:
        return {"stops": [], "mode": mode, "error": "No venues match your filters — try relaxing the radius or budget."}

    # Assign vibe bucket to every venue
    filtered["vibe"] = filtered["primary_type"].apply(get_vibe)

    # Score each venue using gem scoring (rating quality + mystery) blended with mode randomness
    filtered["score"] = filtered.apply(lambda row: score_venue(row, mode), axis=1)

    # Pick 2 distinct food vibes from the user's selection (guarantees variety across both food stops)
    available_food_vibes = [v for v in food_vibes if v in FOOD_VIBES]
    if not available_food_vibes:
        available_food_vibes = FOOD_VIBES  # fall back to all if selection was invalid

    if len(available_food_vibes) >= 2:
        food_vibe_1, food_vibe_2 = random.sample(available_food_vibes, 2)
    else:
        # Only 1 vibe selected — use it for both food stops
        food_vibe_1 = food_vibe_2 = available_food_vibes[0]

    available_activity_vibes = [v for v in activity_vibes if v in ACTIVITY_VIBES]
    if not available_activity_vibes:
        available_activity_vibes = ACTIVITY_VIBES

    activity_vibe = random.choice(available_activity_vibes)

    # Sequence: food (vibe 1) → activity → food (vibe 2)
    sequence = [
        ("food", food_vibe_1),
        ("activity", activity_vibe),
        ("food", food_vibe_2),
    ]

    stops = []
    remaining = filtered.copy()
    for cat, vibe in sequence:
        # Try the target vibe first -> fall back to any venue in the category if no match
        pool = remaining[(remaining["category"] == cat) & (remaining["vibe"] == vibe)]
        if pool.empty:
            pool = remaining[remaining["category"] == cat]
        if pool.empty:
            continue

        # Pick one of the top-5 scorers
        pick = pool.nlargest(5, "score").sample(1).iloc[0]
        stops.append({
            "name": pick["name"],
            "category": pick["category"],
            "vibe": vibe,
            "address": pick["address"],
            "lat": float(pick["lat"]),
            "lng": float(pick["lng"]),
            "price_level": int(pick["price_level"]),
            "score": round(float(pick["score"]), 3),
        })
        # Remove selected venue so it won't be picked again
        remaining = remaining[remaining["name"] != pick["name"]]

    return {"stops": stops, "mode": mode}


def score_venue(row, mode: str) -> float:
    rating = float(row["rating"])  # guaranteed non-null by apply_filters
    rating_count = float(row["rating_count"]) if pd.notna(row.get("rating_count")) else 100.0

    # Gem scoring from scoring.py:
    # rating_perf_score rewards quality above 4.0; mystery_score rewards lesser-known venues
    rating_perf_score = max(0.0, (rating - 4.0) / 1.0)
    mystery_score = max(0.0, min(1.0, 1.0 - ((rating_count - 10) / 290)))
    gem_score = (rating_perf_score * 0.6) + (mystery_score * 0.4)

    # Blend gem score with randomness — mode controls how much to trust quality vs surprise
    rand_weight = {"safe": 0.2, "balanced": 0.5, "chaotic": 0.9}.get(mode, 0.5)
    return gem_score * (1 - rand_weight) + random.random() * rand_weight
