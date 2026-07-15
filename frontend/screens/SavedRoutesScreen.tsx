import * as React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Color, FontFamily, FontSize, StyleVariable } from "../GlobalStyles";
import { RootStackParamList } from "../types/navigation";
import { SavedRoute } from "../types/savedRoute";
import LogoHeader from "../components/LogoHeader";
import { getSavedRoutes, deleteRoute } from "../services/routes";
import { formatDuration, formatDistance, formatSavedAt } from "../utils/format";

type NavProp = NativeStackNavigationProp<RootStackParamList, "SavedRoutesScreen">;

const SavedRoutesScreen = () => {
  const navigation = useNavigation<NavProp>();
  const [routes, setRoutes] = React.useState<SavedRoute[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const fetchRoutes = async () => {
    try {
      const data = await getSavedRoutes();
      setRoutes(data);
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Could not load saved routes.");
    }
  };

  React.useEffect(() => {
    fetchRoutes().finally(() => setLoading(false));
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRoutes();
    setRefreshing(false);
  };

  const handleDelete = async (id: string) => {
    Alert.alert("Delete Route", "Remove this saved route?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteRoute(id);
            setRoutes((prev) => prev.filter((r) => r.id !== id));
          } catch (err: any) {
            Alert.alert("Error", err.message ?? "Could not delete route.");
          }
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      <LogoHeader />

      <View style={styles.headerRow}>
        <Text style={styles.heading}>My Routes</Text>
      </View>

      {loading && <ActivityIndicator color={Color.colorDarkslateblue} style={styles.spinner} />}

      {!loading && routes.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No saved routes yet.</Text>
          <Text style={styles.emptySubtext}>
            Complete an adventure and save it from the completion screen.
          </Text>
        </View>
      )}

      {routes.map((route) => {
        const duration = route.journey_end_time - route.journey_start_time;
        return (
          <Swipeable
            key={route.id}
            renderRightActions={() => (
              <TouchableOpacity
                style={styles.swipeDeleteAction}
                onPress={() => handleDelete(route.id)}
                activeOpacity={0.8}
              >
                <Ionicons name="trash-outline" size={24} color="#fff" />
              </TouchableOpacity>
            )}
            overshootRight={false}
          >
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate("SavedRouteDetailScreen", { route })}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardLabel}>{route.label}</Text>
                <View style={styles.stopsBadge}>
                  <Text style={styles.stopsBadgeText}>{route.stops.length} stops</Text>
                </View>
              </View>

              <Text style={styles.cardDate}>{formatSavedAt(route.saved_at)}</Text>

              <View style={styles.statsRow}>
                <Text style={styles.statText}>{formatDuration(duration)}</Text>
                <Text style={styles.statDivider}>·</Text>
                <Text style={styles.statText}>{formatDistance(route.total_distance)}</Text>
              </View>
            </TouchableOpacity>
          </Swipeable>
        );
      })}
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
  headerRow: {
    marginTop: 20,
    marginBottom: 24,
  },
  heading: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bodyBold,
    color: Color.colorGray,
    fontWeight: "700",
  },
  spinner: {
    marginTop: 40,
  },
  emptyState: {
    marginTop: 60,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: FontSize.semi,
    fontFamily: FontFamily.bodyBold,
    color: Color.colorGray,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bodyRegular,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 22,
  },
  card: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bodyBold,
    color: Color.colorGray,
    fontWeight: "700",
    flex: 1,
    marginRight: 8,
  },
  stopsBadge: {
    backgroundColor: Color.colorDarkslateblue,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  stopsBadgeText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bodyBold,
    color: "#fff",
    fontWeight: "700",
  },
  cardDate: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bodyRegular,
    color: "#9ca3af",
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  statText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bodyRegular,
    color: "#6b7280",
  },
  statDivider: {
    color: "#d1d5db",
  },
  swipeDeleteAction: {
    backgroundColor: "#dc2626",
    justifyContent: "center",
    alignItems: "center",
    width: 72,
    borderRadius: 8,
    marginBottom: 12,
  },
});

export default SavedRoutesScreen;
