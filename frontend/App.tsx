import * as React from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { NavigationContainer, useNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import Dashboard from "./screens/Dashboard";
import LocationScreen from "./screens/LocationScreen";
import FilterScreen from "./screens/FilterScreen";
import NavigationScreen from "./screens/NavigationScreen";
import CompletionScreen from "./screens/CompletionScreen";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen";
import SavedRoutesScreen from "./screens/SavedRoutesScreen";
import SavedRouteDetailScreen from "./screens/SavedRouteDetailScreen";
import { RootStackParamList } from "./types/navigation";
import { AuthModeProvider, useAuthMode } from "./context/AuthModeContext";
import { consumePendingRoute, PendingRoutePayload } from "./services/pendingRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";

const AuthStack = createNativeStackNavigator<RootStackParamList>();
const AppStack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  const { authMode } = useAuthMode();
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const pendingRouteCheckedRef = React.useRef(false);
  const pendingPayloadRef = React.useRef<PendingRoutePayload | null>(null);

  const tryFlushPendingRoute = React.useCallback(() => {
    if (!pendingPayloadRef.current) return;
    if (!navigationRef.isReady()) return;
    const payload = pendingPayloadRef.current;
    pendingPayloadRef.current = null;
    navigationRef.navigate("CompletionScreen", payload);
  }, [navigationRef]);

  React.useEffect(() => {
    if (pendingRouteCheckedRef.current) return;
    if (authMode !== "guest" && authMode !== "authenticated") return;
    pendingRouteCheckedRef.current = true;

    consumePendingRoute().then((payload) => {
      if (!payload) return;
      pendingPayloadRef.current = payload;
      tryFlushPendingRoute();
    });
  }, [authMode, tryFlushPendingRoute]);

  if (authMode === "loading") {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#1a2b8a" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} onReady={tryFlushPendingRoute}>
      {authMode === "authenticated" || authMode === "guest" ? (
        <AppStack.Navigator
          initialRouteName="Dashboard"
          screenOptions={{ headerShown: false }}
        >
          <AppStack.Screen name="Dashboard" component={Dashboard} />
          <AppStack.Screen name="LocationScreen" component={LocationScreen} />
          <AppStack.Screen name="FilterScreen" component={FilterScreen} />
          <AppStack.Screen name="NavigationScreen" component={NavigationScreen} />
          <AppStack.Screen name="CompletionScreen" component={CompletionScreen} />
          <AppStack.Screen name="SavedRoutesScreen" component={SavedRoutesScreen} />
          <AppStack.Screen name="SavedRouteDetailScreen" component={SavedRouteDetailScreen} />
        </AppStack.Navigator>
      ) : (
        <AuthStack.Navigator
          initialRouteName="LoginScreen"
          screenOptions={{ headerShown: false }}
        >
          <AuthStack.Screen name="LoginScreen" component={LoginScreen} />
          <AuthStack.Screen name="RegisterScreen" component={RegisterScreen} />
          <AuthStack.Screen name="ForgotPasswordScreen" component={ForgotPasswordScreen} />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
};

const App = () => (
  <GestureHandlerRootView style={{ flex: 1 }}>
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthModeProvider>
          <RootNavigator />
        </AuthModeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  </GestureHandlerRootView>
);

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});

export default App;
