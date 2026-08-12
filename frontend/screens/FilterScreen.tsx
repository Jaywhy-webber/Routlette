import * as React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { generateRoute } from "../services/api";
import { Color, FontFamily, FontSize, StyleVariable } from "../GlobalStyles";
import { RootStackParamList } from "../types/navigation";
import LogoHeader from "../components/LogoHeader";

const DEFAULT_LAT = 1.2966;
const DEFAULT_LNG = 103.7764;

const BUDGET_OPTIONS = [
  { value: 1, label: "$" },
  { value: 2, label: "$$" },
  { value: 3, label: "$$$" },
  { value: 4, label: "$$$$" },
];

const WALKING_OPTIONS = [
  { value: 1, label: "~3 min" },
  { value: 2, label: "~7 min" },
  { value: 3, label: "~12 min" },
  { value: 4, label: "~18 min" },
  { value: 5, label: "~25 min" },
];

const MODE_OPTIONS = [
  { value: "safe", label: "Safe" },
  { value: "balanced", label: "Balanced" },
  { value: "chaotic", label: "Chaotic" },
];

const FOOD_VIBE_OPTIONS = [
  { value: "Fuel Stop", label: "Fuel Stop" },
  { value: "Quick & Local", label: "Quick & Local" },
  { value: "Main Event", label: "Main Event" },
  { value: "Social Hour", label: "Social Hour" },
  { label: "Coffee", value: "Coffee" },
];

const ACTIVITY_VIBE_OPTIONS = [
  { value: "Culture", label: "Culture" },
  { value: "Outdoors", label: "Outdoors" },
  { value: "Urban Adventure", label: "Urban Adventure" },
];

type NavProp = NativeStackNavigationProp<RootStackParamList, "FilterScreen">;
type RouteProps = import("@react-navigation/native").RouteProp<RootStackParamList, "FilterScreen">;

