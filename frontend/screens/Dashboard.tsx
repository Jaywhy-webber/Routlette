import * as React from "react";
import {
  StatusBar,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import Text1 from "../components/Text1";
import TextContentTitle from "../components/TextContentTitle";
import ArrowForward from "../components/ArrowForward";
import LogoHeader from "../components/LogoHeader";
import X from "../assets/X.svg";
import Arrowforward1 from "../assets/arrow-forward.svg";
import { Color, FontSize, FontFamily, Height, Width, StyleVariable } from "../GlobalStyles";
import { RootStackParamList } from "../types/navigation";
import { signOut } from "../services/auth";
import { supabase } from "../services/supabase";

type NavProp = NativeStackNavigationProp<RootStackParamList, "ArrowForward">;

const AVATAR_SIZE = 34;
const AVATAR_TOP = StyleVariable.topPadding + 14;
const AVATAR_RIGHT = 20;
const MENU_TOP = AVATAR_TOP + AVATAR_SIZE + 8;
const MENU_RIGHT = AVATAR_RIGHT;

const Dashboard = () => {
  const navigation = useNavigation<NavProp>();
  const [menuVisible, setMenuVisible] = React.useState(false);
  const [initial, setInitial] = React.useState("?");

  const scaleAnim = React.useRef(new Animated.Value(0.88)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setInitial(user.email[0].toUpperCase());
    });
  }, []);

  const openMenu = () => {
    setMenuVisible(true);
    scaleAnim.setValue(0.88);
    opacityAnim.setValue(0);
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 260,
        friction: 22,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeMenu = (callback?: () => void) => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.88,
        useNativeDriver: true,
        tension: 260,
        friction: 22,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setMenuVisible(false);
      callback?.();
    });
  };

  return (
    <View style={styles.root}>
      <View style={styles.dashboard}>
        <StatusBar />
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
          Routlette will immediately stitch together a mystery path consisting
          of three distinct local spots. Follow your compass to track them down! The
          exact names and addresses stay locked until you step within 50 meters!
          Plus, arriving at each destination unlocks an optional, custom side quest
          to truly immerse you in the space.
        </Text>
      </View>

        <View style={styles.centeredButtonContainer}>
          <ArrowForward
            size="Medium"
            state="Default"
            variant="Primary"
            iconEnd={<X width={Width.width_16} height={Height.height_16} />}
            iconStart={<Arrowforward1 width={Width.width_16} height={Height.height_16} />}
            hasIconEnd={false}
            hasIconStart={false}
            label="Start Adventure!"
            onPress={() => navigation.navigate("LocationScreen")}
          />
        </View>
      </View>

      {/* Avatar — fixed top right, outside scroll */}
      <TouchableOpacity
        style={styles.avatar}
        onPress={openMenu}
        activeOpacity={0.75}
      >
        <Text style={styles.avatarInitial}>{initial}</Text>
      </TouchableOpacity>

      {/* Menu */}
      {menuVisible && (
        <>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => closeMenu()}
            activeOpacity={1}
          />
          <Animated.View
            style={[
              styles.menuCard,
              {
                opacity: opacityAnim,
                transform: [
                  { scale: scaleAnim },
                  { translateX: Animated.multiply(
                    Animated.subtract(new Animated.Value(1), scaleAnim),
                    new Animated.Value(80)
                  )},
                  { translateY: Animated.multiply(
                    Animated.subtract(new Animated.Value(1), scaleAnim),
                    new Animated.Value(-20)
                  )},
                ],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.65}
              onPress={() => closeMenu(() => navigation.navigate("SavedRoutesScreen"))}
            >
              <Ionicons name="bookmark-outline" size={18} color={Color.colorGray} style={styles.menuIcon} />
              <Text style={styles.menuItemText}>My Routes</Text>
            </TouchableOpacity>

            <View style={styles.menuSeparator} />

            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.65}
              onPress={() => closeMenu(() => signOut())}
            >
              <Ionicons name="log-out-outline" size={18} color="#dc2626" style={styles.menuIcon} />
              <Text style={[styles.menuItemText, styles.menuItemDestructive]}>Sign Out</Text>
            </TouchableOpacity>
          </Animated.View>
        </>
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Color.colorWhite,
  },
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
  avatar: {
    position: "absolute",
    top: AVATAR_TOP,
    right: AVATAR_RIGHT,
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: Color.colorDarkslateblue,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: 14,
    fontFamily: FontFamily.bodyBold,
    color: Color.colorGhostwhite,
    fontWeight: "700",
  },
  menuCard: {
    position: "absolute",
    top: MENU_TOP,
    right: MENU_RIGHT,
    width: 180,
    backgroundColor: Color.colorWhite,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  menuIcon: {
    marginRight: 10,
  },
  menuItemText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bodyRegular,
    color: Color.colorGray,
  },
  menuItemDestructive: {
    color: "#dc2626",
  },
  menuSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#e5e7eb",
    marginHorizontal: 14,
  },
});

export default Dashboard;
