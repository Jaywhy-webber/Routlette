import httpx
import asyncio
import pandas as pd
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

analyzer = SentimentIntensityAnalyzer()

async def fetch_single_review_text(client: httpx.AsyncClient, place_id: str, api_key: str) -> str:
    url = f"https://places.googleapis.com/v1/places/{place_id}"
    headers = {
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": "reviews"
    }
    try:
        response = await client.get(url, headers=headers, timeout=5.0)
        if response.status_code == 200:
            reviews_list = response.json().get('reviews', [])
            # Combine all review strings together
            return " ".join([r.get('text', {}).get('text', '') for r in reviews_list])
    except Exception:
        pass
    return ""


async def apply_sentiment_and_rank(pool_df: pd.DataFrame, api_key: str) -> pd.DataFrame:
    if pool_df.empty:
        return pool_df

    candidates = pool_df.copy()

    async with httpx.AsyncClient() as client:
        tasks = [fetch_single_review_text(client, str(row['place_id']), api_key) for _, row in candidates.iterrows()]
        combined_texts = await asyncio.gather(*tasks)

    # VADER sentiment
    review_sentiments = []
    for text in combined_texts:
        sentiment = analyzer.polarity_scores(text)['compound'] if text.strip() else 0.5
        review_sentiments.append(sentiment)

    candidates['sentiment_score'] = review_sentiments

    # combines gem_score (80%) with real user review sentiment (20%)
    candidates['final_combined_score'] = (candidates['gem_score'] * 0.8) + (candidates['sentiment_score'] * 0.2)

    # returns highest scoring result
    return candidates.sort_values(by='final_combined_score', ascending=False)