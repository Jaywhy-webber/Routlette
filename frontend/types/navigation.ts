import { Stop } from "../services/api";

export type RootStackParamList = {
  ArrowForward: undefined;
  LocationScreen: undefined;
  FilterScreen: { startLat?: number; startLng?: number } | undefined;
  NavigationScreen: { stops: Stop[]; mode: string; journeyStartTime: number; startLat: number; startLng: number };
  CompletionScreen: { stops: Stop[]; journeyStartTime: number; totalDistance: number };
};
