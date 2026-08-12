import requests
import pandas as pd
import os
import time
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")

BASE_URL = "https://places.googleapis.com/v1/places:searchNearby"

FIELD_MASK = ",".join([
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.location",
    "places.primaryType",
    "places.types",
    "places.priceLevel",
    "places.rating",
    "places.userRatingCount",
    "places.businessStatus",
    "places.regularOpeningHours",
    "places.currentOpeningHours",
])

# 1 search area for now to get a static dataset to work out filtering logic to reduce api calls
SEARCH_AREAS = [
    ("Toa Payoh", 1.3332378651265921, 103.85952369061232, 2000),
]

# search fields for food/activities subtypes to maximize results since google api only returns max 20 results
FOOD_TYPES = [
    "restaurant", "cafe", "food_court", "bakery", "bar",
    "coffee_roastery", "coffee_shop", "dessert_restaurant", "dessert_shop",
    "deli", "pub", "wine_bar", "diner", "ice_cream_shop",
    "meal_takeaway", "sandwich_shop"
]

ACTIVITY_TYPES = [
    "tourist_attraction", "museum", "park", "art_gallery",
    "movie_theater", "live_music_venue", "art_studio", "comedy_club",
    "historical_place", "historical_landmark", "garden", "scenic_spot",
    "cultural_center", "library", "amusement_center"
]


async def fetch_robust_live_dataset(center_lat: float, center_lng: float, api_key: str, radius_m: int) -> pd.DataFrame:
    # Temporarily override the global API key if passed down by main
    global API_KEY
    if api_key:
        API_KEY = api_key

    all_rows = []
    seen_ids = set()

    # Search a grid of points around the user, rather than one wide-radius search,
    # so hyper-local venues near their exact position aren't outweighed by the area.
    grid_points = generate_grid(center_lat, center_lng, total_radius_m=radius_m, step_size_m=400)

    for grid_lat, grid_lng in grid_points:
        harvest_coordinate(grid_lat, grid_lng, radius=300, types=FOOD_TYPES,
                           category_label="Food", seen_ids=seen_ids,
                           all_rows=all_rows, neighborhood_label="Live_Query")

        harvest_coordinate(grid_lat, grid_lng, radius=300, types=ACTIVITY_TYPES,
                           category_label="Activity", seen_ids=seen_ids,
                           all_rows=all_rows, neighborhood_label="Live_Query")

    if not all_rows:
        return pd.DataFrame()

    df = pd.DataFrame(all_rows)
    df = df[(df["name"] != "") & (df["rating"] > 0)]
    return df

def parse_price_level(raw):
    mapping = {
        "PRICE_LEVEL_FREE":         1,
        "PRICE_LEVEL_INEXPENSIVE":  1,
        "PRICE_LEVEL_MODERATE":     2,
        "PRICE_LEVEL_EXPENSIVE":    3,
        "PRICE_LEVEL_VERY_EXPENSIVE": 4,
    }
    return mapping.get(raw, 2)


def search_nearby(lat, lng, radius, place_types, label):
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": API_KEY,
        "X-Goog-FieldMask": FIELD_MASK,
    }
    
    body = {
        "includedTypes": place_types,
        "maxResultCount": 20,
        "rankPreference": "DISTANCE",
        "locationRestriction": {
            "circle": {
                "center": {"latitude": lat, "longitude": lng},
                "radius": float(radius),
            }
        },
    }
    
    resp = requests.post(BASE_URL, headers=headers, json=body)
    if resp.status_code != 200:
        print(f"ERROR {resp.status_code}: {resp.text}")
        return []
    places = resp.json().get("places", [])
    open_places = [place for place in places if place.get("currentOpeningHours", {}).get("openNow", True) is True and place.get("businessStatus") == "OPERATIONAL"]
    print(f"{label}: got {len(places)} results total ({len(open_places)} are currently open)")
    return open_places


