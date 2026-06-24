import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Location from "expo-location";
import { Color, FontFamily, FontSize, StyleVariable } from "../GlobalStyles";
import { RootStackParamList } from "../types/navigation";
import { Stop } from "../services/api";
import LogoHeader from "../components/LogoHeader";

type NavProp = NativeStackNavigationProp<RootStackParamList, "NavigationScreen">;
type RouteProps = RouteProp<RootStackParamList, "NavigationScreen">;

const REVEAL_RADIUS_METRES = 50;
const CATEGORY_COLORS: Record<string, string> = {
  food: "#d4a017",
  activity: "#2e7d32",
};

function haversineMetres(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function bearingDegrees(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function formatDistance(metres: number): string {
  if (metres >= 1000) return `${(metres / 1000).toFixed(1)} km`;
  return `${Math.round(metres)} m`;
}

const NavigationScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const { stops, mode, journeyStartTime, startLat, startLng } = route.params;

  const [currentStopIndex, setCurrentStopIndex] = React.useState(0);
  const [userLat, setUserLat] = React.useState<number | null>(null);
  const [userLng, setUserLng] = React.useState<number | null>(null);
  const [heading, setHeading] = React.useState(0);
  const [distanceMetres, setDistanceMetres] = React.useState<number | null>(null);
  const [revealed, setRevealed] = React.useState(false);
  const [cumulativeDistance, setCumulativeDistance] = React.useState(0);
  const [prevStopCoords, setPrevStopCoords] = React.useState({ lat: startLat, lng: startLng });

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const arrowRotation = React.useRef(new Animated.Value(0)).current;
  const locationSub = React.useRef<Location.LocationSubscription | null>(null);
  const headingSub = React.useRef<Location.LocationSubscription | null>(null);
  const hasRevealedRef = React.useRef(false);

  const currentStop: Stop = stops[currentStopIndex];

  React.useEffect(() => {
    startTracking();
    return () => {
      locationSub.current?.remove();
      headingSub.current?.remove();
    };
  }, [currentStopIndex]);

  const startTracking = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Location Required",
        "Navigation needs location access. Please enable it in settings and try again.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
      return;
    }

    hasRevealedRef.current = false;
    setRevealed(false);
    fadeAnim.setValue(0);

    locationSub.current?.remove();
    locationSub.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 10 },
      (loc) => {
        const lat = loc.coords.latitude;
        const lng = loc.coords.longitude;
        setUserLat(lat);
        setUserLng(lng);

        const dist = haversineMetres(lat, lng, currentStop.lat, currentStop.lng);
        setDistanceMetres(dist);

        if (dist <= REVEAL_RADIUS_METRES && !hasRevealedRef.current) {
          hasRevealedRef.current = true;
          setRevealed(true);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }).start();
        }
      }
    );

    headingSub.current = await Location.watchHeadingAsync((h) => {
      setHeading(h.magHeading);
    });
  };

  React.useEffect(() => {
    if (userLat === null || userLng === null) return;
    const bearing = bearingDegrees(userLat, userLng, currentStop.lat, currentStop.lng);
    const arrowAngle = (bearing - heading + 360) % 360;
    Animated.timing(arrowRotation, {
      toValue: arrowAngle,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [heading, userLat, userLng]);

  const arrowRotateStyle = {
    transform: [
      {
        rotate: arrowRotation.interpolate({
          inputRange: [0, 360],
          outputRange: ["0deg", "360deg"],
        }),
      },
    ],
  };

  const handleArrived = () => {
    const stopLat = currentStop.lat;
    const stopLng = currentStop.lng;
    const legDistance = haversineMetres(prevStopCoords.lat, prevStopCoords.lng, stopLat, stopLng);
    const newCumulative = cumulativeDistance + legDistance;

    if (currentStopIndex < stops.length - 1) {
      setCumulativeDistance(newCumulative);
      setPrevStopCoords({ lat: stopLat, lng: stopLng });
      setCurrentStopIndex(currentStopIndex + 1);
    } else {
      navigation.navigate("CompletionScreen", {
        stops,
        journeyStartTime,
        totalDistance: newCumulative,
      });
    }
  };

  const badgeColor = CATEGORY_COLORS[currentStop.category] ?? Color.colorDarkslateblue;

  return (
    <View style={styles.screen}>
      <LogoHeader />

      <View style={styles.stopCounter}>
        <Text style={styles.stopCounterText}>
          Stop {currentStopIndex + 1} of {stops.length}
        </Text>
        <View style={[styles.categoryBadge, { backgroundColor: badgeColor }]}>
          <Text style={styles.categoryBadgeText}>
            {currentStop.category.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.compassContainer}>
        {distanceMetres !== null ? (
          <Animated.View style={[styles.arrowWrapper, arrowRotateStyle]}>
            <View style={styles.arrowHead} />
            <View style={styles.arrowShaft} />
          </Animated.View>
        ) : (
          <View style={styles.arrowPlaceholder} />
        )}
      </View>

      <Text style={styles.distanceText}>
        {distanceMetres !== null ? formatDistance(distanceMetres) : "Locating..."}
      </Text>

      <Animated.View style={[styles.revealCard, { opacity: fadeAnim }]}>
        <Text style={styles.revealLabel}>You made it!</Text>
        <Text style={styles.revealName}>{currentStop.name}</Text>
        <Text style={styles.revealVibe}>{currentStop.vibe}</Text>
        <View style={[styles.revealCategoryBadge, { backgroundColor: badgeColor }]}>
          <Text style={styles.revealCategoryText}>{currentStop.category.toUpperCase()}</Text>
        </View>

        {revealed && (
          <TouchableOpacity style={styles.arrivedBtn} onPress={handleArrived}>
            <Text style={styles.arrivedBtnText}>
              {currentStopIndex < stops.length - 1
                ? "I'm here — next stop!"
                : "I'm here — finish journey!"}
            </Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      <TouchableOpacity
        style={styles.skipBtn}
        onPress={() => {
          if (!revealed) {
            hasRevealedRef.current = true;
            setRevealed(true);
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }).start();
          } else {
            handleArrived();
          }
        }}
      >
        <Text style={styles.skipBtnText}>{revealed ? "Skip to next" : "Skip (Test)"}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Color.colorWhite,
    paddingTop: StyleVariable.topPadding,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  stopCounter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 24,
    marginBottom: 8,
  },
  stopCounterText: {
    fontSize: FontSize.semi,
    fontFamily: FontFamily.bodyBold,
    color: Color.colorGray,
    fontWeight: "700",
  },
  categoryBadge: {
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  categoryBadgeText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bodyBold,
    color: "#fff",
    fontWeight: "700",
  },
  compassContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Color.colorGhostwhite,
    borderWidth: 2,
    borderColor: Color.colorDarkslateblue,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
    marginBottom: 32,
  },
  arrowWrapper: {
    alignItems: "center",
  },
  arrowHead: {
    width: 0,
    height: 0,
    borderLeftWidth: 18,
    borderRightWidth: 18,
    borderBottomWidth: 36,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: Color.colorDarkslateblue,
  },
  arrowShaft: {
    width: 10,
    height: 40,
    backgroundColor: Color.colorDarkslateblue,
    marginTop: -2,
  },
  arrowPlaceholder: {
    width: 36,
    height: 76,
    backgroundColor: "#d1d5db",
    borderRadius: 4,
  },
  distanceText: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bodyBold,
    color: Color.colorDarkslateblue,
    fontWeight: "700",
    marginBottom: 40,
  },
  revealCard: {
    width: "100%",
    backgroundColor: Color.colorGhostwhite,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Color.colorDarkslateblue,
  },
  revealLabel: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bodyRegular,
    color: "#555",
    marginBottom: 8,
  },
  revealName: {
    fontSize: FontSize.semi,
    fontFamily: FontFamily.bodyBold,
    color: Color.colorGray,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
  },
  revealVibe: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bodyRegular,
    color: Color.colorDarkslateblue,
    fontWeight: "600",
    marginBottom: 10,
  },
  revealCategoryBadge: {
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 20,
  },
  revealCategoryText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bodyBold,
    color: "#fff",
    fontWeight: "700",
  },
  arrivedBtn: {
    width: "100%",
    backgroundColor: Color.colorDarkslateblue,
    borderRadius: StyleVariable.radius200,
    paddingVertical: 14,
    alignItems: "center",
  },
  arrivedBtnText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bodyBold,
    color: Color.colorGhostwhite,
    fontWeight: "600",
  },
  skipBtn: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: StyleVariable.radius200,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#f9fafb",
  },
  skipBtnText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bodyRegular,
    color: "#9ca3af",
  },
});

export default NavigationScreen;
