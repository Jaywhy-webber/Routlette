import { supabase } from "./supabase";
import { Stop } from "./api";
import { SavedRoute } from "../types/savedRoute";

type SaveRouteInput = {
  label: string;
  stops: Stop[];
  mode: string;
  journey_start_time: number;
  journey_end_time: number;
  total_distance: number;
};

export async function saveRoute(input: SaveRouteInput): Promise<SavedRoute> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("saved_routes")
    .insert({ user_id: session.user.id, ...input })
    .select()
    .single();

  if (error) throw error;
  return data as SavedRoute;
}

export async function getSavedRoutes(): Promise<SavedRoute[]> {
  const { data, error } = await supabase
    .from("saved_routes")
    .select("*")
    .order("saved_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as SavedRoute[];
}

export async function deleteRoute(id: string): Promise<void> {
  const { error } = await supabase
    .from("saved_routes")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
