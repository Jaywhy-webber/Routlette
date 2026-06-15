import * as React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import MapView, { Region } from "react-native-maps";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import * as Location from "expo-location";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Color, FontFamily, FontSize, StyleVariable } from "../GlobalStyles";
import { RootStackParamList } from "../types/navigation";
import LogoHeader from "../components/LogoHeader";

type NavProp = NativeStackNavigationProp<RootStackParamList, "LocationScreen">;

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_PLACES_API_KEY || "";

// NUS
const DEFAULT_REGION: Region = {
  latitude: 1.2966,
  longitude: 103.7764,
  latitudeDelta: 0.015,
  longitudeDelta: 0.015,
};

const LocationScreen = () => {
  const navigation = useNavigation<NavProp>();
  const mapRef = React.useRef<MapView>(null);
  const autocompleteRef = React.useRef<any>(null);

  const [region, setRegion] = React.useState<Region>(DEFAULT_REGION);
  const [selectedLocation, setSelectedLocation] = React.useState({
    latitude: DEFAULT_REGION.latitude,
    longitude: DEFAULT_REGION.longitude,
    address: "NUS, Singapore",
  });
  const [loadingLocation, setLoadingLocation] = React.useState(true);
  const [hasPermission, setHasPermission] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setHasPermission(false);
        setLoadingLocation(false);

        Alert.alert(
          "Location Disabled",
          "Please look up your address manually.",
          [{ text: "Dismiss", onPress: () => autocompleteRef.current?.focus() }]
        );
        return;
      }

      setHasPermission(true);
      try {
        let location = await Location.getCurrentPositionAsync({});
        const liveRegion = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        };
        setRegion(liveRegion);
        setSelectedLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          address: "Current Location",
        });
        mapRef.current?.animateToRegion(liveRegion, 1000);
      } catch (error) {
        console.error("GPS fetching error:", error);
        Alert.alert("GPS Timeout", "Could not lock GPS signal. Defaulting to manual selection.");
      } finally {
        setLoadingLocation(false);
      }
    })();
  }, []);

  // map panning
  const handleRegionChangeComplete = (newRegion: Region) => {
    setSelectedLocation({
      latitude: newRegion.latitude,
      longitude: newRegion.longitude,
      address: "Map Centered Position",
    });
  };

  return (
    <View style={styles.screen}>
      <View style={styles.searchOverlayContainer}>
        <LogoHeader />

        <View style={styles.headerGroup}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backLink}>← Home</Text>
          </TouchableOpacity>
          <Text style={styles.heading}>Where are you starting?</Text>
        </View>

        <GooglePlacesAutocomplete
          ref={autocompleteRef}
          placeholder="Enter an address..."
          fetchDetails={true}
          onPress={(data, details = null) => {
            if (details) {
              const locationRegion = {
                latitude: details.geometry.location.lat,
                longitude: details.geometry.location.lng,
                latitudeDelta: 0.015,
                longitudeDelta: 0.015,
              };
              setRegion(locationRegion);
              setSelectedLocation({
                latitude: details.geometry.location.lat,
                longitude: details.geometry.location.lng,
                address: data.description,
              });
              mapRef.current?.animateToRegion(locationRegion, 1000);
            }
          }}
          query={{ key: GOOGLE_MAPS_API_KEY, language: "en", components: "country:sg" }}
          styles={{
            textInputContainer: styles.autocompleteInputContainer,
            textInput: styles.autocompleteInput,
            listView: styles.autocompleteListView,
          }}
        />
      </View>

      {loadingLocation ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Color.colorDarkslateblue} />
          <Text style={styles.loaderText}>Syncing GPS data options...</Text>
        </View>
      ) : (
        <>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={region}
            provider="google"
            showsUserLocation={hasPermission === true}
            showsMyLocationButton={hasPermission === true}
            onRegionChangeComplete={handleRegionChangeComplete}
          />

          <View style={styles.staticPinContainer} pointerEvents="none">
            <View style={styles.pinDot} />
            <View style={styles.pinLine} />
          </View>
        </>
      )}

      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity
          style={styles.continueBtn}
          onPress={() => {
            navigation.navigate("FilterScreen", {
              startLat: selectedLocation.latitude,
              startLng: selectedLocation.longitude,
            });
          }}
        >
          <Text style={styles.continueBtnText}>Confirm Starting Location</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Color.colorWhite,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loaderText: {
    marginTop: 12,
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.sm,
    color: "#4b5563",
  },
  searchOverlayContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 32,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingTop: StyleVariable.topPadding,
    paddingBottom: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerGroup: {
    marginBottom: 12,
  },
  backLink: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bodyRegular,
    color: Color.colorDarkslateblue,
    fontWeight: "600",
    marginBottom: 6,
  },
  heading: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bodyBold,
    color: Color.colorGray,
    fontWeight: "700",
  },
  autocompleteInputContainer: {
    width: "100%",
  },
  autocompleteInput: {
    height: 48,
    borderRadius: StyleVariable.radius200,
    borderWidth: 1,
    borderColor: Color.colorDarkslateblue,
    backgroundColor: Color.colorWhite,
    paddingHorizontal: 16,
    fontSize: FontSize.base,
    fontFamily: FontFamily.bodyRegular,
    color: Color.colorGray,
  },
  autocompleteListView: {
    backgroundColor: Color.colorWhite,
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  staticPinContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    zIndex: 5,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateX: -10 }, { translateY: -36 }],
  },
  pinDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Color.colorDarkslateblue,
    borderWidth: 2,
    borderColor: Color.colorWhite,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  pinLine: {
    width: 3,
    height: 18,
    backgroundColor: Color.colorDarkslateblue,
    marginTop: -2,
  },
  bottomButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 32,
    paddingBottom: 40,
    paddingTop: 16,
  },
  continueBtn: {
    backgroundColor: Color.colorDarkslateblue,
    borderRadius: StyleVariable.radius200,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  continueBtnText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bodyBold,
    color: Color.colorGhostwhite,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});

export default LocationScreen;