import random

COFFEE_QUESTS = [
    "Ask the barista which origin country or farm the current espresso or filter beans are from, and look up its location on a map while you wait.",
    "Order a drink you've never tried before without looking at the menu prices.",
    "Skip the standard espresso machine. Order a drink made using a manual brewing method if available, such as a V60 pour-over, Aeropress, or Cold Brew, and watch the process.",
    "Order a coffee using a milk variation you’ve never tried before (e.g., oat, almond, macadamia, or traditional full cream) and note how it alters the texture and sweetness of the espresso.",
    "Pick a pastry or baked good from the display case purely based on how well it would complement the bitterness or acidity of your coffee choice.",
    "If your drink comes with milk foam art, you must try to drink the entire cup from one fixed angle without breaking or destroying the shape of the foam design until you hit the bottom.",
    "If you normally add sugar, syrup, or sweetener to your coffee, skip it entirely today. Force yourself to sit with the natural bitterness and acidity of the bean for at least three sips.",
    "Let your coffee sit untouched for exactly 5 minutes before drinking. Notice how the tasting notes, sweetness, and sharpness change as the liquid cools down from boiling to warm.",
    "Find an item on the menu that isn't a Latte, Cappuccino, or Americano. Ask the barista to quickly explain how it's structurally different from a standard latte, then order it."
    ]

ART_QUESTS = [
    "Find an artwork, portrait, or historical relic that initially looks boring or confusing to you. Force yourself to stand in front of it and stare at it for 60 seconds straight before you read its description plaque.",
    "Walk through the current exhibition room. If you were an international art thief given a 100% guarantee that you could walk out with exactly one object on display to hang in your home, which one would it be?",
    "Stand back and look at a large painting or display structure. Try to deduce exactly where the artist or curator was physically standing (or shining the light source) when they finalized the angle of the piece.",
    "Get as physically close to an unrestricted painting or sculpture as the security lines allow. Try to spot the individual brushstrokes, tool marks, cracks in the glaze, or imperfections left behind by the artist's hands.",
    "Walk up to an abstract artwork or artifact while covering the description plaque with your hand. Stare at it, invent your own dramatic 3-word title for it, and then reveal the real name to see how close your vibe was."
    ]

SIDE_QUESTS = {
    "coffee_roastery": COFFEE_QUESTS,
    "cafe": COFFEE_QUESTS,

    "food_court": [
        "Scan the entire layout, locate the absolute longest stall queue that isn't an international fast-food chain, join it, and order whatever their signature dish is."
    ],

    "park": [
        "Sit completely still on a bench for exactly 2 minutes with your eyes closed. Count how many distinct bird or animal sounds you can hear.",
        "Find a specific plant or tree you can’t identify, take a close-up photo, and use Google Lens to discover its name.",
        "Find a fallen log, a patch of moss, or a tree trunk. Spend 60 seconds looking at a single square foot of space to see how many tiny insects, ants, or micro-organisms are currently working there.",
        "Find a safe spot to lean your head completely back or lie down on the grass. Stare straight up into the sky through the tree branches for 45 seconds without blinking or checking your phone.",
        "Intentionally diverge from the main concrete path. Look for a unpaved dirt path, stone trail, or lesser-traveled side loop and follow it until it completely reconnects or ends."
    ],

    "museum": ART_QUESTS,
    "art_gallery": ART_QUESTS,

    "shopping_mall": [
        "Malls hide their best independent gems in the basement or upper corners. Find an independent shop that doesn't exist in any other mall in Singapore.",
        "Navigate the mall layout with one goal: find the quietest, most forgotten service hallway, emergency exit alcove, or structural dead-end where the ambient music completely cuts out.",
        "While riding an escalator between two floors, look across at the opposite escalator lane. Count how many people are looking down at their phones versus looking up at their surroundings before you reach the top.",
        "Look at a physical or digital mall directory map for 10 seconds to locate a specific category of shop (e.g., a bookstore or electronic shop). Close the map and try to navigate there purely from memory without looking at another sign.",
        "Find a clothing store window display. Calculate the total cost of the entire outfit worn by a single mannequin by checking the price tags through the glass or walking inside to find the item rack."
    ],

    "dog_park": [
        "Do your best to draw 3 dogs!",
        "Pick out a dog with an unusual coat or structure. Without asking the owner, try to guess their specific breed mix based on their features, ears, and tail type.",
        "Watch a dog interacting with its owner or a friend. Focus strictly on its tail movement—is it a helicopter spin, a low cautious wag, or a rigid flag? Decipher their current emotion.",
    ],

    "library": [
        "Walk to a random bookshelf row, close your eyes, count to five while dragging your finger across the book spines, stop, and read the first page of the book you landed on.",
        "Gently pull out three older, well-worn fiction books and check inside their pages. Look for left-behind artifacts: a custom bookmark, an old checkout slip, a dog-eared page, or marginalia notes.",
        "Find a book whose cover art or typography design is so striking, strange, or beautiful that it makes you want to read it purely based on the visual aesthetic.",
        "Find the section of the library that feels the most heavily insulated and silent. Step inside and try to navigate the aisles without making a single audible floorboard creak or fabric rustle.",
        "Locate the local history, heritage, or regional archive section. Find a book or micro-document showing what your current neighborhood looked like 50 to 100 years ago."
    ]
}

