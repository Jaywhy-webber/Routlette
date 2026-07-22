import { supabase } from "./supabase";
import { Stop } from "./api";

export function distinctNeighbourhoods(stops: Stop[]): string[] {
  const set = new Set(
    stops
      .map((s) => s.neighbourhood)
      .filter((n): n is string => !!n)
  );
  return Array.from(set);
}

export async function recordRouteCompletion(
  stops: Stop[],
  journeyStartTime: number,
  journeyEndTime: number
): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return; // guests are never tracked — silent no-op, not a throw

  const areas = distinctNeighbourhoods(stops);
  if (areas.length === 0) return;

  const routeToken = `${journeyStartTime}-${journeyEndTime}`;
  const rows = areas.map((planning_area) => ({
    user_id: session.user.id,
    planning_area,
    route_token: routeToken,
  }));

  const { error } = await supabase
    .from("route_completions")
    .upsert(rows, { onConflict: "user_id,planning_area,route_token", ignoreDuplicates: true });

  if (error) throw error;
}

export type AreaSummary = { count: number; lastExploredAt: string };

export async function getDiscoveredAreaSummaries(): Promise<Record<string, AreaSummary>> {
  const { data, error } = await supabase
    .from("route_completions")
    .select("planning_area, completed_at");

  if (error) throw error;

  return (data ?? []).reduce<Record<string, AreaSummary>>((acc, row) => {
    const existing = acc[row.planning_area];
    if (!existing) {
      acc[row.planning_area] = { count: 1, lastExploredAt: row.completed_at };
    } else {
      existing.count += 1;
      if (row.completed_at > existing.lastExploredAt) {
        existing.lastExploredAt = row.completed_at;
      }
    }
    return acc;
  }, {});
}
