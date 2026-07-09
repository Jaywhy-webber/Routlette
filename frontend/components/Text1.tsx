import * as React from "react";
import { Text, StyleSheet, View } from "react-native";
import { FontSize, FontFamily, Color } from "../GlobalStyles";

export type Text1Type = {
  text?: string;
};

const Text1 = ({
  text = "Tired of predictable nights out?\n\nAll the 'hidden gems' you see online somehow end up being crowded IRL?\n\nReady to experience Singapore like an unplanned game board?\n\nWelcome to Routlette! A blind adventure engine that maps out secret trails tailored completely to your mood.",
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