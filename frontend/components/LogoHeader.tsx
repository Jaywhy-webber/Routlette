import * as React from "react";
import { View, StyleSheet } from "react-native";
import { Image } from "expo-image";

// Consistent logo header used at the top of every screen
const LogoHeader = () => (
  <View style={styles.container}>
    <Image
      style={styles.logo}
      contentFit="contain"
      source={require("../assets/Untitled-Artwork-1.png")}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 4,
  },
  logo: {
    width: 140,
    height: 46,
  },
});

export default LogoHeader;
