import * as React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Color, FontFamily, FontSize, StyleVariable } from "../GlobalStyles";
import { RootStackParamList } from "../types/navigation";
import { Stop } from "../services/api";
import LogoHeader from "../components/LogoHeader";

type NavProp = NativeStackNavigationProp<RootStackParamList, "CompletionScreen">;
type RouteProps = RouteProp<RootStackParamList, "CompletionScreen">;

const CATEGORY_COLORS: Record<string, string> = {
  food: "#d4a017",
  activity: "#2e7d32",
};

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function formatDistance(metres: number): string {
  if (metres >= 1000) return `${(metres / 1000).toFixed(2)} km`;
  return `${Math.round(metres)} m`;
}

function StopSummaryCard({ stop, index }: { stop: Stop; index: number }) {
  const [expanded, setExpanded] = React.useState(false);
  const badgeColor = CATEGORY_COLORS[stop.category] ?? Color.colorDarkslateblue;

  return (
    <TouchableOpacity
      style={styles.stopCard}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.85}
    >
      <View style={styles.stopCardHeader}>
        <Text style={styles.stopNumber}>Stop {index + 1}</Text>
        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <Text style={styles.badgeText}>{stop.category.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.stopName}>{stop.name}</Text>
      <Text style={styles.stopVibe}>{stop.vibe}</Text>

      {expanded && (
        <View style={styles.expandedDetails}>
          <Text style={styles.detailText}>{stop.address}</Text>
          <Text style={styles.detailText}>{"$".repeat(stop.price_level)}</Text>
        </View>
      )}

      <Text style={styles.expandHint}>{expanded ? "Tap to collapse" : "Tap for details"}</Text>
    </TouchableOpacity>
  );
}

const CompletionScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const { stops, journeyStartTime, totalDistance } = route.params;

  const journeyDuration = Date.now() - journeyStartTime;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.screen, { opacity: fadeAnim }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <LogoHeader />

        <Text style={styles.heading}>Adventure Complete</Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{formatDuration(journeyDuration)}</Text>
            <Text style={styles.statLabel}>Total Time</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{formatDistance(totalDistance)}</Text>
            <Text style={styles.statLabel}>Distance Walked</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Your Stops</Text>

        {stops.map((stop, i) => (
          <StopSummaryCard key={`${stop.name}-${i}`} stop={stop} index={i} />
        ))}

        <TouchableOpacity
          style={styles.newAdventureBtn}
          onPress={() => navigation.navigate("ArrowForward")}
        >
          <Text style={styles.newAdventureBtnText}>Start a New Adventure</Text>
        </TouchableOpacity>
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Color.colorWhite,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: StyleVariable.topPadding,
    paddingBottom: 48,
  },
  heading: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bodyBold,
    color: Color.colorGray,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: Color.colorGhostwhite,
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#d1d5db",
  },
  statValue: {
    fontSize: FontSize.semi,
    fontFamily: FontFamily.bodyBold,
    color: Color.colorDarkslateblue,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bodyRegular,
    color: "#6b7280",
  },
  sectionLabel: {
    fontSize: FontSize.semi,
    fontFamily: FontFamily.bodyBold,
    color: Color.colorGray,
    fontWeight: "700",
    marginBottom: 16,
  },
  stopCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  stopCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  stopNumber: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bodyBold,
    color: "#6b7280",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  badge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bodyBold,
    color: "#fff",
    fontWeight: "700",
  },
  stopName: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bodyBold,
    color: Color.colorGray,
    fontWeight: "700",
    marginBottom: 4,
  },
  stopVibe: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bodyRegular,
    color: Color.colorDarkslateblue,
    fontWeight: "600",
    marginBottom: 8,
  },
  expandedDetails: {
    marginTop: 4,
    gap: 4,
    marginBottom: 8,
  },
  detailText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bodyRegular,
    color: "#555",
  },
  expandHint: {
    fontSize: 11,
    fontFamily: FontFamily.bodyRegular,
    color: "#9ca3af",
  },
  newAdventureBtn: {
    marginTop: 24,
    backgroundColor: Color.colorDarkslateblue,
    borderRadius: StyleVariable.radius200,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  newAdventureBtnText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bodyBold,
    color: Color.colorGhostwhite,
    fontWeight: "600",
  },
});

export default CompletionScreen;
