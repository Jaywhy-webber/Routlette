import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  LayoutChangeEvent,
  PanResponder,
  PanResponderGestureState,
  Animated,
  NativeTouchEvent,
} from "react-native";
import { Svg, Path, Circle, Text as SvgText } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { Color, FontFamily, FontSize, StyleVariable } from "../GlobalStyles";
import LogoHeader from "../components/LogoHeader";
import RegionCallout from "../components/RegionCallout";
import { getDiscoveredAreaSummaries, AreaSummary } from "../services/discoveries";
import { SG_MAP_VIEWBOX, UNDISCOVERED_COLOR, PLANNING_AREAS, PlanningAreaShape } from "../assets/mapData/planningAreas";

const [, , VIEWBOX_WIDTH, VIEWBOX_HEIGHT] = SG_MAP_VIEWBOX.split(" ").map(Number);
const MAP_ASPECT_RATIO = VIEWBOX_WIDTH / VIEWBOX_HEIGHT;

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const MOVE_THRESHOLD = 10;

// Viewbox units (not screen pixels) — eyeballed against the map's default
// zoomed-out scale, same "pick a value, look at it" approach as the asset
// generator's own SIMPLIFY_TOLERANCE.
const COUNT_BADGE_RADIUS = 12;
const COUNT_BADGE_FONT_SIZE = 15;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const touchDistance = (touches: NativeTouchEvent[]) => {
  const [a, b] = touches;
  return Math.sqrt((a.pageX - b.pageX) ** 2 + (a.pageY - b.pageY) ** 2);
};

