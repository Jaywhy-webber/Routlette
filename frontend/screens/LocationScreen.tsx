import * as React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import LogoHeader from "../components/LogoHeader";
import { Color, FontFamily, FontSize, StyleVariable } from "../GlobalStyles";
import { RootStackParamList } from "../types/navigation";

type NavProp = NativeStackNavigationProp<RootStackParamList, "LocationScreen">;

const LocationScreen = () => {
  const navigation = useNavigation<NavProp>();
  const [query, setQuery] = React.useState("");

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <LogoHeader />

      <TouchableOpacity onPress={() => navigation.navigate("ArrowForward")}>
        <Text style={styles.homeLink}>← Home</Text>
      </TouchableOpacity>

      <Text style={styles.heading}>Where are you starting?</Text>
      <Text style={styles.subheading}>
        Search for your location or continue with the default area.
      </Text>

      {/* Search input — UI only, location search not yet implemented */}
      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for a location..."
          placeholderTextColor="#aaa"
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <Text style={styles.comingSoon}>
        Live location search coming in a future update.{"\n"}
        Continuing will use the NUS area by default.
      </Text>

      <TouchableOpacity
        style={styles.nextBtn}
        onPress={() => navigation.navigate("FilterScreen")}
      >
        <Text style={styles.nextBtnText}>Continue →</Text>
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
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  homeLink: {
    fontSize: 13,
    fontFamily: FontFamily.inter,
    color: Color.colorDarkslateblue,
    fontWeight: "600",
    marginBottom: 16,
  },
  heading: {
    fontSize: FontSize.fs_24,
    fontFamily: FontFamily.inter,
    color: Color.colorGray,
    fontWeight: "700",
    marginTop: 24,
    marginBottom: 8,
  },
  subheading: {
    fontSize: FontSize.fs_16,
    fontFamily: FontFamily.inter,
    color: "#666",
    marginBottom: 24,
    lineHeight: 22,
  },
  searchBox: {
    borderWidth: 1.5,
    borderColor: Color.colorDarkslateblue,
    borderRadius: StyleVariable.radius200,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  searchInput: {
    fontSize: FontSize.fs_16,
    fontFamily: FontFamily.inter,
    color: Color.colorGray,
  },
  comingSoon: {
    fontSize: 13,
    fontFamily: FontFamily.inter,
    color: "#888",
    lineHeight: 20,
    marginBottom: 40,
  },
  nextBtn: {
    backgroundColor: Color.colorDarkslateblue,
    borderRadius: StyleVariable.radius200,
    paddingVertical: 14,
    alignItems: "center",
  },
  nextBtnText: {
    fontSize: FontSize.fs_16,
    fontFamily: FontFamily.inter,
    color: Color.colorGhostwhite,
    fontWeight: "600",
  },
});

export default LocationScreen;
