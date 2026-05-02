# Mobile 11 — Entry Detail Screen

## Purpose

Read-and-delete view for a single entry. Reads the `id` route param, finds the entry in the store, and renders the quadrant accent strip, emotion label, intensity dots, full note (or muted "No note"), and both relative and absolute timestamps. Delete shows a native confirm; on confirm calls `DELETE /entries/:id`, removes from store, and navigates back.

## Files to create

- `/app/entry/[id].tsx`

## `app/entry/[id].tsx` — full implementation

```tsx
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

  // If we landed here without the entry in the store (e.g. cold link), bounce back.
  useEffect(() => {
    if (!entry) {
      const t = setTimeout(() => router.back(), 0);
      return () => clearTimeout(t);
    }
  }, [entry]);

  if (!entry) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} />;

  const onDelete = () => {
    Alert.alert(
      "Delete this entry?",
      "This can't be undone.",
      [
        { text: "Cancel", style: "cancel" }, // AC-23: no request issued
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
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ title: meta.label }} />

      {/* Quadrant accent strip */}
      <View style={{ height: 6, backgroundColor: meta.color }} />

      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={[typography.display, { marginBottom: spacing.lg }]}>{meta.label}</Text>

        <Text style={[typography.caption, { marginBottom: spacing.xs }]}>Intensity</Text>
        <IntensityDots value={entry.intensity} quadrantColor={meta.color} />

        <View style={{ marginTop: spacing.lg }}>
          <Text style={[typography.caption, { marginBottom: spacing.xs }]}>Note</Text>
          {entry.note ? (
            <Text style={[typography.body]}>{entry.note}</Text>
          ) : (
            <Text style={[typography.body, { color: colors.textMuted, fontStyle: "italic" }]}>No note</Text>
          )}
        </View>

        <View style={{ marginTop: spacing.lg }}>
          <Text style={[typography.caption, { marginBottom: spacing.xs }]}>When</Text>
          <Text style={typography.body}>{formatRelative(entry.loggedAt)}</Text>
          <Text style={[typography.caption, { marginTop: spacing.xs }]}>{formatAbsolute(entry.loggedAt)}</Text>
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
  const date = d.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return `${date} · ${time}`; // e.g. "May 2, 2026 · 6:14 PM"
}
```

## Behavior notes

- **Lookup.** The entry is read from the store via the `id` route param. We never re-fetch a single entry; the Today/Insights flows already populate `entries`. If the entry isn't in the store (cold deep-link in dev, or it was just deleted from elsewhere), we render an empty `SafeAreaView` and `router.back()` on the next tick.
- **Stack header title.** Set per-screen via `<Stack.Screen options={{ title: meta.label }} />` so the platform back chevron and title appear in the stack header configured by `app/_layout.tsx` (`headerShown: true` for `entry/[id]`).
- **Accent strip.** A 6 px high `View` colored with `QUADRANTS[quadrant].color` directly under the safe area / header. Spec calls for "a colored accent matching the quadrant" (AC-21).
- **Intensity.** Reuses `IntensityDots` from step 2.7. Five circles, filled portion in `meta.color`.
- **Note.** Full note text in body type. When `null`, render literal `"No note"` in `colors.textMuted` italic (subdued).
- **Time.** Two lines: relative ("3 hours ago") above absolute ("May 2, 2026 · 6:14 PM"). Format uses a middle dot (`U+00B7`) per AC-21.
- **Delete confirm.** Native `Alert.alert` with two actions; "Cancel" closes with no side effects (AC-23). "Delete" runs the API call.
- **Delete success.** `removeEntry` removes from store; `router.back()` returns to Today, where the list re-renders without the entry (AC-22).
- **Delete failure.**
  - `404 NOT_FOUND`: The server says it doesn't exist. Alert "Already deleted." — the user is then expected to back out manually; the entry remains visible until they refresh Today, which is acceptable for v0.
  - Any other error: Alert "Couldn't delete. Try again." Stay on the screen.

## ACs in scope

- **AC-21** — header shows the emotion label; screen displays quadrant accent, 5 intensity dots, full note (or muted "No note"), relative time AND absolute timestamp formatted "May 2, 2026 · 6:14 PM".
- **AC-22** — Delete + native Alert confirm + success path calls `DELETE /entries/:id`, removes from store, navigates back to `/(tabs)/today`.
- **AC-23** — Cancelling the Alert issues no request and leaves the screen unchanged.
