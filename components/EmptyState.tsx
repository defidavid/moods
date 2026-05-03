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
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: spacing.xl,
        backgroundColor: colors.bg,
      }}
    >
      <Text
        style={[
          typography.body,
          { color: colors.textMuted, textAlign: "center" },
        ]}
      >
        {message}
      </Text>
    </View>
  );
}
