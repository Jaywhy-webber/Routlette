import * as React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import Arrowforward1 from "../assets/arrow-forward.svg";
import X from "../assets/X.svg";
import {
  Width,
  Height,
  StyleVariable,
  Color,
  FontSize,
  FontFamily,
} from "../GlobalStyles";

export type ArrowForwardType = {
  iconEnd?: React.ReactNode;
  iconStart?: React.ReactNode;
  hasIconEnd?: boolean;
  hasIconStart?: boolean;
  label?: string;
  onPress?: () => void;

  /** Variant props */
  size?: string;
  state?: string;
  variant?: string;
};

const ArrowForward = ({
  size = "Medium",
  state = "Default",
  variant = "Primary",
  iconEnd,
  iconStart,
  hasIconEnd = false,
  hasIconStart = true,
  label = "Start Adventure!",
  onPress,
}: ArrowForwardType) => {
  return (
    <Pressable style={styles.button} onPress={onPress}>
      {!!hasIconStart && iconStart}
      <Text style={styles.button2}>{label}</Text>
      {!!hasIconEnd && iconEnd}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  iconLayout: {
    width: Width.width_16,
    height: Height.height_16,
  },
  button: {
    borderRadius: StyleVariable.radius200,
    backgroundColor: Color.colorDarkslateblue,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: StyleVariable.space300,
    gap: StyleVariable.space200,
  },
  arrowForwardIcon: {
    color: Color.colorGhostwhite,
  },
  button2: {
    width: 128,
    fontSize: FontSize.base,
    lineHeight: 16,
    fontFamily: FontFamily.bodyRegular,
    color: Color.colorWhitesmoke,
    textAlign: "left",
    height: Height.height_16,
  },
});

export default ArrowForward;
