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
])

# 1 search area for now to get a static dataset to work out filtering logic to reduce api calls
SEARCH_AREAS = [
    ("NUS", 1.2966, 103.7764, 2000),
]

# search fields for food/activities subtypes to maximize results since google api only returns max 20 results
FOOD_TYPES = [
    ["restaurant"],
    ["cafe"],
    ["food_court"],
    ["bakery"],
    ["bar"],
    ["hawker_centre"],
]

ACTIVITY_TYPES = [
    ["tourist_attraction"],
    ["museum"],
    ["park"],
    ["art_gallery"],
    ["shopping_mall"],
    ["movie_theater"],
]

def search_nearby(lat, lng, radius, place_types, label):
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": API_KEY,
        "X-Goog-FieldMask": FIELD_MASK,
    }
    
    body = {
        "includedTypes": place_types,
        "maxResultCount": 20,
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
    print(f"{label}: got {len(places)} results")
    return places

def parse_price_level(raw):
    mapping = {
        "PRICE_LEVEL_FREE":         1,
        "PRICE_LEVEL_INEXPENSIVE":  1,
        "PRICE_LEVEL_MODERATE":     2,
        "PRICE_LEVEL_EXPENSIVE":    3,
        "PRICE_LEVEL_VERY_EXPENSIVE": 4,
    }
    return mapping.get(raw, 2)

def main():
    all_rows = []
    # avoid duplicates
    seen_ids = set()

    for (label, lat, lng, radius) in SEARCH_AREAS:
        print(f"\nSearching: {label}")

        # food search
        for type_list in FOOD_TYPES:
            for place in search_nearby(lat, lng, radius, type_list, f"{label} {type_list[0]}"):
                pid = place.get("id")
                # ignore places already seen/closed permanently
                if pid in seen_ids or place.get("businessStatus") == "CLOSED_PERMANENTLY":
                    continue
                seen_ids.add(pid)
                all_rows.append({
                    "place_id":      pid,
                    "name":          place.get("displayName", {}).get("text", ""),
                    "category":      "food",
                    "primary_type":  place.get("primaryType", ""),
                    "address":       place.get("formattedAddress", ""),
                    "lat":           place.get("location", {}).get("latitude"),
                    "lng":           place.get("location", {}).get("longitude"),
                    "price_level":   parse_price_level(place.get("priceLevel", "")),
                    "rating":        place.get("rating", 0),
                    "rating_count":  place.get("userRatingCount", 0),
                    "neighbourhood": label,
                })
            time.sleep(0.3)

        # activities search
        for type_list in ACTIVITY_TYPES:
            for place in search_nearby(lat, lng, radius, type_list, f"{label} {type_list[0]}"):
                pid = place.get("id")
                if pid in seen_ids or place.get("businessStatus") == "CLOSED_PERMANENTLY":
                    continue
                seen_ids.add(pid)
                all_rows.append({
                    "place_id":      pid,
                    "name":          place.get("displayName", {}).get("text", ""),
                    "category":      "activity",
                    "primary_type":  place.get("primaryType", ""),
                    "address":       place.get("formattedAddress", ""),
                    "lat":           place.get("location", {}).get("latitude"),
                    "lng":           place.get("location", {}).get("longitude"),
                    "price_level":   parse_price_level(place.get("priceLevel", "")),
                    "rating":        place.get("rating", 0),
                    "rating_count":  place.get("userRatingCount", 0),
                    "neighbourhood": label,
                })
            time.sleep(0.3)

    # remove irrelevant entries
    df = pd.DataFrame(all_rows)
    df = df[df["name"] != ""]          
    df = df[df["rating"] > 0]   
    df = df.drop_duplicates("place_id")

    df.to_csv("venues.csv", index=False)
    print(df["category"].value_counts())
    print(df["neighbourhood"].value_counts())

if __name__ == "__main__":
    main()
