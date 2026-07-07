import math
import pandas as pd

EXCLUDED_TYPES = {"shopping_mall", "gift_shop", "wholesaler", "store", "barbecue_area",
                  "educational_institution", "child_care_agency", "manufacturer", "garden",
                  "art_studio", "tour_agency", "car_dealer", "corporate_office", "transportation_service",
                  }

# Maps the frontend walking slider (1–5) to a metre radius
WALKING_MAP = {1: 300, 2: 600, 3: 1000, 4: 1500, 5: 2000}


def haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6_371_000  # Earth radius in metres
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def apply_filters(df: pd.DataFrame, lat: float, lng: float, budget: int, category: str, walking: int) -> pd.DataFrame:
    # 1. Remove unwanted place types (non-adventures)
    df = df[~df["primary_type"].isin(EXCLUDED_TYPES)].copy()

    # 2. Enforce numeric types so comparisons don't silently fail on mixed-type columns
    df["price_level"] = pd.to_numeric(df["price_level"], errors="coerce")
    df["rating"] = pd.to_numeric(df["rating"], errors="coerce")
    df["rating_count"] = pd.to_numeric(df["rating_count"], errors="coerce")

    # 3. Filter by budget (drop rows with missing price_level — can't verify affordability)
    df = df[df["price_level"].notna() & (df["price_level"] <= budget)]

    # 4. Filter by category
    if category != "both":
        df = df[df["category"] == category]

    # 5. Calculate haversine distance from user's location to each venue
    df["distance_m"] = df.apply(
        lambda r: haversine(lat, lng, float(r["lat"]), float(r["lng"])), axis=1
    )

    # 6. Filter by walking radius
    radius_m = WALKING_MAP.get(walking, 2000)
    df = df[df["distance_m"] <= radius_m]

    # 7. Drop rows missing critical fields (can't display or navigate without them)
    df = df.dropna(subset=["name", "lat", "lng", "rating"])

    # 8. Sort by distance so the scorer sees closest venues first
    return df.sort_values("distance_m").reset_index(drop=True)
