import * as React from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
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
import { supabase } from "./services/supabase";
import { ErrorBoundary } from "./components/ErrorBoundary";

const AuthStack = createNativeStackNavigator<RootStackParamList>();
const AppStack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isAuthenticated === null) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#1a2b8a" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <ErrorBoundary>
      <SafeAreaProvider>
      <NavigationContainer>
        {isAuthenticated ? (
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
      </SafeAreaProvider>
    </ErrorBoundary>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});

export default App;
