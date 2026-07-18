import AsyncStorage from "@react-native-async-storage/async-storage";
import { stashPendingRoute, consumePendingRoute, PENDING_ROUTE_KEY } from "../pendingRoute";

const samplePayload = {
  stops: [
    {
      name: "Test Stop",
      category: "food",
      vibe: "Fuel Stop",
      address: "1 Test St",
      lat: 1.3,
      lng: 103.8,
      price_level: 2,
      score: 0.9,
      clue: "clue",
    },
  ],
  mode: "balanced",
  journeyStartTime: 1000,
  totalDistance: 500,
};

describe("pendingRoute", () => {
  afterEach(async () => {
    await AsyncStorage.clear();
  });

  it("round-trips a stashed payload through consumePendingRoute and clears it", async () => {
    await stashPendingRoute(samplePayload as any);
    const result = await consumePendingRoute();
    expect(result).toEqual(samplePayload);
    expect(await AsyncStorage.getItem(PENDING_ROUTE_KEY)).toBeNull();
  });

  it("returns null when nothing was stashed", async () => {
    expect(await consumePendingRoute()).toBeNull();
  });

  it("returns null and clears the key for a malformed stored value", async () => {
    await AsyncStorage.setItem(PENDING_ROUTE_KEY, "not json");
    expect(await consumePendingRoute()).toBeNull();
    expect(await AsyncStorage.getItem(PENDING_ROUTE_KEY)).toBeNull();
  });
});
