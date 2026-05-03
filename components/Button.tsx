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
  label,
  onPress,
  variant = "primary",
  disabled,
  style,
  accessibilityLabel,
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
              ? disabled
                ? colors.border
                : colors.text
              : pressed
                ? colors.pressedOverlay
                : "transparent",
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
                ? disabled
                  ? colors.textMuted
                  : colors.textInverse
                : colors.text,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}
