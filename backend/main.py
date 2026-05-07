from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import random

app = FastAPI()

# Allows the React frontend to talk to this server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the CSV dataset once on startup
df = pd.read_csv("venues.csv")

@app.get("/")
def root():
    return {"status": "Routlette backend is running"}

@app.get("/generate-route")
def generate_route(
    budget: int = Query(default=2, ge=1, le=4),
    mode: str = Query(default="balanced"),
):
    # Filter by budget
    filtered = df[df["price_level"] <= budget].copy()

    # Score each venue
    filtered["score"] = filtered.apply(
        lambda row: score_venue(row, mode), axis=1
    )

    # Pick one of each category for a 3-stop route
    stops = []
    for category in ["food", "activity", "food"]:
        pool = filtered[filtered["category"] == category]
        if pool.empty:
            continue
        pick = pool.nlargest(5, "score").sample(1).iloc[0]
        stops.append({
            "name": pick["name"],
            "category": pick["category"],
            "address": pick["address"],
            "lat": pick["lat"],
            "lng": pick["lng"],
            "price_level": int(pick["price_level"]),
            "score": round(pick["score"], 3),
        })
        # Remove selected venue so it won't be picked again
        filtered = filtered[filtered["name"] != pick["name"]]

    return {"stops": stops, "mode": mode}


def score_venue(row, mode):
    rating_score = row.get("rating", 3.0) / 5.0

    weights = {
        "safe":     {"rating": 0.8, "random": 0.2},
        "balanced": {"rating": 0.5, "random": 0.5},
        "chaotic":  {"rating": 0.1, "random": 0.9},
    }.get(mode, {"rating": 0.5, "random": 0.5})

    score = (weights["rating"] * rating_score +
             weights["random"] * random.random())
    return score