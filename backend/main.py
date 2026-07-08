from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import pandas as pd
import random
import os
import asyncio
import httpx
from groq import AsyncGroq
from dotenv import load_dotenv
from filter import apply_filters
from side_quests import get_side_quest

load_dotenv()
groq_client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))
GOOGLE_PLACES_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")
USE_LIVE_API = os.getenv("USE_LIVE_API", "false").lower() == "true"

app = FastAPI()

# Allows the React Native frontend to talk to this server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:8081", "http://10.0.2.2:8081", "http://192.168.1.11:8081"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the CSV dataset once on startup
df = pd.read_csv("venues.csv")

# Vibe buckets available for each category
FOOD_VIBES = ["Fuel Stop", "Quick & Local", "Main Event"]
ACTIVITY_VIBES = ["Culture", "Outdoors", "Urban Adventure"]

# Live API: broad search types that map to the above vibe buckets via VIBE_MAPPING
FOOD_TYPES = ["restaurant", "cafe", "food_court", "bakery", "bar", "hawker_centre"]
ACTIVITY_TYPES = ["tourist_attraction", "museum", "park", "art_gallery", "movie_theater"]

PRICE_LEVEL_MAP = {
    "PRICE_LEVEL_FREE": 1, "PRICE_LEVEL_INEXPENSIVE": 1,
    "PRICE_LEVEL_MODERATE": 2, "PRICE_LEVEL_EXPENSIVE": 3,
    "PRICE_LEVEL_VERY_EXPENSIVE": 4,
}

WALKING_MAP = {1: 300, 2: 600, 3: 1000, 4: 1500, 5: 2000}

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


PLACES_FIELD_MASK = (
    "places.id,places.displayName,places.formattedAddress,"
    "places.location,places.primaryType,places.rating,"
    "places.userRatingCount,places.priceLevel,places.businessStatus"
)


async def fetch_live_venues(lat: float, lng: float, radius_m: int) -> pd.DataFrame:
    url = "https://places.googleapis.com/v1/places:searchNearby"
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": PLACES_FIELD_MASK,
    }

    def build_body(types: list) -> dict:
        return {
            "includedTypes": types,
            "maxResultCount": 20,
            "locationRestriction": {
                "circle": {
                    "center": {"latitude": lat, "longitude": lng},
                    "radius": float(radius_m),
                }
            },
        }

    def parse_places(data: dict, category: str) -> list:
        rows = []
        for p in data.get("places", []):
            if p.get("businessStatus") != "OPERATIONAL":
                continue
            rows.append({
                "place_id": p.get("id", ""),
                "name": p.get("displayName", {}).get("text", ""),
                "category": category,
                "primary_type": p.get("primaryType", ""),
                "address": p.get("formattedAddress", ""),
                "lat": p.get("location", {}).get("latitude", 0.0),
                "lng": p.get("location", {}).get("longitude", 0.0),
                "price_level": PRICE_LEVEL_MAP.get(p.get("priceLevel", ""), 2),
                "rating": p.get("rating", None),
                "rating_count": p.get("userRatingCount", None),
            })
        return rows

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            food_resp, activity_resp = await asyncio.gather(
                client.post(url, headers=headers, json=build_body(FOOD_TYPES)),
                client.post(url, headers=headers, json=build_body(ACTIVITY_TYPES)),
            )
        rows = (
            parse_places(food_resp.json(), "food")
            + parse_places(activity_resp.json(), "activity")
        )
        return pd.DataFrame(rows) if rows else pd.DataFrame()
    except Exception as e:
        print(f"fetch_live_venues error: {e}")
        return pd.DataFrame()


async def fetch_stop_reviews(client: httpx.AsyncClient, place_id: str) -> str:
    try:
        url = f"https://places.googleapis.com/v1/places/{place_id}"
        resp = await client.get(
            url,
            headers={"X-Goog-Api-Key": GOOGLE_PLACES_API_KEY, "X-Goog-FieldMask": "reviews"},
            timeout=8.0,
        )
        if resp.status_code != 200:
            return ""
        reviews = resp.json().get("reviews", [])
        snippets = []
        for review in reviews:
            text_obj = review.get("text", {})
            if text_obj.get("languageCode") != "en":
                continue
            text = text_obj.get("text", "").strip()
            if not text:
                continue
            snippets.append(" ".join(text.split()[:100]))
            if len(snippets) >= 3:
                break
        return " | ".join(snippets)
    except Exception:
        return ""


