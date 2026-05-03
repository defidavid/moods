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
