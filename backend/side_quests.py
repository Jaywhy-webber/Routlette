import random

COFFEE_QUESTS = [
        "Ask the barista which origin country the current espresso beans are from, and look up where it is on a map.",
        "Order a drink you've never tried before without looking at the menu prices."
    ]

ART_QUESTS = [
        "Find an artwork or historical artifact that initially confuses you. Stand in front of it and stare at it for 60 seconds straight before reading the description plaque.",
        "If you could secretly steal exactly one item or painting from this building to hang in your bedroom, which one would it be?"
    ]

SIDE_QUESTS = {
    "coffee_roastery": COFFEE_QUESTS,
    "coffee_shop": COFFEE_QUESTS,
    "cafe": COFFEE_QUESTS,

    "food_court": [
        "Find the stall with the longest queue that isn't a massive chain, join it, and order their flagship dish."
    ],

    "park": [
        "Sit completely still on a bench for exactly 2 minutes with your eyes closed. Count how many distinct bird or animal sounds you can hear.",
        "Find a specific plant or tree you can’t identify, take a close-up photo, and use Google Lens to discover its name."
    ],

    "museum": ART_QUESTS,
    "art_gallery": ART_QUESTS,

    "shopping_mall": [
        "Malls hide their best independent gems in the basement or upper corners. Find an independent shop that doesn't exist in any other mall in Singapore."
    ],

    "dog_park": [
        "Do your best to draw 3 dogs!"
    ],

    "library": [
        "Find an interesting book and borrow it!"
    ]
}

GENERAL_FOOD_QUESTS = [
    "Ask the staff what their most popular item is and order it!",
    "Order a dish you have never tried before in your life!"
]

GENERAL_ACTIVITY_QUESTS = [
    "Look for what others walk past. Find a hidden architectural detail or quiet corner most people walk right past.",
    "Take a photo of your destination, but you are not allowed to include the sky or any people in the frame."
]


def get_side_quest(primary_type: str, category: str) -> str:
    clean_type = str(primary_type).strip("[]'\" ").split(',')[0].strip()
    if clean_type in SIDE_QUESTS:
        return random.choice(SIDE_QUESTS[clean_type])

    # general food/activity side quests fallback
    if category == "food":
        return random.choice(GENERAL_FOOD_QUESTS)
    else:
        return random.choice(GENERAL_ACTIVITY_QUESTS)
