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

export function IntensitySlider({
  value,
  onChange,
  quadrantColor,
}: IntensitySliderProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        height: 56,
        borderRadius: radius.md,
        overflow: "hidden",
      }}
    >
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
