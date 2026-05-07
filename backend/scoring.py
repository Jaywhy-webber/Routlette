import pandas as pd
import requests
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

from Routlette.backend.generate_dataset import API_KEY

analyzer = SentimentIntensityAnalyzer()

def filter_and_score_gems(api_key, input_csv='venues.csv', output_csv='final_hidden_gems.csv'):
    # 1. Load Data
    df = pd.read_csv(input_csv)

    # 2. Pre-Filtering (Remove unwanted types immediately)
    unwanted = ['shopping_mall', 'barbecue_area', 'educational_institution']
    df = df[~df['primary_type'].isin(unwanted)]

    # 3. Basic Quality Filtering (Pro/Basic Tier data)
    df['rating_count'] = pd.to_numeric(df['rating_count'], errors='coerce')
    df['rating'] = pd.to_numeric(df['rating'], errors='coerce')
    df['price_level'] = pd.to_numeric(df['price_level'], errors='coerce')

    mask = (
            (df['price_level'] <= 2) &
            (df['rating'] >= 4.0) &
            (df['rating_count'] <= 300) &
            (df['rating_count'] >= 10)
    )
    filtered_df = df[mask].copy()

    if filtered_df.empty:
        print("No matches found in basic filtering.")
        return None

    # 4. Calculate Mystery & Gem Scores (Initial Ranking)
    count_min, count_max = 10, 300
    filtered_df['mystery_score'] = 1 - ((filtered_df['rating_count'] - count_min) / (count_max - count_min))
    filtered_df['rating_perf_score'] = (filtered_df['rating'] - 4.0) / (5.0 - 4.0)
    filtered_df['gem_score'] = (filtered_df['rating_perf_score'] * 0.6) + (filtered_df['mystery_score'] * 0.4)

    # 5. FULL VIBE BUCKET MAPPING
    VIBE_MAPPING = {
        # --- FUEL STOP (Quick, Coffee, Sweets) ---
        'acai_shop': 'Fuel Stop', 'bagel_shop': 'Fuel Stop', 'bakery': 'Fuel Stop',
        'cake_shop': 'Fuel Stop', 'candy_store': 'Fuel Stop', 'cat_cafe': 'Fuel Stop',
        'chocolate_factory': 'Fuel Stop', 'chocolate_shop': 'Fuel Stop', 'coffee_roastery': 'Fuel Stop',
        'coffee_shop': 'Fuel Stop', 'coffee_stand': 'Fuel Stop', 'confectionery': 'Fuel Stop',
        'deli': 'Fuel Stop', 'dessert_restaurant': 'Fuel Stop', 'dessert_shop': 'Fuel Stop',
        'dog_cafe': 'Fuel Stop', 'donut_shop': 'Fuel Stop', 'ice_cream_shop': 'Fuel Stop',
        'juice_shop': 'Fuel Stop', 'pastry_shop': 'Fuel Stop', 'salad_shop': 'Fuel Stop',
        'sandwich_shop': 'Fuel Stop', 'snack_bar': 'Fuel Stop', 'soup_restaurant': 'Fuel Stop',
        'tea_house': 'Fuel Stop', 'cafe': 'Fuel Stop',

        # --- MAIN EVENT (Full Sit-down) ---
        'afghani_restaurant': 'Main Event', 'african_restaurant': 'Main Event', 'american_restaurant': 'Main Event',
        'argentinian_restaurant': 'Main Event', 'asian_fusion_restaurant': 'Main Event',
        'asian_restaurant': 'Main Event',
        'australian_restaurant': 'Main Event', 'austrian_restaurant': 'Main Event',
        'bangladeshi_restaurant': 'Main Event',
        'basque_restaurant': 'Main Event', 'bavarian_restaurant': 'Main Event', 'belgian_restaurant': 'Main Event',
        'bistro': 'Main Event', 'brazilian_restaurant': 'Main Event', 'breakfast_restaurant': 'Main Event',
        'british_restaurant': 'Main Event', 'brunch_restaurant': 'Main Event', 'buffet_restaurant': 'Main Event',
        'burmese_restaurant': 'Main Event', 'cafeteria': 'Main Event', 'cajun_restaurant': 'Main Event',
        'californian_restaurant': 'Main Event', 'cambodian_restaurant': 'Main Event',
        'cantonese_restaurant': 'Main Event',
        'caribbean_restaurant': 'Main Event', 'chilean_restaurant': 'Main Event',
        'chinese_noodle_restaurant': 'Main Event',
        'chinese_restaurant': 'Main Event', 'colombian_restaurant': 'Main Event', 'croatian_restaurant': 'Main Event',
        'cuban_restaurant': 'Main Event', 'czech_restaurant': 'Main Event', 'danish_restaurant': 'Main Event',
        'dim_sum_restaurant': 'Main Event', 'diner': 'Main Event', 'dutch_restaurant': 'Main Event',
        'eastern_european_restaurant': 'Main Event', 'ethiopian_restaurant': 'Main Event',
        'european_restaurant': 'Main Event',
        'family_restaurant': 'Main Event', 'filipino_restaurant': 'Main Event', 'fine_dining_restaurant': 'Main Event',
        'food_court': 'Main Event', 'french_restaurant': 'Main Event', 'fusion_restaurant': 'Main Event',
        'german_restaurant': 'Main Event', 'greek_restaurant': 'Main Event', 'hawaiian_restaurant': 'Main Event',
        'hot_pot_restaurant': 'Main Event', 'hungarian_restaurant': 'Main Event', 'indian_restaurant': 'Main Event',
        'indonesian_restaurant': 'Main Event', 'irish_restaurant': 'Main Event', 'israeli_restaurant': 'Main Event',
        'italian_restaurant': 'Main Event', 'japanese_curry_restaurant': 'Main Event',
        'japanese_izakaya_restaurant': 'Main Event',
        'japanese_restaurant': 'Main Event', 'korean_barbecue_restaurant': 'Main Event',
        'korean_restaurant': 'Main Event',
        'latin_american_restaurant': 'Main Event', 'lebanese_restaurant': 'Main Event',
        'malaysian_restaurant': 'Main Event',
        'mediterranean_restaurant': 'Main Event', 'mexican_restaurant': 'Main Event',
        'middle_eastern_restaurant': 'Main Event',
        'mongolian_barbecue_restaurant': 'Main Event', 'moroccan_restaurant': 'Main Event',
        'north_indian_restaurant': 'Main Event',
        'pakistani_restaurant': 'Main Event', 'persian_restaurant': 'Main Event', 'peruvian_restaurant': 'Main Event',
        'polish_restaurant': 'Main Event', 'portuguese_restaurant': 'Main Event', 'restaurant': 'Main Event',
        'romanian_restaurant': 'Main Event', 'russian_restaurant': 'Main Event',
        'scandinavian_restaurant': 'Main Event',
        'seafood_restaurant': 'Main Event', 'south_american_restaurant': 'Main Event',
        'south_indian_restaurant': 'Main Event',
        'southwestern_us_restaurant': 'Main Event', 'spanish_restaurant': 'Main Event',
        'sri_lankan_restaurant': 'Main Event',
        'steak_house': 'Main Event', 'sushi_restaurant': 'Main Event', 'swiss_restaurant': 'Main Event',
        'taiwanese_restaurant': 'Main Event', 'tapas_restaurant': 'Main Event', 'thai_restaurant': 'Main Event',
        'tibetan_restaurant': 'Main Event', 'turkish_restaurant': 'Main Event', 'ukrainian_restaurant': 'Main Event',
        'vegan_restaurant': 'Main Event', 'vegetarian_restaurant': 'Main Event', 'vietnamese_restaurant': 'Main Event',
        'western_restaurant': 'Main Event',

        # --- SOCIAL HOUR (Drinks) ---
        'bar': 'Social Hour', 'bar_and_grill': 'Social Hour', 'beer_garden': 'Social Hour',
        'brewery': 'Social Hour', 'brewpub': 'Social Hour', 'cocktail_bar': 'Social Hour',
        'gastropub': 'Social Hour', 'hookah_bar': 'Social Hour', 'irish_pub': 'Social Hour',
        'lounge_bar': 'Social Hour', 'oyster_bar_restaurant': 'Social Hour', 'pub': 'Social Hour',
        'sports_bar': 'Social Hour', 'wine_bar': 'Social Hour', 'winery': 'Social Hour',

        # --- QUICK & LOCAL (Casual/Fast) ---
        'barbecue_restaurant': 'Quick & Local', 'burrito_restaurant': 'Quick & Local',
        'chicken_restaurant': 'Quick & Local',
        'chicken_wings_restaurant': 'Quick & Local', 'dumpling_restaurant': 'Quick & Local',
        'falafel_restaurant': 'Quick & Local',
        'fast_food_restaurant': 'Quick & Local', 'fish_and_chips_restaurant': 'Quick & Local',
        'fondue_restaurant': 'Quick & Local',
        'gyro_restaurant': 'Quick & Local', 'halal_restaurant': 'Quick & Local',
        'hamburger_restaurant': 'Quick & Local',
        'hot_dog_restaurant': 'Quick & Local', 'hot_dog_stand': 'Quick & Local', 'kebab_shop': 'Quick & Local',
        'meal_delivery': 'Quick & Local', 'meal_takeaway': 'Quick & Local', 'noodle_shop': 'Quick & Local',
        'pizza_delivery': 'Quick & Local', 'pizza_restaurant': 'Quick & Local', 'ramen_restaurant': 'Quick & Local',
        'shawarma_restaurant': 'Quick & Local', 'soul_food_restaurant': 'Quick & Local',
        'taco_restaurant': 'Quick & Local',
        'tonkatsu_restaurant': 'Quick & Local', 'yakiniku_restaurant': 'Quick & Local',
        'yakitori_restaurant': 'Quick & Local',

        # --- CULTURE ---
        'art_gallery': 'Culture', 'museum': 'Culture', 'library': 'Culture', 'cultural_center': 'Culture',
        'planetarium': 'Culture', 'aquarium': 'Culture',

        # --- OUTDOORS ---
        'park': 'Outdoors', 'garden': 'Outdoors', 'hiking_area': 'Outdoors', 'dog_park': 'Outdoors',
        'zoo': 'Outdoors', 'nature_reserve': 'Outdoors', 'national_park': 'Outdoors',

        # --- URBAN ADVENTURE ---
        'tourist_attraction': 'Urban Adventure', 'landmark': 'Urban Adventure',
        'historical_landmark': 'Urban Adventure',
        'movie_theater': 'Urban Adventure', 'bowling_alley': 'Urban Adventure', 'amusement_park': 'Urban Adventure'
    }

    def get_primary_type(t):
        if not isinstance(t, str): return "unknown"
        clean_t = t.replace("[", "").replace("]", "").replace("'", "").replace('"', "")
        return clean_t.split(',')[0].strip()

    filtered_df['primary_type_clean'] = filtered_df['primary_type'].apply(get_primary_type)
    filtered_df['vibe_bucket'] = filtered_df['primary_type_clean'].map(VIBE_MAPPING).fillna('Other Activity/Food')

    # 6. Extract Top 3 per Vibe Bucket (The finalists for API call)
    finalists = (
        filtered_df.sort_values(by='gem_score', ascending=False)
        .groupby('vibe_bucket')
        .head(3)
    ).copy()

    # 7. LAZY LOAD: Call Google API for Top 3 Finalists only
    print(f"API Phase: Fetching summaries for {len(finalists)} candidates...")

    review_sentiments = []

    for _, row in finalists.iterrows():
        place_id = row['place_id']

        # Details request focusing on REVIEWS
        url = f"https://places.googleapis.com/v1/places/{place_id}"
        headers = {
            "X-Goog-Api-Key": api_key,
            "X-Goog-FieldMask": "reviews"
        }

        combined_review_text = ""
        try:
            response = requests.get(url, headers=headers)
            if response.status_code == 200:
                reviews_list = response.json().get('reviews', [])
                # Combine the text of all 5 reviews into one giant string
                combined_review_text = " ".join([r.get('text', {}).get('text', '') for r in reviews_list])
        except Exception as e:
            print(f"Error fetching reviews for {row['name']}: {e}")

        # Run Sentiment Analysis on the combined reviews
        sentiment = analyzer.polarity_scores(combined_review_text)['compound'] if combined_review_text else 0.5
        review_sentiments.append(sentiment)

    finalists['sentiment_score'] = review_sentiments

    # 8. FINAL COMBINED RANKING
    finalists['final_combined_score'] = (finalists['gem_score'] * 0.8) + (finalists['sentiment_score'] * 0.2)

    # --- 9. THE SELECTION STEP (ADDITION) ---
    # We sort by the final combined score and take ONLY the top 1 per bucket
    winners_only = (
        finalists.sort_values(by='final_combined_score', ascending=False)
        .groupby('vibe_bucket')
        .head(1)  # <--- CHANGE: Only the #1 winner survives
    )

    # 10. Save and Output
    winners_only.to_csv(output_csv, index=False)

    print("\n--- THE ROUTLETTE CHAMPIONS ---")
    print(winners_only[['vibe_bucket', 'name', 'final_combined_score']])

    return winners_only

scored_gems = filter_and_score_gems(API_KEY)