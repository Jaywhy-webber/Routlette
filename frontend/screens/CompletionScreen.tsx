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
  Modal,
  Keyboard,
  Platform,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Color, FontFamily, FontSize, StyleVariable } from "../GlobalStyles";
import { RootStackParamList } from "../types/navigation";
import LogoHeader from "../components/LogoHeader";
import { StopSummaryCard } from "../components/StopSummaryCard";
import { formatDuration, formatDistance } from "../utils/format";
import { saveRoute } from "../services/routes";
import { recordRouteCompletion } from "../services/discoveries";
import ShareCard from "../components/ShareCard";
import { useAuthMode } from "../context/AuthModeContext";
import { stashPendingRoute } from "../services/pendingRoute";

type NavProp = NativeStackNavigationProp<RootStackParamList, "CompletionScreen">;
type RouteProps = RouteProp<RootStackParamList, "CompletionScreen">;

type SaveStatus = "idle" | "saving" | "saved" | "error";

const CompletionScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const { authMode, setAuthMode } = useAuthMode();

  const { stops, mode, journeyStartTime, totalDistance, actualPath = [] } = route.params;

  const journeyDuration = Date.now() - journeyStartTime;
  const journeyEndTime = React.useRef(Date.now()).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const mapRef = React.useRef<MapView | null>(null);
  const scrollViewRef = React.useRef<ScrollView | null>(null);

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
  const [shareModalVisible, setShareModalVisible] = React.useState(false);
  const [finalDurationText, setFinalDurationText] = React.useState(() =>
    formatDuration(Date.now() - journeyStartTime)
  );
  const [keyboardHeight, setKeyboardHeight] = React.useState(0);

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const completionRecordedRef = React.useRef(false);

  React.useEffect(() => {
    if (completionRecordedRef.current) return;
    if (authMode !== "authenticated") return; // avoids a Supabase round-trip for guests; service also no-ops defensively
    completionRecordedRef.current = true;
    recordRouteCompletion(stops, journeyStartTime, journeyEndTime).catch(() => {
      // Passive background tracking — never surface an Alert or block the
      // screen, unlike handleSave's explicit error path.
    });
  }, [authMode]);

  React.useEffect(() => {
    // "will" fires as soon as iOS knows the keyboard's final height, before
    // it starts rising — using that (rather than "did", which waits for the
    // rise animation to finish) is what lets the padding below apply in the
    // same render pass as the keyboard appearing, instead of one animated
    // step behind it. Android has no reliable "will" event.
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  React.useEffect(() => {
    if (keyboardHeight > 0) {
      scrollViewRef.current?.scrollToEnd({ animated: false });
    }
  }, [keyboardHeight]);

  const handleMapReady = () => {
    const allPoints = [...stopCoordinates, ...actualPath];
    if (allPoints.length > 0) {
      mapRef.current?.fitToCoordinates(allPoints, {
        edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
        animated: true,
      });
    }
  };

  const handleGuestSignUpPrompt = async () => {
    await stashPendingRoute(route.params);
    setAuthMode("unauthenticated");
  };

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
        actual_path: actualPath.length > 0 ? actualPath : undefined,
      });
      setSaveStatus("saved");
    } catch (err: any) {
      setSaveStatus("error");
      Alert.alert("Save failed", err.message ?? "Could not save route.");
    }
  };

  return (
    <Animated.View style={[styles.screen, { opacity: fadeAnim }]}>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[styles.content, { paddingBottom: 48 + keyboardHeight }]}
        keyboardShouldPersistTaps="handled"
      >
        <LogoHeader />

        <Text style={styles.heading}>Adventure Complete</Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{finalDurationText || "0m 0s"}</Text>
            <Text style={styles.statLabel}>Total Time</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{formatDistance(totalDistance)}</Text>
            <Text style={styles.statLabel}>Distance Walked</Text>
          </View>
        </View>

        <View style={{ position: 'relative' }}>
          <View style={styles.mapFrame}>
            <MapView
              ref={mapRef}
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              initialRegion={defaultRegion}
              onMapReady={handleMapReady}
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
                let customPinColor = "#ef4444";
                if (index === 0) customPinColor = "#10b981";
                if (index === stops.length - 1) customPinColor = "#8b5cf6";

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

          <TouchableOpacity
            style={styles.floatingShareBtn}
            onPress={() => setShareModalVisible(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="share-social-outline" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>Your Stops</Text>

        {stops.map((stop, i) => (
          <StopSummaryCard key={`${stop.name}-${i}`} stop={stop} index={i} />
        ))}

        <View style={styles.saveSection}>
          <Text style={styles.saveSectionLabel}>Save this route</Text>
          {authMode === "guest" ? (
            <TouchableOpacity style={styles.saveBtn} onPress={handleGuestSignUpPrompt}>
              <Text style={styles.saveBtnText}>Sign up to save this route</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TextInput
                style={styles.labelInput}
                placeholder="Name this route"
                placeholderTextColor="#9ca3af"
                value={label}
                onChangeText={setLabel}
                onFocus={() => {
                  if (keyboardHeight > 0) scrollViewRef.current?.scrollToEnd({ animated: false });
                }}
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
            </>
          )}
        </View>

        <TouchableOpacity
          style={styles.newAdventureBtn}
          onPress={() => navigation.navigate("Dashboard")}
        >
          <Text style={styles.newAdventureBtnText}>Start a New Adventure</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={shareModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShareModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Your Adventure Card</Text>
              <TouchableOpacity onPress={() => setShareModalVisible(false)}>
                <Ionicons name="close-circle" size={26} color="#9ca3af" />
              </TouchableOpacity>
            </View>
            <ShareCard
              trailCoordinates={actualPath}
              distanceKm={Number((totalDistance / 1000).toFixed(2))}
              durationText={finalDurationText}
              stops={stops}
              buttonLabel="Share to Stories"
            />
          </View>
        </View>
      </Modal>
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
    borderRadius: 8,
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
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: Color.colorDarkslateblue,
    marginBottom: 32,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  floatingShareBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: Color.colorDarkslateblue,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 4,
    elevation: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: 345,
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingTop: 30,
    paddingHorizontal: 16,
    paddingBottom: 10,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 0,
    paddingHorizontal: 4,
  },
  modalTitle: {
    fontSize: 23,
    fontFamily: FontFamily.bodyBold,
    color: Color.colorGray,
    fontWeight: '700',
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
    borderRadius: 8,
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