GENERAL_FOOD_QUESTS = [
    "Ask the staff what their single most popular item is, and order exactly that without looking at the rest of the menu.",
    "Order a dish or flavor profile you have never physically tried before in your life.",
    "Walk up to the counter, ask the staff what their personal favorite item on the menu is, and order exactly that without looking at anything else.",
    "Order a dish, dessert, or drink that features a flavor profile or ingredient you actively disliked as a child. See if your palate has evolved.",
    "Keep your phone completely in your pocket or bag from the moment your food arrives until you finish your last bite. Focus entirely on the sensory experience.",
    "Take your first three bites with your eyes closed. Try to isolate and identify at least one hidden spice, herb, or condiment used in the base preparation.",
    "Challenge yourself to order a meal, side, or beverage combination that introduces at least three distinctly vibrant colors to your table.",
    "Close your eyes, run your finger down the menu page or display board for three seconds, stop, and order whatever item your finger lands on.",
    "If you are with someone, you are forbidden from looking at the menu. They must choose and order your entire meal for you in secret."
]

GENERAL_ACTIVITY_QUESTS = [
    "Look around your immediate vicinity for a tiny, fascinating physical detail (a carving, an odd leaf, an architectural quirk) that 99% of people walk right past without noticing.",
    "Take a photo of your current location to log your journey, but under one strict constraint: you are not allowed to include the sky, the horizon, or any human faces in the frame.",
    "Find a spot to sit or lean comfortably, close your eyes, and remain completely still for exactly two minutes. Count how many distinct layers of sound you can isolate.",
    "Find a safe way to dramatically alter your viewpoint—crouch down low to look at the ground plane or lean back to look straight up at the ceiling or canopy. Take it in for 30 seconds.",
    "Find a plant, structural material, or architectural artifact you cannot name. Get close enough to inspect its surface texture, take a photo, and resolve to identify it later.",
    "Observe the closest person near you who isn't in your group. In your head, invent a highly specific, harmless backstory explaining exactly why they decided to visit this exact coordinate today.",
    "Imagine this specific setting is the opening backdrop for a feature film. What genre of movie is it, and what kind of music is playing as the camera pans across the space?",
    "At the next path intersection, hallway split, or trail fork, you must intentionally choose the direction that looks narrower, less traveled, or less familiar.",
    "If you were given absolute permission to permanently take exactly one physical thing from this location (a stone, a painting, an ornament) to keep on your desk, what would it be?"
]


def get_side_quest(primary_type: str, category: str) -> str:
    clean_type = str(primary_type).strip("[]'\" ").split(',')[0].strip()
    if clean_type in SIDE_QUESTS:
        return random.choice(SIDE_QUESTS[clean_type])

    if category == "food":
        return random.choice(GENERAL_FOOD_QUESTS)
    else:
        return random.choice(GENERAL_ACTIVITY_QUESTS)
