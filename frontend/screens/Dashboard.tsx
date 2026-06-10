import * as React from "react";
import { ScrollView, StatusBar, StyleSheet, View, Text } from "react-native";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Text1 from "../components/Text1";
import TextContentTitle from "../components/TextContentTitle";
import ArrowForward from "../components/ArrowForward";
import LogoHeader from "../components/LogoHeader";
import X from "../assets/X.svg";
import Arrowforward1 from "../assets/arrow-forward.svg";
import { Color, FontSize, FontFamily, Height, Width, StyleVariable } from "../GlobalStyles";
import { RootStackParamList } from "../types/navigation";

type NavProp = NativeStackNavigationProp<RootStackParamList, "ArrowForward">;

const Dashboard = () => {
  const navigation = useNavigation<NavProp>();

  return (
    <ScrollView
      style={styles.dashboard}
      contentContainerStyle={styles.dashboardScrollViewContent}
    >
      <StatusBar />

      {/* 1. LOGO SECTION */}
      <LogoHeader />

      {/* 2. TEXT & CONTENT SECTION */}
      <View style={styles.contentContainer}>
        {/* We call Text1 with NO inner text props because it defaults inside its own file */}
        <Text1 />

        {/*
          background stretches dynamically around the text instead clipping
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
        {/* Navigate to FilterScreen when the user is ready to set their preferences */}
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
          hasIconStart={false}
          label="Start Adventure!"
          onPress={() => navigation.navigate("LocationScreen")}
        />
      </View>
    </ScrollView>
  );
};


const styles = StyleSheet.create({
  dashboard: {
    backgroundColor: Color.colorWhite,
    flex: 1,
  },
  dashboardScrollViewContent: {
    paddingHorizontal: 32,
    paddingTop: StyleVariable.topPadding,
    paddingBottom: 40,
    alignItems: "stretch",
    justifyContent: "flex-start",
  },

  contentContainer: {
    width: "100%",
  },
  howItWorksCard: {
    width: "100%",
    backgroundColor: "#f5f5f5",
    borderRadius: 16,
    marginVertical: 15,
    padding: 8, 
    overflow: "hidden",
  },
  footerText: {
    fontSize: FontSize.base,
    lineHeight: 24,
    fontFamily: FontFamily.bodyRegular,
    color: Color.colorGray,
    textAlign: "left",
    marginVertical: 16,
    paddingHorizontal: 0,
  },
  centeredButtonContainer: {
    width: "100%",
    alignItems: "stretch",
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