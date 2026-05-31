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
import { generateRoute } from "../services/api";
import { Color, FontFamily, FontSize, StyleVariable } from "../GlobalStyles";
import { RootStackParamList } from "../types/navigation";
import LogoHeader from "../components/LogoHeader";

// NUS coordinates used as the default location for Milestone 1
// (live GPS input is WIP)
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
];

const ACTIVITY_VIBE_OPTIONS = [
  { value: "Culture", label: "Culture" },
  { value: "Outdoors", label: "Outdoors" },
  { value: "Urban Adventure", label: "Urban Adventure" },
];

type NavProp = NativeStackNavigationProp<RootStackParamList, "FilterScreen">;

// Single-select row
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

// Multi-select row
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

  // Filter state
  const [budget, setBudget] = React.useState(2);
  const [walking, setWalking] = React.useState(5);
  const [mode, setMode] = React.useState("balanced");
  // Vibe selections — all enabled by default
  const [foodVibes, setFoodVibes] = React.useState<string[]>(["Fuel Stop", "Quick & Local", "Main Event"]);
  const [activityVibes, setActivityVibes] = React.useState<string[]>(["Culture", "Outdoors", "Urban Adventure"]);
  const [loading, setLoading] = React.useState(false);

  const toggleVibe = (list: string[], setList: (v: string[]) => void, value: string) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const handleGenerate = async () => {
    // Require at least one vibe selected in each category
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
        lat: DEFAULT_LAT,
        lng: DEFAULT_LNG,
        budget,
        walking,
        mode,
        food_vibes: foodVibes,
        activity_vibes: activityVibes,
      });

      if (result.error || result.stops.length === 0) {
        Alert.alert("No results", result.error ?? "No venues matched. Try relaxing your filters.");
        return;
      }

      // Pass the route data to the results screen
      navigation.navigate("ResultsScreen", { stops: result.stops, mode: result.mode });
    } catch (err) {
      Alert.alert("Connection error", "Could not reach the backend. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <LogoHeader />

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.backLink}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.heading}>Set Your Filters</Text>

      <Text style={styles.label}>Budget</Text>
      <OptionRow options={BUDGET_OPTIONS} selected={budget} onSelect={setBudget} />

      <Text style={styles.label}>Walking Distance</Text>
      <OptionRow options={WALKING_OPTIONS} selected={walking} onSelect={setWalking} />

      {/* Food vibes — multi-select, 2 different ones will be picked for the route */}
      <Text style={styles.label}>Food Vibes</Text>
      <Text style={styles.sublabel}>Pick at least 2 for variety across your food stops</Text>
      <MultiSelectRow
        options={FOOD_VIBE_OPTIONS}
        selected={foodVibes}
        onToggle={(v) => toggleVibe(foodVibes, setFoodVibes, v)}
      />

      {/* Activity vibes — multi-select, one will be picked for the activity stop */}
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Color.colorWhite,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backLink: {
    fontSize: 13,
    fontFamily: FontFamily.inter,
    color: Color.colorDarkslateblue,
    fontWeight: "600",
    marginBottom: 10,
  },
  heading: {
    fontSize: 18,
    fontFamily: FontFamily.inter,
    color: Color.colorGray,
    fontWeight: "700",
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    fontFamily: FontFamily.inter,
    color: Color.colorGray,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 10,
  },
  sublabel: {
    fontSize: 11,
    fontFamily: FontFamily.inter,
    color: "#888",
    marginBottom: 6,
    marginTop: -4,
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  optionBtn: {
    borderRadius: StyleVariable.radius200,
    borderWidth: 1.5,
    borderColor: Color.colorDarkslateblue,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  optionBtnActive: {
    backgroundColor: Color.colorDarkslateblue,
  },
  optionText: {
    fontSize: 13,
    fontFamily: FontFamily.inter,
    color: Color.colorDarkslateblue,
  },
  optionTextActive: {
    color: Color.colorGhostwhite,
  },
  generateBtn: {
    marginTop: 16,
    backgroundColor: Color.colorDarkslateblue,
    borderRadius: StyleVariable.radius200,
    paddingVertical: 12,
    alignItems: "center",
  },
  generateBtnText: {
    fontSize: FontSize.fs_16,
    fontFamily: FontFamily.inter,
    color: Color.colorGhostwhite,
    fontWeight: "600",
  },
});

export default FilterScreen;
