import { Pressable, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { typography } from "../lib/typography";
import { colors } from "../lib/colors";
import { radius, spacing } from "../lib/spacing";

export interface EmotionChipProps {
  label: string;
  onPress: () => void;
}

export function EmotionChip({ label, onPress }: EmotionChipProps) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <Animated.View style={animStyle}>
      <Pressable
        accessibilityRole="button"
        onPressIn={() => (scale.value = withTiming(0.97, { duration: 80 }))}
        onPressOut={() => (scale.value = withTiming(1, { duration: 120 }))}
        onPress={onPress}
        style={{
          height: 40,
          paddingHorizontal: spacing.md,
          borderRadius: radius.pill,
          backgroundColor: colors.textInverse,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.5)",
          alignItems: "center",
          justifyContent: "center",
          marginRight: spacing.sm,
          marginBottom: spacing.sm,
        }}
      >
        <Text style={[typography.bodyEm, { color: colors.text }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}
