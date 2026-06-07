import * as React from "react";
import { Text, StyleSheet, View } from "react-native";
import { FontSize, FontFamily, Color } from "../GlobalStyles";

export type Text1Type = {
  text?: string;
};

const Text1 = ({
  text = "Tired of repetitive nights out?\n\nAll the ‘hidden gems’ you see online are somehow all crowded IRL?\n\nWant to have an adventure in Singapore?\n\nWelcome to Routlette! The first personal algorithmic route finder based on your preferences for an outing!",
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
    paddingVertical: 12,
  },
  textContent: {
    fontSize: FontSize.base,
    lineHeight: 24,
    fontFamily: FontFamily.bodyRegular,
    color: Color.colorGray,
    textAlign: "left",
  },
});

export default Text1;