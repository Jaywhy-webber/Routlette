// All calls to the FastAPI backend go through this

const BASE_URL = "http://192.168.1.12:8000";

export type Stop = {
  name: string;
  category: string;
  vibe: string;
  address: string;
  lat: number;
  lng: number;
  price_level: number;
  score: number;
};

export type RouteResponse = {
  stops: Stop[];
  mode: string;
  error?: string;
};

export type FilterParams = {
  lat: number;
  lng: number;
  budget: number;
  walking: number;
  mode: string;
  food_vibes: string[];
  activity_vibes: string[];
};

export async function generateRoute(params: FilterParams): Promise<RouteResponse> {
  const url = new URL(`${BASE_URL}/generate-route`);

  // Append scalar params
  url.searchParams.append("lat", String(params.lat));
  url.searchParams.append("lng", String(params.lng));
  url.searchParams.append("budget", String(params.budget));
  url.searchParams.append("walking", String(params.walking));
  url.searchParams.append("mode", params.mode);

  // Append array params — FastAPI reads repeated keys as a List[str]
  params.food_vibes.forEach((v) => url.searchParams.append("food_vibes", v));
  params.activity_vibes.forEach((v) => url.searchParams.append("activity_vibes", v));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Backend error: ${res.status}`);
  return res.json();
}
