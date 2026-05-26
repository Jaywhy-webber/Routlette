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
  align = "Center", // Default to Center
  hasSubtitle = true,
  subtitle = "• enter your location\n• choose your preferences\n• budget\n• radius\n• food choices\n• type of activities\n• adventure mode",
  title = "How Routlette works",
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
    // Removed position: "absolute", top: 238, and left!
    width: "100%",
    alignItems: "center", // ✨ Centers your title and content card contents
    gap: StyleVariable.space200,
    marginVertical: 15,
  },
  title: {
    fontSize: FontSize.fs_24,
    letterSpacing: -0.7,
    lineHeight: 29,
    fontWeight: "700",
    color: Color.colorGray,
    fontFamily: FontFamily.inter,
    textAlign: "center", // ✨ Centered heading title
  },
  subtitle: {
    fontSize: FontSize.fs_16,
    lineHeight: 26, // Expanded for cleaner checklist tracking
    color: Color.colorGray,
    fontFamily: FontFamily.inter,
    textAlign: "left", // Keep the text list left-aligned
    alignSelf: "flex-start", // Anchors bullet stack nicely to the left margin
    paddingLeft: 24,
  },
});

export default TextContentTitle;