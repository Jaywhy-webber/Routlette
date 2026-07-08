import { Stop } from "../services/api";

export type SavedRoute = {
  id: string;
  user_id: string;
  label: string;
  stops: Stop[];
  mode: string;
  journey_start_time: number;
  journey_end_time: number;
  total_distance: number;
  saved_at: string;
};
