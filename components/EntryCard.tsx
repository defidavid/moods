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
  const emotion = useStore((s) =>
    s.emotions.find((e) => e.id === entry.emotionId),
  );
  const quadrant = emotion?.quadrant ?? "yellow";
  const meta = QUADRANTS[quadrant];
  const time = new Date(entry.loggedAt).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
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
      <View
        style={{
          width: sizes.accentBar,
          borderRadius: radius.pill,
          backgroundColor: meta.color,
          marginRight: spacing.md,
        }}
      />
      <View style={{ flex: 1 }}>
        <Text style={typography.bodyEm}>
          {emotion?.label ?? entry.emotionId}
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: spacing.xs,
          }}
        >
          <IntensityDots value={entry.intensity} quadrantColor={meta.color} />
          <Text style={[typography.caption, { marginLeft: spacing.sm }]}>
            {time}
          </Text>
        </View>
        {entry.note ? (
          <Text
            numberOfLines={1}
            style={[
              typography.body,
              { color: colors.textMuted, marginTop: spacing.xs },
            ]}
          >
            {entry.note}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
