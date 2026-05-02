# Mobile 06 — Shared Components

## Purpose

Hand-rolled, reusable building blocks under `/components/`. No UI library, no icon library. Each component reads design tokens from `lib/`. Props interfaces are canonical.

## Files to create

- `/components/Button.tsx`
- `/components/QuadrantTile.tsx`
- `/components/EmotionChip.tsx`
- `/components/IntensitySlider.tsx`
- `/components/IntensityDots.tsx`
- `/components/EntryCard.tsx`
- `/components/EmptyState.tsx`

## `Button.tsx`

```tsx
import { Pressable, Text, ViewStyle } from "react-native";
import { colors } from "../lib/colors";
import { radius, spacing } from "../lib/spacing";
import { typography } from "../lib/typography";

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "ghost";
  disabled?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export function Button({
  label, onPress, variant = "primary", disabled, style, accessibilityLabel,
}: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [
        {
          height: 48,
          borderRadius: radius.lg,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: spacing.lg,
          backgroundColor:
            variant === "primary"
              ? disabled ? colors.border : colors.text
              : pressed ? colors.pressedOverlay : "transparent",
          opacity: variant === "primary" && pressed && !disabled ? 0.85 : 1,
        },
        style,
      ]}
    >
      <Text
        style={[
          typography.bodyEm,
          {
            color:
              variant === "primary"
                ? disabled ? colors.textMuted : colors.textInverse
                : colors.text,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}
```

## `QuadrantTile.tsx`

Animated tile used by the log grid. Drives the expand/collapse via Reanimated shared values supplied by the parent screen.

```tsx
import { Pressable, Text, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle, withTiming, Easing, SharedValue,
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
  quadrant, expandedProgress, isExpanding, isIdle, onPress,
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
    <Animated.View style={[styles.tile, { backgroundColor: meta.color }, animatedStyle]}>
      <Pressable
        onPress={onPress}
        disabled={!isIdle}
        accessibilityRole="button"
        accessibilityLabel={meta.label}
        style={styles.press}
      >
        <Text style={[typography.bodyEm, { color: colors.text, textAlign: "center" }]}>
          {meta.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, overflow: "hidden" },
  press: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.md },
});
```

## `EmotionChip.tsx`

```tsx
import { Pressable, Text } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { typography } from "../lib/typography";
import { colors } from "../lib/colors";
import { radius, spacing } from "../lib/spacing";

export interface EmotionChipProps {
  label: string;
  onPress: () => void;
}

export function EmotionChip({ label, onPress }: EmotionChipProps) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
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
```

## `IntensitySlider.tsx`

```tsx
import { Pressable, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { colors } from "../lib/colors";
import { radius } from "../lib/spacing";
import { typography } from "../lib/typography";

export interface IntensitySliderProps {
  value: 1 | 2 | 3 | 4 | 5;
  onChange: (v: 1 | 2 | 3 | 4 | 5) => void;
  quadrantColor: string;
}

const VALUES: Array<1 | 2 | 3 | 4 | 5> = [1, 2, 3, 4, 5];

export function IntensitySlider({ value, onChange, quadrantColor }: IntensitySliderProps) {
  return (
    <View style={{ flexDirection: "row", height: 56, borderRadius: radius.md, overflow: "hidden" }}>
      {VALUES.map((v) => {
        const selected = v === value;
        return (
          <Pressable
            key={v}
            accessibilityRole="button"
            accessibilityLabel={`Intensity ${v}`}
            onPress={() => {
              if (v !== value) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onChange(v);
              }
            }}
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: selected ? quadrantColor : colors.card,
              borderRightWidth: v === 5 ? 0 : 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={[
                typography.bodyEm,
                { color: selected ? colors.textInverse : colors.textMuted },
              ]}
            >
              {v}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
```

## `IntensityDots.tsx`

```tsx
import { View } from "react-native";
import { colors } from "../lib/colors";
import { radius, sizes, spacing } from "../lib/spacing";

export interface IntensityDotsProps {
  value: 1 | 2 | 3 | 4 | 5;
  quadrantColor: string;
}

export function IntensityDots({ value, quadrantColor }: IntensityDotsProps) {
  return (
    <View style={{ flexDirection: "row" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View
          key={i}
          style={{
            width: sizes.dotSm,
            height: sizes.dotSm,
            borderRadius: radius.pill,
            marginRight: i === 5 ? 0 : spacing.xs,
            backgroundColor: i <= value ? quadrantColor : colors.border,
          }}
        />
      ))}
    </View>
  );
}
```

## `EntryCard.tsx`

```tsx
import { Pressable, Text, View } from "react-native";
import type { MoodEntry } from "../lib/types";
import { useStore } from "../lib/store";
import { QUADRANTS } from "../lib/quadrants";
import { colors } from "../lib/colors";
import { radius, sizes, spacing } from "../lib/spacing";
import { typography } from "../lib/typography";
import { IntensityDots } from "./IntensityDots";

export interface EntryCardProps {
  entry: MoodEntry;
  onPress: () => void;
}

export function EntryCard({ entry, onPress }: EntryCardProps) {
  const emotion = useStore((s) => s.emotions.find((e) => e.id === entry.emotionId));
  const quadrant = emotion?.quadrant ?? "yellow";
  const meta = QUADRANTS[quadrant];
  const time = new Date(entry.loggedAt).toLocaleTimeString([], {
    hour: "numeric", minute: "2-digit",
  });

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: pressed ? colors.pressedOverlay : colors.card,
        borderRadius: radius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
        flexDirection: "row",
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
      })}
    >
      <View style={{ width: sizes.accentBar, borderRadius: radius.pill, backgroundColor: meta.color, marginRight: spacing.md }} />
      <View style={{ flex: 1 }}>
        <Text style={typography.bodyEm}>{emotion?.label ?? entry.emotionId}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: spacing.xs }}>
          <IntensityDots value={entry.intensity} quadrantColor={meta.color} />
          <Text style={[typography.caption, { marginLeft: spacing.sm }]}>{time}</Text>
        </View>
        {entry.note ? (
          <Text numberOfLines={1} style={[typography.body, { color: colors.textMuted, marginTop: spacing.xs }]}>
            {entry.note}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
```

## `EmptyState.tsx`

Text-only, no icons.

```tsx
import { Text, View } from "react-native";
import { colors } from "../lib/colors";
import { spacing } from "../lib/spacing";
import { typography } from "../lib/typography";

export interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <View
      style={{
        flex: 1, alignItems: "center", justifyContent: "center",
        padding: spacing.xl, backgroundColor: colors.bg,
      }}
    >
      <Text style={[typography.body, { color: colors.textMuted, textAlign: "center" }]}>
        {message}
      </Text>
    </View>
  );
}
```

## ACs in scope

These are leaf components; ACs are exercised by the screens that compose them:
- AC-05, AC-06, AC-08 — `QuadrantTile`
- AC-07 — `EmotionChip`
- AC-09, AC-10 — `IntensitySlider`
- AC-15, AC-21 — `IntensityDots`, `EntryCard`
- AC-16, AC-19 — `EmptyState`
- AC-22 — `Button` (used as Delete on detail screen)
