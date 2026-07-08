import * as React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Color, FontFamily, FontSize } from "../GlobalStyles";
import { Stop } from "../services/api";

export const CATEGORY_COLORS: Record<string, string> = {
  food: "#d4a017",
  activity: "#2e7d32",
};

export function StopSummaryCard({ stop, index }: { stop: Stop; index: number }) {
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

const styles = StyleSheet.create({
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
});
