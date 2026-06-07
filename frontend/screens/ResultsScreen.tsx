import * as React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Color, FontFamily, FontSize, StyleVariable } from "../GlobalStyles";
import { RootStackParamList } from "../types/navigation";
import { Stop } from "../services/api";
import LogoHeader from "../components/LogoHeader";

type NavProp = NativeStackNavigationProp<RootStackParamList, "ResultsScreen">;
type RouteProps = RouteProp<RootStackParamList, "ResultsScreen">;

// Food vs Activity Stops
const CATEGORY_COLORS: Record<string, string> = {
  food: "#d4a017",
  activity: "#2e7d32",
};

function StopCard({ stop, index }: { stop: Stop; index: number }) {
  const badgeColor = CATEGORY_COLORS[stop.category] ?? Color.colorDarkslateblue;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.stopNumber}>Stop {index + 1}</Text>
        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <Text style={styles.badgeText}>{stop.category.toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.venueName}>{stop.name}</Text>
      <Text style={styles.vibe}>{stop.vibe}</Text>
      <Text style={styles.address}>{stop.address}</Text>

      {/* Static coordinates — Feature 5 */}
      <Text style={styles.coords}>
        {stop.lat.toFixed(5)}, {stop.lng.toFixed(5)}
      </Text>

      <Text style={styles.priceBudget}>{"$".repeat(stop.price_level)}</Text>
    </View>
  );
}

const ResultsScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const { stops, mode } = route.params;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <LogoHeader />
      <Text style={styles.heading}>Your Route</Text>
      <Text style={styles.modeLabel}>Final stop names and locations will not be revealed, and will instead be fed into the navigation function, which is yet to be implemented.</Text>
      <Text style={styles.modeLabel}>Mode: {mode.charAt(0).toUpperCase() + mode.slice(1)}</Text>

      {stops.map((stop, i) => (
        <StopCard key={`${stop.name}-${i}`} stop={stop} index={i} />
      ))}

      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backBtnText}>Back to Filters</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Color.colorWhite,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 40,
    alignItems: "stretch",
  },
  heading: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bodyRegular,
    color: Color.colorGray,
    fontWeight: "700",
    marginBottom: 4,
  },
  modeLabel: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bodyRegular,
    color: Color.colorDarkslateblue,
    marginBottom: 24,
  },
  card: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  stopNumber: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bodyRegular,
    color: Color.colorGray,
    fontWeight: "600",
  },
  badge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bodyRegular,
    color: "#fff",
    fontWeight: "700",
  },
  venueName: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bodyRegular,
    color: Color.colorGray,
    fontWeight: "700",
    marginBottom: 4,
  },
  vibe: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bodyRegular,
    color: Color.colorDarkslateblue,
    fontWeight: "600",
    marginBottom: 4,
  },
  address: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bodyRegular,
    color: "#555",
    marginBottom: 6,
  },
  coords: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bodyRegular,
    color: "#888",
    marginBottom: 6,
  },
  priceBudget: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bodyRegular,
    color: Color.colorDarkslateblue,
  },
  backBtn: {
    marginTop: 16,
    borderWidth: 1.5,
    borderColor: Color.colorDarkslateblue,
    borderRadius: StyleVariable.radius200,
    paddingVertical: 14,
    alignItems: "center",
  },
  backBtnText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bodyRegular,
    color: Color.colorDarkslateblue,
    fontWeight: "600",
  },
});

export default ResultsScreen;
