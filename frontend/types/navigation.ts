import { Stop } from "../services/api";
import { SavedRoute } from "../types/savedRoute";

export type RootStackParamList = {
  Dashboard: undefined;
  LocationScreen: undefined;
  FilterScreen: { startLat?: number; startLng?: number } | undefined;
  NavigationScreen: { stops: Stop[]; mode: string; journeyStartTime: number; startLat: number; startLng: number };
  CompletionScreen: { stops: Stop[]; mode: string; journeyStartTime: number; totalDistance: number; actualPath?: { latitude: number; longitude: number }[] };
  LoginScreen: undefined;
  RegisterScreen: undefined;
  ForgotPasswordScreen: undefined;
  SavedRoutesScreen: undefined;
  SavedRouteDetailScreen: { route: SavedRoute };
  DiscoveryMapScreen: undefined;
};
