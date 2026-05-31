import { Stop } from "../services/api";

// Centralised navigation type — imported by screens
// by avoiding circular imports (App imports screens, screens cannot import App)
export type RootStackParamList = {
  ArrowForward: undefined;
  LocationScreen: undefined;
  FilterScreen: undefined;
  ResultsScreen: { stops: Stop[]; mode: string };
};
