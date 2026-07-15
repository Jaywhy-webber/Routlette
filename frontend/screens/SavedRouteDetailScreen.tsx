import * as React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  Modal,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Location from "expo-location";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { Color, FontFamily, FontSize, StyleVariable } from "../GlobalStyles";
import { RootStackParamList } from "../types/navigation";
import LogoHeader from "../components/LogoHeader";
import { StopSummaryCard } from "../components/StopSummaryCard";
import { formatDuration, formatDistance, formatSavedAt } from "../utils/format";
import ShareCard from "../components/ShareCard";

type NavProp = NativeStackNavigationProp<RootStackParamList, "SavedRouteDetailScreen">;
type RouteProps = RouteProp<RootStackParamList, "SavedRouteDetailScreen">;

const SavedRouteDetailScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const { route: savedRoute } = route.params;

  const [loadingRerun, setLoadingRerun] = React.useState(false);
  const [shareModalVisible, setShareModalVisible] = React.useState(false);
  const mapRef = React.useRef<MapView | null>(null);

  const duration = savedRoute.journey_end_time - savedRoute.journey_start_time;

  const stopCoordinates = savedRoute.stops.map((s) => ({
    latitude: s.lat,
    longitude: s.lng,
  }));

  const trailCoordinates =
    savedRoute.actual_path && savedRoute.actual_path.length > 0
      ? savedRoute.actual_path
      : stopCoordinates;

  const defaultRegion = {
    latitude: savedRoute.stops[0]?.lat ?? 1.2966,
    longitude: savedRoute.stops[0]?.lng ?? 103.7764,
    latitudeDelta: 0.025,
    longitudeDelta: 0.025,
  };

  const handleMapReady = () => {
    const allPoints = [
      ...stopCoordinates,
      ...(savedRoute.actual_path ?? []),
    ];
    if (allPoints.length > 0) {
      mapRef.current?.fitToCoordinates(allPoints, {
        edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
        animated: true,
      });
    }
  };

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
    <View style={styles.screen}>
    <ScrollView contentContainerStyle={styles.content}>
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

      <View style={{ position: 'relative' }}>
        <View style={styles.mapFrame}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={defaultRegion}
            onMapReady={handleMapReady}
            scrollEnabled
            zoomEnabled
            rotateEnabled
            pitchEnabled
          >
            {savedRoute.actual_path && savedRoute.actual_path.length > 1 && (
              <Polyline
                coordinates={savedRoute.actual_path}
                strokeColor="#1a2b8a"
                strokeWidth={5}
              />
            )}
            {savedRoute.stops.map((stop, index) => {
              let pinColor = "#ef4444";
              if (index === 0) pinColor = "#10b981";
              if (index === savedRoute.stops.length - 1) pinColor = "#8b5cf6";
              return (
                <Marker
                  key={index}
                  coordinate={{ latitude: stop.lat, longitude: stop.lng }}
                  title={`Stop ${index + 1}: ${stop.name}`}
                  description={stop.vibe}
                  pinColor={pinColor}
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
            trailCoordinates={trailCoordinates}
            distanceKm={Number((savedRoute.total_distance / 1000).toFixed(2))}
            durationText={formatDuration(duration)}
            stops={savedRoute.stops}
            buttonLabel="Share to Stories"
          />
        </View>
      </View>
    </Modal>
    </View>
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
    height: Dimensions.get("window").height * 0.45,
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
