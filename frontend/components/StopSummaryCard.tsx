import * as React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Color, FontFamily, FontSize } from "../GlobalStyles";
import { Stop } from "../services/api";

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  food: "restaurant",
  activity: "compass",
};

export function StopSummaryCard({ stop, index }: { stop: Stop; index: number }) {
  const [expanded, setExpanded] = React.useState(false);

  const openInGoogleMaps = () => {
    const query = encodeURIComponent(`${stop.name}, ${stop.address}`);
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <TouchableOpacity
      style={styles.stopCard}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.85}
    >
      <View style={styles.stopCardHeader}>
        <Text style={styles.stopNumber}>Stop {index + 1}</Text>
        <View style={styles.badge}>
          <Ionicons
            name={CATEGORY_ICONS[stop.category] ?? "ellipse"}
            size={13}
            color={Color.colorGhostwhite}
          />
          <Text style={styles.badgeText}>{stop.category}</Text>
        </View>
      </View>
      <TouchableOpacity onPress={openInGoogleMaps} activeOpacity={0.7}>
        <Text style={styles.stopName}>{stop.name}</Text>
      </TouchableOpacity>
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

const styles = StyleSheet.create({
  stopCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
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
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Color.colorDarkslateblue,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bodyBold,
    color: Color.colorGhostwhite,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  stopName: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bodyBold,
    color: Color.colorDarkslateblue,
    fontWeight: "700",
    marginBottom: 4,
    textDecorationLine: "underline",
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
});