const DiscoveryMapScreen = () => {
  const [summaries, setSummaries] = React.useState<Record<string, AreaSummary>>({});
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState<PlanningAreaShape | null>(null);

  React.useEffect(() => {
    getDiscoveredAreaSummaries()
      .then(setSummaries)
      .catch((err: any) => Alert.alert("Error", err.message ?? "Could not load discoveries."))
      .finally(() => setLoading(false));
  }, []);

  const discoveredCount = Object.keys(summaries).length;

  // Animated.Value drives the visual transform; the plain refs alongside them track
  // the current numeric value so gesture math (clamping, deltas) can read it back
  // synchronously — Animated.Value itself doesn't expose a synchronous getter.
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const translateXAnim = React.useRef(new Animated.Value(0)).current;
  const translateYAnim = React.useRef(new Animated.Value(0)).current;

  const scaleValue = React.useRef(1);
  const translateXValue = React.useRef(0);
  const translateYValue = React.useRef(0);
  const savedScale = React.useRef(1);
  const savedTranslateX = React.useRef(0);
  const savedTranslateY = React.useRef(0);
  const gestureStartTranslate = React.useRef({ x: 0, y: 0 });
  const initialPinchDistance = React.useRef<number | null>(null);
  const containerSize = React.useRef({ width: 0, height: 0 });

  const onMapLayout = (e: LayoutChangeEvent) => {
    containerSize.current = {
      width: e.nativeEvent.layout.width,
      height: e.nativeEvent.layout.height,
    };
  };

  const applyTransform = (nextScale: number, nextTranslateX: number, nextTranslateY: number) => {
    const { width, height } = containerSize.current;
    const clampedScale = clamp(nextScale, MIN_SCALE, MAX_SCALE);
    const maxOffsetX = (width * (clampedScale - 1)) / 2;
    const maxOffsetY = (height * (clampedScale - 1)) / 2;
    const clampedX = clamp(nextTranslateX, -maxOffsetX, maxOffsetX);
    const clampedY = clamp(nextTranslateY, -maxOffsetY, maxOffsetY);

    scaleValue.current = clampedScale;
    translateXValue.current = clampedX;
    translateYValue.current = clampedY;

    scaleAnim.setValue(clampedScale);
    translateXAnim.setValue(clampedX);
    translateYAnim.setValue(clampedY);
  };

  const commitGesture = () => {
    savedScale.current = scaleValue.current;
    savedTranslateX.current = translateXValue.current;
    savedTranslateY.current = translateYValue.current;
    initialPinchDistance.current = null;
  };

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState: PanResponderGestureState) =>
        evt.nativeEvent.touches.length === 2 ||
        Math.abs(gestureState.dx) > MOVE_THRESHOLD ||
        Math.abs(gestureState.dy) > MOVE_THRESHOLD,
      onPanResponderGrant: (evt) => {
        gestureStartTranslate.current = { x: translateXValue.current, y: translateYValue.current };
        initialPinchDistance.current =
          evt.nativeEvent.touches.length === 2 ? touchDistance(evt.nativeEvent.touches) : null;
      },
      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;
        if (touches.length === 2) {
          if (initialPinchDistance.current == null) {
            initialPinchDistance.current = touchDistance(touches);
          }
          const scaleDelta = touchDistance(touches) / initialPinchDistance.current;
          applyTransform(savedScale.current * scaleDelta, translateXValue.current, translateYValue.current);
        } else {
          applyTransform(
            scaleValue.current,
            gestureStartTranslate.current.x + gestureState.dx,
            gestureStartTranslate.current.y + gestureState.dy
          );
        }
      },
      onPanResponderRelease: commitGesture,
      onPanResponderTerminate: commitGesture,
    })
  ).current;

  const resetZoom = () => {
    savedScale.current = 1;
    savedTranslateX.current = 0;
    savedTranslateY.current = 0;
    scaleValue.current = 1;
    translateXValue.current = 0;
    translateYValue.current = 0;

    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(translateXAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(translateYAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  return (
    <View style={styles.screen}>
      <LogoHeader />

      <View style={styles.headerRow}>
        <Text style={styles.heading}>Neighbourhoods Discovered</Text>
        <Text style={styles.subheading}>
          {discoveredCount} of {PLANNING_AREAS.length} planning areas explored
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color={Color.colorDarkslateblue} style={styles.spinner} />
      ) : (
        <View style={styles.mapContainer} onLayout={onMapLayout}>
          <Animated.View
            style={[
              styles.mapInner,
              {
                transform: [
                  { translateX: translateXAnim },
                  { translateY: translateYAnim },
                  { scale: scaleAnim },
                ],
              },
            ]}
            {...panResponder.panHandlers}
          >
            <Svg viewBox={SG_MAP_VIEWBOX} style={styles.map}>
              {PLANNING_AREAS.map((region) => {
                const summary = summaries[region.name];
                const discovered = !!summary;
                return (
                  <Path
                    key={region.name}
                    d={region.path}
                    fill={discovered ? region.color : UNDISCOVERED_COLOR}
                    fillRule="evenodd"
                    stroke="#ffffff"
                    strokeWidth={1}
                    onPress={() => setSelected(region)}
                  />
                );
              })}
              {PLANNING_AREAS.map((region) => {
                const summary = summaries[region.name];
                if (!summary) return null; // undiscovered: grey fill already signals this, skip the "0" clutter
                return (
                  <React.Fragment key={`${region.name}-count`}>
                    <Circle
                      cx={region.centroid.x}
                      cy={region.centroid.y}
                      r={COUNT_BADGE_RADIUS}
                      fill="rgba(0,0,0,0.55)"
                      onPress={() => setSelected(region)}
                    />
                    <SvgText
                      x={region.centroid.x}
                      y={region.centroid.y}
                      dy={COUNT_BADGE_FONT_SIZE * 0.35}
                      fontSize={COUNT_BADGE_FONT_SIZE}
                      fontWeight="bold"
                      fill="#ffffff"
                      textAnchor="middle"
                      onPress={() => setSelected(region)}
                    >
                      {summary.count}
                    </SvgText>
                  </React.Fragment>
                );
              })}
            </Svg>
          </Animated.View>

          <TouchableOpacity style={styles.resetZoomBtn} onPress={resetZoom} activeOpacity={0.85}>
            <Ionicons name="refresh" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {selected && (
        <RegionCallout
          name={selected.name}
          count={summaries[selected.name]?.count ?? 0}
          lastExploredAt={summaries[selected.name]?.lastExploredAt}
          path={selected.path}
          bounds={selected.bounds}
          centroid={selected.centroid}
          previewColor={summaries[selected.name] ? selected.color : UNDISCOVERED_COLOR}
          onClose={() => setSelected(null)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Color.colorWhite,
    paddingHorizontal: 24,
    paddingTop: StyleVariable.topPadding,
  },
  headerRow: {
    marginTop: 20,
    marginBottom: 20,
  },
  heading: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bodyBold,
    color: Color.colorGray,
    fontWeight: "700",
  },
  subheading: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bodyRegular,
    color: "#6b7280",
    marginTop: 4,
  },
  spinner: {
    marginTop: 40,
  },
  mapContainer: {
    width: "100%",
    aspectRatio: MAP_ASPECT_RATIO,
    overflow: "hidden",
    position: "relative",
  },
  mapInner: {
    width: "100%",
    height: "100%",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  resetZoomBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    backgroundColor: Color.colorDarkslateblue,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 4,
    elevation: 6,
  },
});

export default DiscoveryMapScreen;
