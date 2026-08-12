"""One-time script: fetches Google Places reviews for every venue in venues.csv
and writes them back as a `review_snippets` column.

Run once from the backend directory:
    python enrich_reviews.py

Requires GOOGLE_PLACES_API_KEY in backend/.env
"""

import os
import sys
import time
import requests
import pandas as pd
from dotenv import load_dotenv

# Fix Windows console encoding for venue names with special characters
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

load_dotenv()
API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")

if not API_KEY:
    raise RuntimeError("GOOGLE_PLACES_API_KEY not found in .env")

MAX_REVIEWS = 3
MAX_WORDS_PER_REVIEW = 100
DELAY_SECONDS = 0.2


def fetch_review_snippets(place_id: str, debug: bool = False) -> str:
    url = f"https://places.googleapis.com/v1/places/{place_id}"
    headers = {
        "X-Goog-Api-Key": API_KEY,
        "X-Goog-FieldMask": "reviews",
    }
    try:
        response = requests.get(url, headers=headers, timeout=10)
        if debug:
            print(f"  [debug] status={response.status_code} body={response.text[:300]}")
        if response.status_code != 200:
            print(f"  [warn] API returned {response.status_code}")
            return ""
        reviews = response.json().get("reviews", [])
    except Exception as e:
        print(f"  Request error: {e}")
        return ""

    if debug:
        langs = [r.get("text", {}).get("languageCode", "?") for r in reviews]
        print(f"  [debug] {len(reviews)} review(s), languages: {langs}")

    snippets = []
    # First pass: English reviews (catches "en", "en-SG", "en-GB", etc.)
    for review in reviews:
        text_obj = review.get("text", {})
        lang = text_obj.get("languageCode", "")
        text = text_obj.get("text", "").strip()
        if not lang.startswith("en") or not text:
            continue
        snippets.append(" ".join(text.split()[:MAX_WORDS_PER_REVIEW]))
        if len(snippets) >= MAX_REVIEWS:
            break

    # Fallback: if no English reviews, take any non-empty reviews
    if not snippets:
        for review in reviews:
            text = review.get("text", {}).get("text", "").strip()
            if text:
                snippets.append(" ".join(text.split()[:MAX_WORDS_PER_REVIEW]))
            if len(snippets) >= MAX_REVIEWS:
                break

    return " | ".join(snippets)


def main():
    df = pd.read_csv("venues.csv")
    total = len(df)
    print(f"Enriching {total} venues...")

    snippets = []
    for i, row in df.iterrows():
        place_id = row["place_id"]
        name = row["name"]
        # Debug mode for first venue to verify API response shape
        debug = (i == 0)
        print(f"[{i + 1}/{total}] {name}")
        snippet = fetch_review_snippets(place_id, debug=debug)
        snippets.append(snippet)
        if snippet:
            print(f"  -> {len(snippet.split(' | '))} review(s) cached")
        else:
            print("  -> no reviews found")
        time.sleep(DELAY_SECONDS)

    df["review_snippets"] = snippets
    df.to_csv("venues.csv", index=False)
    filled = sum(1 for s in snippets if s)
    print(f"\nDone. {filled}/{total} venues have review snippets.")


if __name__ == "__main__":
    main()
