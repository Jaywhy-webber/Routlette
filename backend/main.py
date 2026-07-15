from fastapi import FastAPI, Query, Depends, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from starlette.requests import Request
from typing import List, Literal
import jwt as pyjwt
from jwt import PyJWKClient
import pandas as pd
import random
import os
import asyncio
import httpx
from groq import AsyncGroq
from dotenv import load_dotenv
from filter import apply_filters, WALKING_MAP
from side_quests import get_side_quest
from scoring import apply_sentiment_and_rank
from generate_dataset import fetch_robust_live_dataset

load_dotenv()
groq_client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))
GOOGLE_PLACES_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")
USE_LIVE_API = os.getenv("USE_LIVE_API", "false").lower() == "true"
SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("EXPO_PUBLIC_SUPABASE_URL")
_jwks_client = PyJWKClient(f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json") if SUPABASE_URL else None

app = FastAPI()
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

origins = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "*").split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


def verify_token(authorization: str = Header(default=None)) -> str:
    if not _jwks_client:
        return "anonymous"
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization header")
    token = authorization.split(" ", 1)[1]
    try:
        signing_key = _jwks_client.get_signing_key_from_jwt(token)
        payload = pyjwt.decode(
            token, signing_key.key, algorithms=["HS256", "RS256", "ES256"], audience="authenticated"
        )
        return payload["sub"]
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except pyjwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Load the CSV dataset once on startup
df = pd.read_csv("venues.csv")

# Vibe buckets available for each category
FOOD_VIBES = ["Fuel Stop", "Quick & Local", "Main Event", "Social Hour"]
ACTIVITY_VIBES = ["Culture", "Outdoors", "Urban Adventure"]

# Live API: broad search types that map to the above vibe buckets via VIBE_MAPPING
FOOD_TYPES = ["restaurant", "cafe", "food_court", "bakery", "bar", "hawker_centre"]
ACTIVITY_TYPES = ["tourist_attraction", "museum", "park", "art_gallery", "movie_theater"]

