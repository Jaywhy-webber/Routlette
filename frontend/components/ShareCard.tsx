import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import ViewShot from 'react-native-view-shot';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';
import { Color, FontFamily, FontSize } from '../GlobalStyles';
import WhiteLogo from "../assets/logo-white.png"

interface TrailCoordinate {
  latitude: number;
  longitude: number;
}

interface StopDetail {
  name: string;
  address: string;
  category: string;
  vibe: string;
}

interface ShareCardProps {
  trailCoordinates: TrailCoordinate[];
  distanceKm: number;
  durationText: string;
  stops: StopDetail[];
  buttonLabel?: string;
}

const ShareCard: React.FC<ShareCardProps> = ({
  trailCoordinates,
  distanceKm,
  durationText,
  stops,
  buttonLabel = "Share Adventure!"
}) => {
  const viewShotRef = useRef<ViewShot>(null);

  const handleShare = async () => {
    if (viewShotRef.current?.capture) {
      try {
        const uri = await viewShotRef.current.capture();
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share your Routlette Adventure!',
        });
      } catch (error) {
        console.error("Failed to capture share card image:", error);
      }
    }
  };

  const handleDownload = async () => {
    if (viewShotRef.current?.capture) {
      try {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert("Permission Required", "Please allow gallery access to save your map trail.");
          return;
        }
        const uri = await viewShotRef.current.capture();
        await MediaLibrary.saveToLibraryAsync(uri);
        Alert.alert("Saved!", "Your adventure card has been downloaded!");
      } catch (error) {
        console.error("Failed to download share card image:", error);
        Alert.alert("Download Error", "Could not save image to gallery.");
      }
    }
  };

  if (!trailCoordinates || trailCoordinates.length === 0) return null;

  return (
    <View style={styles.container}>
      <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.95 }}>
        <View style={styles.cardFrame}>

          <MapView
            provider={PROVIDER_GOOGLE}
            style={StyleSheet.absoluteFillObject}
            liteMode={true}
            initialRegion={{
              latitude: trailCoordinates[0].latitude,
              longitude: trailCoordinates[0].longitude,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
          >
            <Polyline
              coordinates={trailCoordinates}
              strokeColor="#1d4ed8"
              strokeWidth={5}
            />

          {stops.map((stop, index) => {
            let customPinColor = "#ef4444";
            if (index === 0) customPinColor = "#10b981";
            if (index === stops.length - 1) customPinColor = "#8b5cf6";

            return (
              <Marker
                key={index}
                coordinate={{ latitude: stop.lat, longitude: stop.lng }}
                pinColor={customPinColor}
              />
            );
          })}
        </MapView>

          <View style={styles.darkGradient} />

          <View style={styles.statsOverlay}>
            <Image
              source={WhiteLogo}
              style={styles.cardLogo}
              resizeMode="contain"
            />

            <View style={styles.row}>
              <View>
                <Text style={styles.label}>DISTANCE</Text>
                <Text style={styles.value}>{distanceKm} km</Text>
              </View>
              <View style={{ marginLeft: 24 }}>
                <Text style={styles.label}>TIME</Text>
                <Text style={styles.value}>{durationText}</Text>
              </View>
            </View>

            <View style={styles.stopsList}>
              {stops.map((stop, index) => (
                <Text key={index} style={styles.stopText} numberOfLines={1}>
                  {stop.name}
                </Text>
              ))}
            </View>
          </View>
        </View>
      </ViewShot>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
          <Ionicons name="share-social-outline" size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.iconButton, styles.downloadButton]} onPress={handleDownload}>
          <Ionicons name="download-outline" size={20} color={Color.colorDarkslateblue} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 16,
    width: '100%',
  },
  cardFrame: {
    width: 320,
    height: 569,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#e5e7eb',
  },
  darkGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  statsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  cardLogo: {
    height: 90,
    width: 160,
    marginBottom: 0,
    alignSelf: 'flex-start',
  },
  branding: {
    fontSize: 30,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    color: '#d1d5db',
    fontWeight: '700',
  },
  value: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '800',
  },
  stopsList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.3)',
    paddingTop: 10,
  },
  stopText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginVertical: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    gap: 16,
    width: 320,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Color.colorDarkslateblue,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  downloadButton: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: Color.colorDarkslateblue,
  },
});

export default ShareCard;