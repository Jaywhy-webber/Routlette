import * as React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Location from "expo-location";
import { Color, FontFamily, FontSize, StyleVariable } from "../GlobalStyles";
import { RootStackParamList } from "../types/navigation";
import LogoHeader from "../components/LogoHeader";
import { StopSummaryCard } from "../components/StopSummaryCard";
import { formatDuration, formatDistance } from "../utils/format";

type NavProp = NativeStackNavigationProp<RootStackParamList, "SavedRouteDetailScreen">;
type RouteProps = RouteProp<RootStackParamList, "SavedRouteDetailScreen">;

function formatSavedAt(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const SavedRouteDetailScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const { route: savedRoute } = route.params;

  const [loadingRerun, setLoadingRerun] = React.useState(false);

  const duration = savedRoute.journey_end_time - savedRoute.journey_start_time;

  const handleRerun = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Location Required", "Enable location access to re-run navigation.");
      return;
    }
    setLoadingRerun(true);
    try {
      const loc = await Location.getCurrentPositionAsync({});
      navigation.navigate("NavigationScreen", {
        stops: savedRoute.stops,
        mode: savedRoute.mode,
        journeyStartTime: Date.now(),
        startLat: loc.coords.latitude,
        startLng: loc.coords.longitude,
      });
    } catch {
      Alert.alert("GPS Error", "Could not get your location. Try again.");
    } finally {
      setLoadingRerun(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <LogoHeader />

      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
        <Text style={styles.backLinkText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.heading}>{savedRoute.label}</Text>
      <Text style={styles.subheading}>Saved {formatSavedAt(savedRoute.saved_at)}</Text>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{formatDuration(duration)}</Text>
          <Text style={styles.statLabel}>Total Time</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{formatDistance(savedRoute.total_distance)}</Text>
          <Text style={styles.statLabel}>Distance Walked</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>Your Stops</Text>

      {savedRoute.stops.map((stop, i) => (
        <StopSummaryCard key={`${stop.name}-${i}`} stop={stop} index={i} />
      ))}

      <TouchableOpacity
        style={[styles.rerunBtn, loadingRerun && styles.rerunBtnDisabled]}
        onPress={handleRerun}
        disabled={loadingRerun}
      >
        {loadingRerun ? (
          <ActivityIndicator color={Color.colorGhostwhite} />
        ) : (
          <Text style={styles.rerunBtnText}>Re-run Navigation</Text>
        )}
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
    paddingTop: StyleVariable.topPadding,
    paddingBottom: 48,
  },
  backLink: {
    marginTop: 8,
    marginBottom: 24,
  },
  backLinkText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bodyRegular,
    color: Color.colorDarkslateblue,
  },
  heading: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bodyBold,
    color: Color.colorGray,
    fontWeight: "700",
    marginBottom: 4,
  },
  subheading: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bodyRegular,
    color: "#9ca3af",
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
  rerunBtn: {
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
  rerunBtnDisabled: {
    opacity: 0.6,
  },
  rerunBtnText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bodyBold,
    color: Color.colorGhostwhite,
    fontWeight: "600",
  },
});

export default SavedRouteDetailScreen;
