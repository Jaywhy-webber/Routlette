import * as React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Animated,
  Dimensions,
  Alert,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Color, FontFamily, FontSize, StyleVariable } from "../GlobalStyles";
import { RootStackParamList } from "../types/navigation";
import LogoHeader from "../components/LogoHeader";
import { StopSummaryCard } from "../components/StopSummaryCard";
import { formatDuration, formatDistance } from "../utils/format";
import { saveRoute } from "../services/routes";

type NavProp = NativeStackNavigationProp<RootStackParamList, "CompletionScreen">;
type RouteProps = RouteProp<RootStackParamList, "CompletionScreen">;

type SaveStatus = "idle" | "saving" | "saved" | "error";

const CompletionScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();

  const { stops, mode, journeyStartTime, totalDistance, actualPath = [] } = route.params;

  const journeyDuration = Date.now() - journeyStartTime;
  const journeyEndTime = React.useRef(Date.now()).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const mapRef = React.useRef<MapView | null>(null);

  const defaultRegion = {
    latitude: stops[0]?.lat ?? 1.2966,
    longitude: stops[0]?.lng ?? 103.7764,
    latitudeDelta: 0.025,
    longitudeDelta: 0.025,
  };

  const stopCoordinates = stops.map(stop => ({
    latitude: stop.lat,
    longitude: stop.lng,
  }));

  const [label, setLabel] = React.useState("");
  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>("idle");

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    if (mapRef.current) {
      const allPointsToFrame = [...stopCoordinates, ...actualPath];

      if (allPointsToFrame.length > 0) {
        mapRef.current.fitToCoordinates(allPointsToFrame, {
          edgePadding: {
            top: 60,
            right: 60,
            bottom: 60,
            left: 60
          },
          animated: true,
        });
      }
    }
  }, [actualPath, stops]);

  const handleSave = async () => {
    if (!label.trim()) {
      Alert.alert("Name required", "Please enter a name for this route.");
      return;
    }
    setSaveStatus("saving");
    try {
      await saveRoute({
        label: label.trim(),
        stops,
        mode,
        journey_start_time: journeyStartTime,
        journey_end_time: journeyEndTime,
        total_distance: totalDistance,
      });
      setSaveStatus("saved");
    } catch (err: any) {
      setSaveStatus("error");
      Alert.alert("Save failed", err.message ?? "Could not save route.");
    }
  };

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

        <View style={styles.mapFrame}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={defaultRegion}
            scrollEnabled={true}
            zoomEnabled={true}
            rotateEnabled={true}
            pitchEnabled={true}
          >

            {actualPath.length > 1 && (
              <Polyline
                coordinates={actualPath}
                strokeColor="#1a2b8a"
                strokeWidth={5}
              />
            )}

            {stops.map((stop, index) => {
              let customPinColor = "#ef4444"; // red
              if (index === 0) customPinColor = "#10b981"; // green
              if (index === stops.length - 1) customPinColor = "#8b5cf6"; // purple

              return (
                <Marker
                  key={index}
                  coordinate={{ latitude: stop.lat, longitude: stop.lng }}
                  title={`Stop ${index + 1}: ${stop.name}`}
                  description={stop.vibe}
                  pinColor={customPinColor}
                />
              );
            })}
          </MapView>
        </View>

        <Text style={styles.sectionLabel}>Your Stops</Text>

        {stops.map((stop, i) => (
          <StopSummaryCard key={`${stop.name}-${i}`} stop={stop} index={i} />
        ))}

        <View style={styles.saveSection}>
          <Text style={styles.saveSectionLabel}>Save this route</Text>
          <TextInput
            style={styles.labelInput}
            placeholder="Name this route"
            placeholderTextColor="#9ca3af"
            value={label}
            onChangeText={setLabel}
            editable={saveStatus !== "saving" && saveStatus !== "saved"}
            maxLength={60}
          />
          <TouchableOpacity
            style={[
              styles.saveBtn,
              (saveStatus === "saving" || saveStatus === "saved") && styles.saveBtnDisabled,
            ]}
            onPress={handleSave}
            disabled={saveStatus === "saving" || saveStatus === "saved"}
          >
            <Text style={styles.saveBtnText}>
              {saveStatus === "saved" ? "Saved" : saveStatus === "saving" ? "Saving..." : "Save Route"}
            </Text>
          </TouchableOpacity>
          {saveStatus === "error" && (
            <Text style={styles.errorText}>Save failed. Try again.</Text>
          )}
        </View>

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
  mapFrame: {
    width: "100%",
    height: Dimensions.get("window").height * 0.55,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: Color.colorDarkslateblue,
    marginBottom: 32,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  sectionLabel: {
    fontSize: FontSize.semi,
    fontFamily: FontFamily.bodyBold,
    color: Color.colorGray,
    fontWeight: "700",
    marginBottom: 16,
  },
  saveSection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: Color.colorGhostwhite,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 16,
  },
  saveSectionLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bodyBold,
    color: "#6b7280",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  labelInput: {
    height: 44,
    borderWidth: 1.5,
    borderColor: Color.colorDarkslateblue,
    borderRadius: StyleVariable.radius200,
    paddingHorizontal: 12,
    fontSize: FontSize.base,
    fontFamily: FontFamily.bodyRegular,
    color: Color.colorGray,
    backgroundColor: Color.colorWhite,
    marginBottom: 12,
  },
  saveBtn: {
    backgroundColor: Color.colorDarkslateblue,
    borderRadius: StyleVariable.radius200,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bodyBold,
    color: Color.colorGhostwhite,
    fontWeight: "600",
  },
  errorText: {
    marginTop: 8,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bodyRegular,
    color: "#dc2626",
    textAlign: "center",
  },
  newAdventureBtn: {
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: Color.colorDarkslateblue,
    borderRadius: StyleVariable.radius200,
    paddingVertical: 14,
    alignItems: "center",
  },
  newAdventureBtnText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bodyBold,
    color: Color.colorDarkslateblue,
    fontWeight: "600",
  },
});

export default CompletionScreen;
