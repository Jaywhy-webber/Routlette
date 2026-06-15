import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";

import Dashboard from "./screens/Dashboard";
import LocationScreen from "./screens/LocationScreen";
import FilterScreen from "./screens/FilterScreen";
import NavigationScreen from "./screens/NavigationScreen";
import CompletionScreen from "./screens/CompletionScreen";
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
          <Stack.Screen name="ArrowForward" component={Dashboard} />
          <Stack.Screen name="LocationScreen" component={LocationScreen} />
          <Stack.Screen name="FilterScreen" component={FilterScreen} />
          <Stack.Screen name="NavigationScreen" component={NavigationScreen} />
          <Stack.Screen name="CompletionScreen" component={CompletionScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;
