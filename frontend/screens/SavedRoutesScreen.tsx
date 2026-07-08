import * as React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Color, FontFamily, FontSize, StyleVariable } from "../GlobalStyles";
import { RootStackParamList } from "../types/navigation";
import { SavedRoute } from "../types/savedRoute";
import LogoHeader from "../components/LogoHeader";
import { getSavedRoutes, deleteRoute } from "../services/routes";
import { formatDuration, formatDistance } from "../utils/format";

type NavProp = NativeStackNavigationProp<RootStackParamList, "SavedRoutesScreen">;

function formatSavedAt(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const SavedRoutesScreen = () => {
  const navigation = useNavigation<NavProp>();
  const [routes, setRoutes] = React.useState<SavedRoute[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const data = await getSavedRoutes();
        setRoutes(data);
      } catch (err: any) {
        Alert.alert("Error", err.message ?? "Could not load saved routes.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
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
          <TouchableOpacity
            key={route.id}
            style={styles.card}
            onPress={() => navigation.navigate("SavedRouteDetailScreen", { route })}
            activeOpacity={0.85}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabel}>{route.label}</Text>
              <View style={styles.stopsBadge}>
                <Text style={styles.stopsBadgeText}>3 stops</Text>
              </View>
            </View>

            <Text style={styles.cardDate}>{formatSavedAt(route.saved_at)}</Text>

            <View style={styles.statsRow}>
              <Text style={styles.statText}>{formatDuration(duration)}</Text>
              <Text style={styles.statDivider}>·</Text>
              <Text style={styles.statText}>{formatDistance(route.total_distance)}</Text>
            </View>

            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDelete(route.id)}
            >
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          </TouchableOpacity>
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
    borderRadius: 12,
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
  deleteBtn: {
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: StyleVariable.radius200,
    borderWidth: 1,
    borderColor: "#fca5a5",
    backgroundColor: "#fff1f2",
  },
  deleteBtnText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bodyRegular,
    color: "#dc2626",
    fontWeight: "600",
  },
});

export default SavedRoutesScreen;
