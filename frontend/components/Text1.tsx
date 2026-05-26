import * as React from "react";
import { Text, StyleSheet, View } from "react-native";
import { FontSize, FontFamily, Color } from "../GlobalStyles";

export type Text1Type = {
  text?: string;
};

const Text1 = ({
  text = "Tired of repetitive nights out?\n\nAll the ‘hidden gems’ you see online\nare somehow all crowded IRL?\n\nWant to have an adventure in Singapore?\n\nWelcome to Routlette! The first personal\nalgorithmic route finder based on your\npreferences for an outing!",
}: Text1Type) => {
  return (
    <View style={styles.textWrapper}>
      <Text style={styles.textContent}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  textWrapper: {
    width: "100%",
    maxWidth: 290, // 👈 1. Restricts the text block width so it stays compact
    alignSelf: "center", // 👈 2. Centers this entire bounding block on the screen
    paddingVertical: 10,
    justifyContent: "center",
  },
  textContent: {
    fontSize: FontSize.fs_16,
    lineHeight: 20,
    fontFamily: FontFamily.inter,
    color: Color.colorGray,
    textAlign: "left", // 👈 3. Changes the actual paragraphs to be cleanly left-aligned
  },
});

export default Text1;