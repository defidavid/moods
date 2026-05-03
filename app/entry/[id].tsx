import { useEffect, useMemo } from "react";
import { Alert, SafeAreaView, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { Button } from "../../components/Button";
import { IntensityDots } from "../../components/IntensityDots";
import { api, ApiError } from "../../lib/api";
import { useStore } from "../../lib/store";
import { QUADRANTS } from "../../lib/quadrants";
import { colors } from "../../lib/colors";
import { spacing, radius } from "../../lib/spacing";
import { typography } from "../../lib/typography";

export default function EntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const entry = useStore((s) => s.entries.find((e) => e.id === id));
  const emotions = useStore((s) => s.emotions);
  const removeEntry = useStore((s) => s.removeEntry);

  const meta = useMemo(() => {
    const emo = entry ? emotions.find((e) => e.id === entry.emotionId) : null;
    const quadrant = emo?.quadrant ?? "yellow";
    return {
      label: emo?.label ?? entry?.emotionId ?? "",
      color: QUADRANTS[quadrant].color,
    };
  }, [entry, emotions]);

  useEffect(() => {
    if (!entry) {
      const t = setTimeout(() => router.back(), 0);
      return () => clearTimeout(t);
    }
  }, [entry]);

  if (!entry) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  const onDelete = () => {
    Alert.alert("Delete this entry?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.deleteEntry(entry.id);
            removeEntry(entry.id);
            router.back();
          } catch (e) {
            const msg =
              e instanceof ApiError && e.code === "NOT_FOUND"
                ? "Already deleted."
                : "Couldn't delete. Try again.";
            Alert.alert("Delete failed", msg);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ title: meta.label }} />

      <View style={{ height: 6, backgroundColor: meta.color }} />

      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={[typography.display, { marginBottom: spacing.lg }]}>
          {meta.label}
        </Text>

        <Text style={[typography.caption, { marginBottom: spacing.xs }]}>
          Intensity
        </Text>
        <IntensityDots value={entry.intensity} quadrantColor={meta.color} />

        <View style={{ marginTop: spacing.lg }}>
          <Text style={[typography.caption, { marginBottom: spacing.xs }]}>
            Note
          </Text>
          {entry.note ? (
            <Text style={typography.body}>{entry.note}</Text>
          ) : (
            <Text
              style={[
                typography.body,
                { color: colors.textMuted, fontStyle: "italic" },
              ]}
            >
              No note
            </Text>
          )}
        </View>

        <View style={{ marginTop: spacing.lg }}>
          <Text style={[typography.caption, { marginBottom: spacing.xs }]}>
            When
          </Text>
          <Text style={typography.body}>{formatRelative(entry.loggedAt)}</Text>
          <Text style={[typography.caption, { marginTop: spacing.xs }]}>
            {formatAbsolute(entry.loggedAt)}
          </Text>
        </View>

        <Button
          label="Delete"
          variant="ghost"
          onPress={onDelete}
          style={{ marginTop: spacing.xxl, borderRadius: radius.lg }}
          accessibilityLabel="Delete entry"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.max(0, Math.round((now - then) / 1000));
  if (diffSec < 60) return "Just now";
  const min = Math.round(diffSec / 60);
  if (min < 60) return `${min} minute${min === 1 ? "" : "s"} ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? "" : "s"} ago`;
  const day = Math.round(hr / 24);
  return `${day} day${day === 1 ? "" : "s"} ago`;
}

function formatAbsolute(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString([], {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return `${date} · ${time}`;
}
