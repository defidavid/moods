import { Pressable, Text, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
  Easing,
  SharedValue,
} from "react-native-reanimated";
import type { Quadrant } from "../lib/types";
import { QUADRANTS } from "../lib/quadrants";
import { typography } from "../lib/typography";
import { colors } from "../lib/colors";
import { spacing } from "../lib/spacing";

const ANIM = { duration: 280, easing: Easing.out(Easing.cubic) };

export interface QuadrantTileProps {
  quadrant: Quadrant;
  /** 0 when grid is showing, 1 when this tile is the expanded one. */
  expandedProgress: SharedValue<number>;
  /** True when this tile is the one expanding; others fade out. */
  isExpanding: boolean;
  /** True when no tile has been picked yet. */
  isIdle: boolean;
  onPress: () => void;
}

export function QuadrantTile({
  quadrant,
  expandedProgress,
  isExpanding,
  isIdle,
  onPress,
}: QuadrantTileProps) {
  const meta = QUADRANTS[quadrant];

  const animatedStyle = useAnimatedStyle(() => {
    if (isExpanding) {
      return {
        flex: withTiming(1 + expandedProgress.value * 3, ANIM),
        opacity: 1,
      };
    }
    return {
      flex: withTiming(1 - expandedProgress.value, ANIM),
      opacity: withTiming(1 - expandedProgress.value, ANIM),
    };
  });

  return (
    <Animated.View
      style={[styles.tile, { backgroundColor: meta.color }, animatedStyle]}
    >
      <Pressable
        onPress={onPress}
        disabled={!isIdle}
        accessibilityRole="button"
        accessibilityLabel={meta.label}
        style={styles.press}
      >
        <Text
          style={[
            typography.bodyEm,
            { color: colors.text, textAlign: "center" },
          ]}
        >
          {meta.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, overflow: "hidden" },
  press: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
  },
});
