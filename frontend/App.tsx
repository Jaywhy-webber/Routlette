import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";

import Dashboard from "./screens/Dashboard";
import LocationScreen from "./screens/LocationScreen";
import FilterScreen from "./screens/FilterScreen";
import ResultsScreen from "./screens/ResultsScreen";
import { RootStackParamList } from "./types/navigation";

const Stack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="ArrowForward"
          screenOptions={{ headerShown: false }}
        >
          {/* Landing / dashboard screen */}
          <Stack.Screen name="ArrowForward" component={Dashboard} />
          {/* Location picker — search for starting point (search non-functional in Milestone 1) */}
          <Stack.Screen name="LocationScreen" component={LocationScreen} />
          {/* Filter form — user sets budget, radius, vibes, mode */}
          <Stack.Screen name="FilterScreen" component={FilterScreen} />
          {/* Results — shows the 3-stop route as plain text (Milestone 1, Feature 5) */}
          <Stack.Screen name="ResultsScreen" component={ResultsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;