def generate_grid(center_lat, center_lng, total_radius_m, step_size_m=400):
    # 111,000 meters roughly equals 1 degree of latitude/longitude
    deg_per_meter = 1.0 / 111000.0
    step_deg = step_size_m * deg_per_meter
    max_deg_offset = total_radius_m * deg_per_meter

    grid_points = []

    start_lat = center_lat - max_deg_offset
    end_lat = center_lat + max_deg_offset
    start_lng = center_lng - max_deg_offset
    end_lng = center_lng + max_deg_offset

    current_lat = start_lat
    while current_lat <= end_lat:
        current_lng = start_lng
        while current_lng <= end_lng:
            # Only keep points inside the true circular radius, so API calls aren't
            # wasted on the square grid's outer corners
            dist_from_center = ((current_lat - center_lat) ** 2 + (current_lng - center_lng) ** 2) ** 0.5
            if dist_from_center <= max_deg_offset:
                grid_points.append((current_lat, current_lng))

            current_lng += step_deg
        current_lat += step_deg

    return grid_points


def harvest_coordinate(lat, lng, radius, types, category_label, seen_ids, all_rows, neighborhood_label, depth=1, max_depth=2):
    # searches a specific coordinate, automatically subdivides itself into 4 smaller micro-zones if 20 result cap reached
    label_prefix = f"{category_label} [Depth {depth}]"
    places = search_nearby(lat, lng, radius, types, label=label_prefix)
    for place in places:
        pid = place.get("id")
        if pid in seen_ids or place.get("businessStatus") == "CLOSED_PERMANENTLY":
            continue
        seen_ids.add(pid)
        all_rows.append({
            "place_id": pid,
            "name": place.get("displayName", {}).get("text", ""),
            "category": category_label.lower(),
            "primary_type": place.get("primaryType", ""),
            "address": place.get("formattedAddress", ""),
            "lat": place.get("location", {}).get("latitude"),
            "lng": place.get("location", {}).get("longitude"),
            "price_level": parse_price_level(place.get("priceLevel", "")),
            "rating": place.get("rating", 0),
            "rating_count": place.get("userRatingCount", 0),
            "neighbourhood": neighborhood_label,
        })

    if len(places) == 20 and depth < max_depth:
        print(f">20 places found at ({lat:.4f}, {lng:.4f}). Subdividing area...")
        offset_deg = (radius * 0.4) / 111000.0
        sub_quadrants = [
            (lat + offset_deg, lng + offset_deg),
            (lat + offset_deg, lng - offset_deg),
            (lat - offset_deg, lng + offset_deg),
            (lat - offset_deg, lng - offset_deg),
        ]
        time.sleep(0.2)

        for sub_lat, sub_lng in sub_quadrants:
            harvest_coordinate(
                lat=sub_lat,
                lng=sub_lng,
                radius=radius / 2,
                types=types,
                category_label=category_label,
                seen_ids=seen_ids,
                all_rows=all_rows,
                neighborhood_label=neighborhood_label,
                depth=depth + 1,
                max_depth=max_depth
            )


def main():
    all_rows = []
    seen_ids = set()

    for (neighborhood, center_lat, center_lng, total_radius) in SEARCH_AREAS:
        grid_points = generate_grid(center_lat, center_lng, total_radius, step_size_m=400)
        for grid_lat, grid_lng in grid_points:
            harvest_coordinate(grid_lat, grid_lng, radius=300, types=FOOD_TYPES, category_label="Food",
                               seen_ids=seen_ids, all_rows=all_rows, neighborhood_label=neighborhood)
            harvest_coordinate(grid_lat, grid_lng, radius=300, types=ACTIVITY_TYPES, category_label="Activity",
                               seen_ids=seen_ids, all_rows=all_rows, neighborhood_label=neighborhood)

    if all_rows:
        df = pd.DataFrame(all_rows)
        df = df[(df["name"] != "") & (df["rating"] > 0)]
        filename = "venues.csv"
        df.to_csv(filename, index=False)
        print(f"\n Search complete! Saved {len(df)} unique venues to {filename}.")
    else:
        print("\n No venues found.")


if __name__ == "__main__":
    main()
