import * as React from "react";
import { View, Text, StyleSheet } from "react-native";
import PagerView from "react-native-pager-view";
import { Ionicons } from "@expo/vector-icons";
import { Color, FontFamily, FontSize, StyleVariable } from "../GlobalStyles";

type Step = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
};

const STEPS: Step[] = [
  {
    icon: "location-outline",
    title: "Drop Your Pin",
    description: "Set your starting point on the map",
  },
  {
    icon: "options-outline",
    title: "Dial In Your Trip",
    description: "Set your walking radius, budget, vibes, and adventure mode",
  },
  {
    icon: "compass-outline",
    title: "Follow the Compass",
    description: "Navigate to each stop without knowing exactly where you're headed",
  },
  {
    icon: "flag-outline",
    title: "Reach Each Stop",
    description: "Get within 50m to unlock the destination and an optional side quest",
  },
  {
    icon: "bookmark-outline",
    title: "Save Your Adventure",
    description: "Save completed routes to revisit anytime",
  },
];

const CARD_HEIGHT = 190;

// Loop the carousel by padding the real pages with a clone of the last page
// up front and a clone of the first page at the end, then snapping invisibly
// (setPageWithoutAnimation) whenever a clone is reached.
const LOOP_PAGES: Step[] = [STEPS[STEPS.length - 1], ...STEPS, STEPS[0]];

const HowToPlayCarousel = () => {
  const pagerRef = React.useRef<PagerView>(null);
  const [page, setPage] = React.useState(0);

  const handlePageSelected = (e: { nativeEvent: { position: number } }) => {
    const position = e.nativeEvent.position;

    if (position === 0) {
      pagerRef.current?.setPageWithoutAnimation(STEPS.length);
      setPage(STEPS.length - 1);
      return;
    }
    if (position === LOOP_PAGES.length - 1) {
      pagerRef.current?.setPageWithoutAnimation(1);
      setPage(0);
      return;
    }
    setPage(position - 1);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>How to play:</Text>

      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={1}
        onPageSelected={handlePageSelected}
      >
        {LOOP_PAGES.map((step, index) => (
          <View key={index} style={styles.card}>
            <Ionicons name={step.icon} size={32} color={Color.colorDarkslateblue} />
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepDescription}>{step.description}</Text>
          </View>
        ))}
      </PagerView>

      <View style={styles.dots}>
        {STEPS.map((_, index) => (
          <View key={index} style={[styles.dot, index === page && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginVertical: 15,
  },
  heading: {
    fontSize: FontSize.lg,
    letterSpacing: -0.7,
    lineHeight: 29,
    fontWeight: "700",
    color: Color.colorGray,
    fontFamily: FontFamily.bodyBold,
    textAlign: "center",
    marginBottom: StyleVariable.space200,
  },
  pager: {
    height: CARD_HEIGHT,
  },
  card: {
    flex: 1,
    backgroundColor: Color.colorWhitesmoke,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  stepTitle: {
    fontSize: FontSize.semi,
    fontFamily: FontFamily.bodyBold,
    fontWeight: "700",
    color: Color.colorGray,
    marginTop: 10,
    textAlign: "center",
  },
  stepDescription: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bodyRegular,
    color: Color.colorGray,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 22,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#d1d5db",
  },
  dotActive: {
    backgroundColor: Color.colorDarkslateblue,
  },
});

export default HowToPlayCarousel;
