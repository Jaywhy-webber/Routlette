import * as React from "react";
import { Text, StyleSheet, View } from "react-native";
import { Color, FontFamily, StyleVariable, FontSize } from "../GlobalStyles";

export type TextContentTitleType = {
  hasSubtitle?: boolean;
  subtitle?: string;
  title?: string;
  align?: string;
};

const TextContentTitle = ({
  align = "Center",
  hasSubtitle = true,
  subtitle = "• Drop your starting coordinates\n• Adjust your ideal walking radius\n• Set your budget\n• Choose your preferred food & activity vibes\n• Select your adventure mode",
  title = "How to play:",
}: TextContentTitleType) => {
  return (
    <View style={styles.textContentTitle}>
      <Text style={styles.title}>{title}</Text>
      {!!hasSubtitle && (
        <Text style={styles.subtitle}>{subtitle}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  textContentTitle: {
    width: "100%",
    alignItems: "center",
    gap: StyleVariable.space200,
    marginVertical: 15,
  },
  title: {
    fontSize: FontSize.lg,
    letterSpacing: -0.7,
    lineHeight: 29,
    fontWeight: "700",
    color: Color.colorGray,
    fontFamily: FontFamily.bodyBold,
    textAlign: "center",
  },
  subtitle: {
    fontSize: FontSize.base,
    lineHeight: 26,
    color: Color.colorGray,
    fontFamily: FontFamily.bodyRegular,
    textAlign: "left",
    alignSelf: "flex-start",
    paddingLeft: 24,
  },
});

export default TextContentTitle;