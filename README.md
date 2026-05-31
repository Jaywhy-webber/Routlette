# Routlette

A mystery adventure app for Singapore that removes decision fatigue by generating randomised multi-stop routes for you to explore. Set your preferences, get a curated 3-stop route, and discover places you never would have chosen yourself.

---

## How it works

1. Tap **Start Adventure** on the landing screen
2. Set your starting location (NUS area by default)
3. Choose your filters — budget, walking distance, food vibes, activity vibes, and adventure mode
4. Routlette picks a hidden-gem route: **food stop → activity → food stop**
5. Each stop comes from a different vibe bucket so no two visits feel the same

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React Native (Expo 52), TypeScript |
| Backend | Python, FastAPI, Uvicorn |
| Data | Pandas, static CSV dataset (sourced from Google Places API) |
| Scoring | Custom weighted gem scoring + VADER sentiment analysis |
| Navigation | React Navigation (native stack) |

---

## Project Structure

```
routlette/
├── backend/
│   ├── main.py              # FastAPI routes and route generation logic
│   ├── filter.py            # Distance and preference filtering pipeline
│   ├── scoring.py           # Gem scoring engine + sentiment analysis (offline)
│   ├── generate_dataset.py  # One-time script to pull venues from Google Places API
│   ├── venues.csv           # Static dataset — 135 venues around NUS, Singapore
│   └── requirements.txt
└── frontend/
    ├── App.tsx              # Navigation stack
    ├── screens/
    │   ├── Dashboard.tsx        # Landing page
    │   ├── LocationScreen.tsx   # Location picker
    │   ├── FilterScreen.tsx     # Filter form (budget, vibes, mode)
    │   └── ResultsScreen.tsx    # 3-stop route output
    ├── components/
    │   ├── LogoHeader.tsx       # Shared logo shown on every screen
    │   └── ArrowForward.tsx     # Primary CTA button
    ├── services/
    │   └── api.ts               # All backend calls go through here
    └── types/
        └── navigation.ts        # Shared navigation param types
```

---

## Running the Project

### Prerequisites
- Python 3.9+
- Node.js 18+
- Expo Go app on your phone, or a browser for web testing

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
uvicorn main:app --reload
# Runs at http://localhost:8000
# Interactive API docs at http://localhost:8000/docs
```

### Frontend

```bash
cd frontend
npm install
npx expo start
# Press w to open in browser
# Or scan the QR code with Expo Go
```

> **Running on a physical device?** Find your computer's local IP (`ipconfig` on Windows) and update `BASE_URL` in `frontend/services/api.ts` to `http://<your-ip>:8000`. Start the backend with `--host 0.0.0.0`.

---

## API

### `GET /`
Health check.
```json
{ "status": "Routlette backend is running" }
```

### `GET /generate-route`
Returns a 3-stop route based on user filters.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `lat` | float | 1.2966 | User latitude |
| `lng` | float | 103.7764 | User longitude |
| `budget` | int (1–4) | 2 | Max price level |
| `walking` | int (1–5) | 5 | Radius: 300m–2000m |
| `mode` | string | balanced | `safe` / `balanced` / `chaotic` |
| `food_vibes` | string[] | all | `Fuel Stop`, `Quick & Local`, `Main Event` |
| `activity_vibes` | string[] | all | `Culture`, `Outdoors`, `Urban Adventure` |

---

## Scoring Logic

Venues are ranked using a **gem score** that rewards quality and obscurity:

```
rating_perf_score = max(0, rating - 4.0)            # quality above 4.0
mystery_score     = 1 - ((rating_count - 10) / 290) # lower reviews = more hidden
gem_score         = (rating_perf_score × 0.6) + (mystery_score × 0.4)
```

The gem score is then blended with randomness based on adventure mode:

| Mode | Gem score weight | Random weight |
|------|-----------------|---------------|
| Safe | 80% | 20% |
| Balanced | 50% | 50% |
| Chaotic | 10% | 90% |

The route always picks **2 food stops from different vibe buckets** and **1 activity stop**, so every route has built-in variety.

---

## Vibe Buckets

| Category | Vibes |
|----------|-------|
| Food | Fuel Stop (cafes, desserts), Quick & Local (noodles, fast food), Main Event (sit-down restaurants) |
| Activity | Culture (museums, galleries), Outdoors (parks, nature), Urban Adventure (landmarks, entertainment) |

---

## Milestone 1 — What's Built

- [x] FastAPI backend with CSV-based venue retrieval
- [x] Filter pipeline (budget, walking radius, excluded types, haversine distance)
- [x] Gem scoring engine (rating quality + mystery score + adventure mode)
- [x] Vibe-based route selection (2 different food vibes + 1 activity vibe)
- [x] React Native frontend with 4 screens (Dashboard, Location, Filters, Results)
- [x] Multi-select vibe pickers on the filter screen
- [x] Text-based results display with venue name, vibe, address, and coordinates

## Coming Next

- [ ] Live GPS location input
- [ ] Full scoring pipeline with sentiment analysis connected to live route generation
- [ ] Clue-based navigation (LLM-generated hints)
- [ ] Supabase database for saved routes and user preferences
- [ ] Side quests and user ratings

---

## Team

Two-person team — NUS Business Analytics / Data Analytics.