function OptionRow<T extends string | number>({
  options,
  selected,
  onSelect,
}: {
  options: { value: T; label: string }[];
  selected: T;
  onSelect: (v: T) => void;
}) {
  return (
    <View style={styles.optionRow}>
      {options.map((opt) => (
        <TouchableOpacity
          key={String(opt.value)}
          style={[styles.optionBtn, selected === opt.value && styles.optionBtnActive]}
          onPress={() => onSelect(opt.value)}
        >
          <Text style={[styles.optionText, selected === opt.value && styles.optionTextActive]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function MultiSelectRow({
  options,
  selected,
  onToggle,
}: {
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <View style={styles.optionRow}>
      {options.map((opt) => {
        const active = selected.includes(opt.value);
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.optionBtn, active && styles.optionBtnActive]}
            onPress={() => onToggle(opt.value)}
          >
            <Text style={[styles.optionText, active && styles.optionTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const FilterScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const startLat = route.params?.startLat ?? DEFAULT_LAT;
  const startLng = route.params?.startLng ?? DEFAULT_LNG;

  const [budget, setBudget] = React.useState(2);
  const [walking, setWalking] = React.useState(3);
  const [mode, setMode] = React.useState("balanced");
  const [numFood, setNumFood] = React.useState(2);
  const [numActivities, setNumActivities] = React.useState(1);
  // Vibe selections — all enabled by default
  const [foodVibes, setFoodVibes] = React.useState<string[]>(["Fuel Stop", "Quick & Local", "Main Event", "Social Hour", "Coffee"]);
  const [activityVibes, setActivityVibes] = React.useState<string[]>(["Culture", "Outdoors", "Urban Adventure"]);
  const [loading, setLoading] = React.useState(false);

  const toggleVibe = (list: string[], setList: (v: string[]) => void, value: string) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const handleGenerate = async () => {
    if (foodVibes.length === 0) {
      Alert.alert("Select a food vibe", "Pick at least one food vibe to continue.");
      return;
    }
    if (activityVibes.length === 0) {
      Alert.alert("Select an activity vibe", "Pick at least one activity vibe to continue.");
      return;
    }

    setLoading(true);
    try {
      const result = await generateRoute({
        lat: startLat,
        lng: startLng,
        budget,
        walking,
        mode,
        food_vibes: foodVibes,
        activity_vibes: activityVibes,
        num_food: numFood,
        num_activities: numActivities,
      });

      if (result.error || result.stops.length === 0) {
        Alert.alert("No results", result.error ?? "No venues matched. Try relaxing your filters.");
        return;
      }

      navigation.navigate("NavigationScreen", {
        stops: result.stops,
        mode: result.mode,
        journeyStartTime: Date.now(),
        startLat,
        startLng,
      });
    } catch (err) {
      Alert.alert("Connection error", "Could not reach the backend. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <LogoHeader />

      <View style={styles.headerGroup}>
        <TouchableOpacity
          style={styles.backButtonContainer}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backLink}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.heading}>Set Your Filters</Text>
      </View>

      <Text style={styles.label}>Budget</Text>
      <OptionRow options={BUDGET_OPTIONS} selected={budget} onSelect={setBudget} />

      <Text style={styles.label}>Walking Distance</Text>
      <OptionRow options={WALKING_OPTIONS} selected={walking} onSelect={setWalking} />

      <Text style={styles.label}>Food Stops</Text>
      <OptionRow
        options={[{ value: 1, label: "1" }, { value: 2, label: "2" }, { value: 3, label: "3" }]}
        selected={numFood}
        onSelect={setNumFood}
      />

      <Text style={styles.label}>Food Vibes</Text>
      <Text style={styles.sublabel}>Each food stop will draw from a different vibe where possible</Text>
      <MultiSelectRow
        options={FOOD_VIBE_OPTIONS}
        selected={foodVibes}
        onToggle={(v) => toggleVibe(foodVibes, setFoodVibes, v)}
      />

      <Text style={styles.label}>Activity Stops</Text>
      <OptionRow
        options={[{ value: 1, label: "1" }, { value: 2, label: "2" }, { value: 3, label: "3" }]}
        selected={numActivities}
        onSelect={setNumActivities}
      />

      {/* Activity vibes — multi-select, one will be picked per activity stop */}
      <Text style={styles.label}>Activity Vibes</Text>
      <MultiSelectRow
        options={ACTIVITY_VIBE_OPTIONS}
        selected={activityVibes}
        onToggle={(v) => toggleVibe(activityVibes, setActivityVibes, v)}
      />

      <Text style={styles.label}>Adventure Mode</Text>
      <OptionRow options={MODE_OPTIONS} selected={mode} onSelect={setMode} />

      <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={Color.colorGhostwhite} />
        ) : (
          <Text style={styles.generateBtnText}>Generate Route</Text>
        )}
      </TouchableOpacity>

      <Modal transparent={true} animationType="fade" visible={loading}>
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={Color.colorDarkslateblue} />
            <Text style={styles.loadingTitle}>Mapping Your Adventure...</Text>
            <Text style={styles.loadingSubtitle}>
              This can take up to a minute. Please don't close the app!
            </Text>
          </View>
        </View>
      </Modal>

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
    paddingBottom: 40,
  },
  headerGroup: {
    width: "100%",
    marginTop: 0,
    marginBottom: -10,
  },
  backButtonContainer: {
    alignSelf: 'flex-start',
  },
  backLink: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bodyRegular,
    color: Color.colorDarkslateblue,
    fontWeight: "600",
    marginBottom: 10,
  },
  heading: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bodyBold,
    color: Color.colorGray,
    fontWeight: "700",
    marginBottom: 0,
  },
  label: {
    fontSize: FontSize.semi,
    fontFamily: FontFamily.bodyBold,
    color: Color.colorGray,
    fontWeight: "600",
    marginBottom: 10,
    marginTop: 16,
  },
  sublabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bodyRegular,
    color: "#555555",
    lineHeight: 18,
    marginBottom: 12,
    marginTop: -4,
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  optionBtn: {
    borderRadius: StyleVariable.radius200,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#f9fafb",
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  optionBtnActive: {
    backgroundColor: Color.colorDarkslateblue,
    borderColor: Color.colorDarkslateblue,
  },
  optionText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bodyRegular,
    color: "#4b5563",
    fontWeight: "500",
  },
  optionTextActive: {
    color: Color.colorGhostwhite,
    fontWeight: "600",
  },
  generateBtn: {
    marginTop: 35,
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
  generateBtnText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bodyBold,
    color: Color.colorGhostwhite,
    fontWeight: "600",
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  loadingCard: {
    backgroundColor: Color.colorWhite,
    borderRadius: 10,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  loadingTitle: {
    fontSize: FontSize.semi,
    fontFamily: FontFamily.bodyBold,
    color: Color.colorGray,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bodyRegular,
    color: "#6b7280",
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default FilterScreen;