FALLBACK_CLUES = {
    ("food", "Fuel Stop"): "A quiet corner awaits where warmth is served in a cup and time slows down. Follow the scent.",
    ("food", "Quick & Local"): "Something honest and unpretentious is waiting — the kind of place locals return to without thinking twice.",
    ("food", "Main Event"): "Your next stop deserves a seat at the table. An experience worth the walk is just ahead.",
    ("food", "Social Hour"): "The night has its own rhythm here. Find where the glasses clink and conversations carry.",
    ("activity", "Culture"): "Step somewhere that holds more than meets the eye. Let the space speak before you do.",
    ("activity", "Outdoors"): "The city fades and something greener takes its place. Breathe it in when you arrive.",
    ("activity", "Urban Adventure"): "Look for what others walk past. Your destination rewards those who pay attention.",
}

async def generate_clue(stop: dict) -> str:
    try:
        review_section = ""
        if stop.get("review_snippets"):
            review_section = (
                f"\nReal visitor impressions (use these for atmosphere and sensory detail — "
                f"do NOT quote directly or name the venue):\n{stop['review_snippets']}\n"
            )

        user_content = (
            f"Write a clue for this stop:\n"
            f"Venue name (hidden context only — do NOT reveal this in the clue): {stop['name']}\n"
            f"Category: {stop['category']}\n"
            f"Vibe: {stop['vibe']}\n"
            f"Price level: {'$' * stop['price_level']}\n"
            f"{review_section}\n"
            "Keep it to 2-3 sentences. Be mysterious and enticing. "
            "Do not name the venue, its street, or quote reviews verbatim."
        )

        response = await groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a mystery guide for a surprise adventure in Singapore. "
                        "Your job is to write short, evocative clues (2-3 sentences) that hint at a destination "
                        "without revealing its name, street, or address. "
                        "Use any visitor impressions provided as raw material for atmosphere and sensory detail — "
                        "extract the feeling, not the facts. "
                        "Never mention the venue name or any navigational directions."
                    ),
                },
                {
                    "role": "user",
                    "content": user_content,
                },
            ],
            max_tokens=120,
            temperature=0.85,
        )
        return response.choices[0].message.content.strip()
    except Exception:
        return FALLBACK_CLUES.get((stop["category"], stop["vibe"]), "Something unexpected awaits. Keep walking.")


@app.get("/")
def root():
    return {"status": "Routlette backend is running"}


@app.get("/generate-route")
async def generate_route(
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
    if USE_LIVE_API:
        radius_m = WALKING_MAP[walking]
        live_df = await fetch_live_venues(lat, lng, radius_m)
        if live_df.empty:
            return {"stops": [], "mode": mode, "error": "Could not fetch venues — check API key or try again."}
        filtered = apply_filters(live_df, lat, lng, budget, "both", walking)
    else:
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
            "place_id": str(pick["place_id"]) if "place_id" in pick.index else "",
            "name": pick["name"],
            "category": pick["category"],
            "vibe": vibe,
            "address": pick["address"],
            "lat": float(pick["lat"]),
            "lng": float(pick["lng"]),
            "price_level": int(pick["price_level"]),
            "score": round(float(pick["score"]), 3),
            "review_snippets": pick["review_snippets"] if "review_snippets" in pick.index and pd.notna(pick.get("review_snippets")) else "",
            "side_quest": get_side_quest(pick.get("primary_type", ""), pick["category"])
        })
        # Remove selected venue so it won't be picked again
        remaining = remaining[remaining["name"] != pick["name"]]

    if USE_LIVE_API and stops:
        async with httpx.AsyncClient() as client:
            fetched_reviews = await asyncio.gather(
                *[fetch_stop_reviews(client, s["place_id"]) for s in stops]
            )
        for stop, review in zip(stops, fetched_reviews):
            stop.get["review_snippets"] = review

    clues = await asyncio.gather(*[generate_clue(stop) for stop in stops])
    for stop, clue in zip(stops, clues):
        stop["clue"] = clue
        stop.pop("review_snippets", None)
        stop.pop("place_id", None)

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
