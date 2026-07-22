import * as React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions, LayoutChangeEvent } from "react-native";
import { Svg, Path } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { Color, FontFamily, FontSize } from "../GlobalStyles";
import { formatSavedAt } from "../utils/format";

const SHEET_HEIGHT = Dimensions.get("window").height / 2;
const PREVIEW_PADDING_RATIO = 0.12;

type Bounds = { minX: number; minY: number; maxX: number; maxY: number };
type Centroid = { x: number; y: number };

type Props = {
  name: string;
  count: number;
  lastExploredAt?: string;
  path: string;
  bounds: Bounds;
  centroid: Centroid;
  previewColor: string;
  onClose: () => void;
};

const RegionCallout = ({ name, count, lastExploredAt, path, bounds, centroid, previewColor, onClose }: Props) => {
  // Centering on the bounding box's midpoint looks off for lopsided or
  // scattered (multi-island) shapes, since their visual "weight" isn't at
  // the bbox center. Centering on the true centroid instead — sized to the
  // farther edge in each direction so nothing gets cropped — keeps the
  // shape visually balanced regardless of how irregular it is.
  const shapeWidth = bounds.maxX - bounds.minX;
  const shapeHeight = bounds.maxY - bounds.minY;
  const halfWidth = Math.max(centroid.x - bounds.minX, bounds.maxX - centroid.x);
  const halfHeight = Math.max(centroid.y - bounds.minY, bounds.maxY - centroid.y);
  const padX = shapeWidth * PREVIEW_PADDING_RATIO;
  const padY = shapeHeight * PREVIEW_PADDING_RATIO;
  const viewBoxWidth = 2 * (halfWidth + padX);
  const viewBoxHeight = 2 * (halfHeight + padY);
  const previewViewBox = `${centroid.x - halfWidth - padX} ${centroid.y - halfHeight - padY} ${viewBoxWidth} ${viewBoxHeight}`;

  // Percentage-based width/height on <Svg> nested in a flex container proved
  // unreliable on-device, so we measure the container and pass explicit
  // pixel dimensions instead. Critically, those dimensions are computed to
  // already match the viewBox's own aspect ratio (fitted within the
  // available space) rather than an arbitrary fraction of the container —
  // relying on preserveAspectRatio="meet" to fix an aspect-ratio mismatch
  // is exactly what was causing shapes to clip instead of scale to fit.
  const [previewSize, setPreviewSize] = React.useState({ width: 0, height: 0 });
  const onPreviewLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setPreviewSize({ width, height });
  };

  const availableWidth = previewSize.width * 0.9;
  const availableHeight = previewSize.height * 0.9;
  const viewBoxAspect = viewBoxWidth / viewBoxHeight;
  const availableAspect = availableWidth / availableHeight;
  const displayWidth = viewBoxAspect > availableAspect ? availableWidth : availableHeight * viewBoxAspect;
  const displayHeight = viewBoxAspect > availableAspect ? availableWidth / viewBoxAspect : availableHeight;

  return (
    <Modal visible={true} animationType="slide" transparent={true} onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.sheet} activeOpacity={1} onPress={() => {}}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.name}>{name}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>
          {count > 0 ? (
            <>
              <Text style={styles.detail}>
                {count} completed route{count === 1 ? "" : "s"}
              </Text>
              {lastExploredAt && (
                <Text style={styles.detail}>Last explored: {formatSavedAt(lastExploredAt)}</Text>
              )}
            </>
          ) : (
            <Text style={styles.detail}>Not yet explored</Text>
          )}

          <View style={styles.previewContainer} onLayout={onPreviewLayout}>
            {previewSize.width > 0 && previewSize.height > 0 && (
              <Svg
                width={displayWidth}
                height={displayHeight}
                viewBox={previewViewBox}
                preserveAspectRatio="xMidYMid meet"
              >
                <Path
                  d={path}
                  fill={previewColor}
                  fillRule="evenodd"
                  stroke="#6b7280"
                  strokeWidth={1}
                  strokeLinejoin="round"
                />
              </Svg>
            )}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    width: "100%",
    height: SHEET_HEIGHT,
    backgroundColor: Color.colorWhite,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#d1d5db",
    alignSelf: "center",
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  name: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bodyBold,
    color: Color.colorGray,
    fontWeight: "700",
    flex: 1,
    marginRight: 8,
  },
  detail: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bodyRegular,
    color: "#6b7280",
    marginTop: 2,
  },
  previewContainer: {
    flex: 1,
    marginTop: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 12,
  },
});

export default RegionCallout;
