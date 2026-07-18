import AsyncStorage from "@react-native-async-storage/async-storage";
import type { RootStackParamList } from "../types/navigation";

export const PENDING_ROUTE_KEY = "routlette:pendingRoute";

export type PendingRoutePayload = RootStackParamList["CompletionScreen"];

export async function stashPendingRoute(payload: PendingRoutePayload): Promise<void> {
  await AsyncStorage.setItem(PENDING_ROUTE_KEY, JSON.stringify(payload));
}

/** Reads and clears the stashed pending route in one call. Returns null (and
 * still clears the key) if nothing was stashed or the stored value is
 * malformed. */
export async function consumePendingRoute(): Promise<PendingRoutePayload | null> {
  const raw = await AsyncStorage.getItem(PENDING_ROUTE_KEY);
  await AsyncStorage.removeItem(PENDING_ROUTE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.stops)) return null;
    return parsed as PendingRoutePayload;
  } catch {
    return null;
  }
}
