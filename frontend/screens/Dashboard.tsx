import * as React from "react";
import { ScrollView, StatusBar, StyleSheet, View, Text } from "react-native";
import { Image } from "expo-image";
import Text1 from "../components/Text1";
import TextContentTitle from "../components/TextContentTitle";
import ArrowForward from "../components/ArrowForward";
import X from "../assets/X.svg";
import Arrowforward1 from "../assets/arrow-forward.svg";
import { Color, FontSize, FontFamily, Height, Width } from "../GlobalStyles";

const Dashboard = () => {
  return (
    <ScrollView
      style={styles.dashboard}
      contentContainerStyle={styles.dashboardScrollViewContent}
    >
      <StatusBar />

      {/* 1. LOGO SECTION */}
      <View style={styles.logoContainer}>
        <Image
          style={styles.logoImage}
          contentFit="contain"
          source={require("../assets/Untitled-Artwork-1.png")}
        />
      </View>

      {/* 2. TEXT & CONTENT SECTION */}
      <View style={styles.contentContainer}>
        {/* We call Text1 with NO inner text props because it defaults inside its own file */}
        <Text1 />

        {/*
          CRUCIAL FIX: TextContentTitle used to have position: "absolute".
          We wrap it tightly inside an auto-layout style frame so the grey card background
          stretches dynamically around the text instead of letting it clip.
        */}
        <View style={styles.howItWorksCard}>
          <TextContentTitle />
        </View>

        <Text style={styles.footerText}>
          Routlette then algorithmically chooses 3 main food/activities
          and generates a route between them!
        </Text>
      </View>

      {/* 3. BUTTON SECTION */}
      <View style={styles.centeredButtonContainer}>
        <ArrowForward
          size="Medium"
          state="Default"
          variant="Primary"
          iconEnd={
            <X
              style={styles.xIcon}
              width={Width.width_16}
              height={Height.height_16}
            />
          }
          iconStart={
            <Arrowforward1
              style={styles.arrowForwardIcon}
              width={Width.width_16}
              height={Height.height_16}
            />
          }
          hasIconEnd={false}
          hasIconStart
          label="Start Adventure!"
        />
      </View>
    </ScrollView>
  );
};

// 🎨 COMPREHENSIVE FIXES
const styles = StyleSheet.create({
  dashboard: {
    backgroundColor: Color.colorWhite,
    flex: 1,
  },
  dashboardScrollViewContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
    alignItems: "center",
    justifyContent: "flex-start", // Changed to flex-start so content naturally cascades top-to-bottom
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginVertical: 10,
  },
  logoImage: {
    width: 220,
    height: 75,
  },
  contentContainer: {
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
  },
  howItWorksCard: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginVertical: 15,
    padding: 8, // Breathes padding inside the card container
    overflow: "hidden", // Ensures child absolute remnants don't bleed out
  },
  footerText: {
    fontSize: FontSize.fs_16,
    lineHeight: 24,
    fontFamily: FontFamily.inter,
    color: Color.colorGray,
    textAlign: "left",
    marginVertical: 16,
    paddingHorizontal: 10,
  },
  centeredButtonContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  xIcon: {
    display: "none",
  },
  arrowForwardIcon: {
    color: Color.colorGhostwhite,
  },
});

export default Dashboard;