PRICE_LEVEL_MAP = {
    "PRICE_LEVEL_FREE": 1, "PRICE_LEVEL_INEXPENSIVE": 1,
    "PRICE_LEVEL_MODERATE": 2, "PRICE_LEVEL_EXPENSIVE": 3,
    "PRICE_LEVEL_VERY_EXPENSIVE": 4,
}

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
@limiter.limit("10/minute")
async def generate_route(
    request: Request,
    lat: float = Query(default=1.2966),
    lng: float = Query(default=103.7764),
    budget: int = Query(default=2, ge=1, le=4),
    walking: int = Query(default=5, ge=1, le=5),
    mode: Literal["safe", "balanced", "chaotic"] = Query(default="balanced"),
    food_vibes: List[str] = Query(default=FOOD_VIBES),
    activity_vibes: List[str] = Query(default=ACTIVITY_VIBES),
    num_food: int = Query(default=2, ge=1, le=3),
    num_activities: int = Query(default=1, ge=1, le=3),
    user_id: str = Depends(verify_token),
):
    # Run the filter pipeline: exclude bad types, enforce budget, clip by radius
    if USE_LIVE_API:
        radius_m = WALKING_MAP.get(walking, 2000)
        print(f"generate_dataset.py running: grid searching over {radius_m}m radius...")
        live_df = await fetch_robust_live_dataset(lat, lng, GOOGLE_PLACES_API_KEY, radius_m)
        if live_df.empty:
            return {"stops": [], "mode": mode, "error": "No venues discovered via live harvesting sweep."}
        filtered = apply_filters(live_df, lat, lng, budget, "both", walking)
    else:
        # fallback to using static venues.csv
        filtered = apply_filters(df, lat, lng, budget, "both", walking)

    if filtered.empty:
        return {"stops": [], "mode": mode, "error": "No venues match your filters — try relaxing the radius or budget."}

    # Assign vibe bucket to every venue
    filtered["vibe"] = filtered["primary_type"].apply(get_vibe)

    # Score each venue using gem scoring (rating quality + mystery) blended with mode randomness
    # hard filters based on adventure modes
    if mode == "safe":
        food_mask = (filtered["category"] == "food") & (filtered["rating"] >= 4.3) & (filtered["rating_count"] >= 40) & (filtered["rating_count"] <= 500)
        activity_mask = (filtered["category"] == "activity") & (filtered["rating"] >= 4.3) & (filtered["rating_count"] >= 40)
        filtered = filtered[food_mask | activity_mask]

    elif mode == "chaotic":
        food_mask = (filtered["category"] == "food") & (filtered["rating"] >= 3.5) & (filtered["rating_count"] <= 100)
        activity_mask = (filtered["category"] == "activity") & (filtered["rating"] >= 3.5) & (filtered["rating_count"] <= 500)
        filtered = filtered[food_mask | activity_mask]

    else:  # balanced
        food_mask = (filtered["category"] == "food") & (filtered["rating"] >= 4.0) & (filtered["rating_count"] >= 15) & (filtered["rating_count"] <= 300)
        activity_mask = (filtered["category"] == "activity") & (filtered["rating"] >= 4.0) & (filtered["rating_count"] >= 15) & (filtered["rating_count"] <= 600)
        filtered = filtered[food_mask | activity_mask]

    # fallback if no results
    if filtered.empty:
        print("Selection pool fell to 0. Relaxing constraints to recover data pools...")
        backup_pool = live_df if (USE_LIVE_API and 'live_df' in locals() and not live_df.empty) else df
        filtered = apply_filters(backup_pool, lat, lng, budget, "both", walking)
        filtered["vibe"] = filtered["primary_type"].apply(get_vibe)
        filtered = filtered[(filtered["rating"] >= 3.8)]  # Lower rating bar slightly to guarantee options

    # calculate objective base scores
    filtered["gem_score"] = filtered.apply(score_venue, axis=1)

    # Select distinct food vibes up to num_food (cycle if user picked fewer vibes than stops)
    available_food_vibes = [v for v in food_vibes if v in FOOD_VIBES] or FOOD_VIBES
    distinct_count = min(num_food, len(available_food_vibes))
    selected_food_vibes = random.sample(available_food_vibes, distinct_count)
    while len(selected_food_vibes) < num_food:
        selected_food_vibes.append(random.choice(available_food_vibes))

    # Select activity vibes (repeats allowed across stops)
    available_activity_vibes = [v for v in activity_vibes if v in ACTIVITY_VIBES] or ACTIVITY_VIBES
    selected_activity_vibes = [random.choice(available_activity_vibes) for _ in range(num_activities)]

    # Interleave food and activity slots, food first: F-A-F-A-F-A...
    food_slots = [("food", v) for v in selected_food_vibes]
    activity_slots = [("activity", v) for v in selected_activity_vibes]
    sequence = []
    fi, ai = 0, 0
    while fi < len(food_slots) or ai < len(activity_slots):
        if fi < len(food_slots):
            sequence.append(food_slots[fi])
            fi += 1
        if ai < len(activity_slots):
            sequence.append(activity_slots[ai])
            ai += 1

    stops = []
    remaining = filtered.copy()
    for cat, vibe in sequence:
        pool = remaining[(remaining["category"] == cat) & (remaining["vibe"] == vibe)]
        if pool.empty:
            pool = remaining[remaining["category"] == cat]
        if pool.empty:
            continue

        # random results sampling
        if mode == "safe":
            # 1. top 4 candidates based on pure base scores
            contenders = pool.nlargest(4, "gem_score")
            # 2. sentiment analysis
            ranked_pool = await apply_sentiment_and_rank(contenders, GOOGLE_PLACES_API_KEY)
            # 3. chose randomly from top 2 results
            pick = ranked_pool.nlargest(2, "final_combined_score").sample(1).iloc[0]

        elif mode == "chaotic":
            # complete randomness, skips sentiment analysis completely
            pick = pool.sample(1).iloc[0]

        else:  # balanced
            # 1. top 4 candidates based on pure base scores
            contenders = pool.nlargest(6, "gem_score")
            # 2. sentiment analysis
            ranked_pool = await apply_sentiment_and_rank(contenders, GOOGLE_PLACES_API_KEY)
            # 3. chose randomly from top 4 results
            pick = ranked_pool.nlargest(4, "final_combined_score").sample(1).iloc[0]

        stops.append({
            "place_id": str(pick["place_id"]) if "place_id" in pick.index else "",
            "name": pick["name"],
            "category": pick["category"],
            "vibe": vibe,
            "address": pick["address"],
            "lat": float(pick["lat"]),
            "lng": float(pick["lng"]),
            "price_level": int(pick["price_level"]),
            "score": round(float(pick.get("final_combined_score", pick["gem_score"])), 3),
            "review_snippets": pick["review_snippets"] if "review_snippets" in pick.index and pd.notna(
                pick.get("review_snippets")) else "",
            "side_quest": get_side_quest(pick.get("primary_type", ""), pick["category"])
        })
        remaining = remaining[remaining["name"] != pick["name"]]

    if USE_LIVE_API and stops:
        async with httpx.AsyncClient() as client:
            fetched_reviews = await asyncio.gather(
                *[fetch_stop_reviews(client, s["place_id"]) for s in stops]
            )
        for stop, review in zip(stops, fetched_reviews):
            stop["review_snippets"] = review

    clues = await asyncio.gather(*[generate_clue(stop) for stop in stops])
    for stop, clue in zip(stops, clues):
        stop["clue"] = clue
        stop.pop("review_snippets", None)
        stop.pop("place_id", None)

    return {"stops": stops, "mode": mode}


def score_venue(row) -> float:
    rating = float(row["rating"])  # guaranteed non-null by apply_filters
    rating_count = float(row["rating_count"]) if pd.notna(row.get("rating_count")) else 100.0

    # rating_perf_score rewards quality above 4.0; mystery_score rewards lesser-known venues
    rating_perf_score = max(0.0, (rating - 4.0) / 1.0)
    mystery_score = max(0.0, min(1.0, 1.0 - ((rating_count - 10) / 290)))
    return (rating_perf_score * 0.6) + (mystery_score * 0.4)
