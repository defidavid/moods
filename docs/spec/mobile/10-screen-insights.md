# Mobile 10 — Insights Screen

## Purpose

A weekly stacked-bar chart of entries per day per quadrant for the past 7 days. Bars are colored by quadrant; segment height is the count of entries in that quadrant on that day. Below the chart, a legend pairs each quadrant color with its display label. Empty state when there are zero entries in the window.

## Files to create

- `/app/(tabs)/insights.tsx`

## `app/(tabs)/insights.tsx` — full implementation

```tsx
import { useMemo, useEffect, useState, useCallback } from "react";
import { Dimensions, SafeAreaView, ScrollView, Text, View } from "react-native";
import { BarChart, type stackDataItem } from "react-native-gifted-charts";
import { useFocusEffect } from "expo-router";
import { EmptyState } from "../../components/EmptyState";
import { api } from "../../lib/api";
import { useStore } from "../../lib/store";
import { QUADRANTS, QUADRANT_ORDER } from "../../lib/quadrants";
import { colors } from "../../lib/colors";
import { radius, sizes, spacing } from "../../lib/spacing";
import { typography } from "../../lib/typography";
import type { MoodEntry, Quadrant } from "../../lib/types";

const DAYS = 7;

export default function InsightsScreen() {
  const entries = useStore((s) => s.entries);
  const emotions = useStore((s) => s.emotions);
  const setEntries = useStore((s) => s.setEntries);
  const [_, setTick] = useState(0);

  // Refresh on focus to pick up new entries.
  useFocusEffect(useCallback(() => {
    api.getEntries().then(setEntries).catch(() => {});
  }, [setEntries]));

  // Re-render at midnight so "today" rolls over.
  useEffect(() => {
    const now = new Date();
    const next = new Date(now);
    next.setHours(24, 0, 0, 0);
    const t = setTimeout(() => setTick((n) => n + 1), next.getTime() - now.getTime());
    return () => clearTimeout(t);
  }, []);

  const { stackData, totalCount } = useMemo(
    () => buildStackData(entries, emotions),
    [entries, emotions]
  );

  const width = Dimensions.get("window").width - spacing.lg * 2;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md }}>
        <Text style={typography.title}>Insights</Text>
        <Text style={[typography.caption, { marginTop: spacing.xs }]}>Past 7 days</Text>
      </View>

      {totalCount === 0 ? (
        <EmptyState message="Log a mood to see your week." />
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingTop: 0 }}>
          <View style={{ backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md }}>
            <BarChart
              stackData={stackData}
              width={width - spacing.md * 2}
              barWidth={22}
              spacing={14}
              noOfSections={Math.max(2, maxStackHeight(stackData))}
              yAxisThickness={0}
              xAxisThickness={1}
              xAxisColor={colors.border}
              rulesColor={colors.border}
              rulesType="solid"
              yAxisTextStyle={{ color: colors.textMuted, fontSize: 12 }}
              xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 12 }}
            />
          </View>

          <Legend />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Legend() {
  return (
    <View style={{ marginTop: spacing.lg }}>
      {QUADRANT_ORDER.map((q) => (
        <View key={q} style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.sm }}>
          <View style={{ width: sizes.dotMd, height: sizes.dotMd, borderRadius: radius.pill, backgroundColor: QUADRANTS[q].color, marginRight: spacing.sm }} />
          <Text style={typography.body}>{QUADRANTS[q].label}</Text>
        </View>
      ))}
    </View>
  );
}

/** Aggregates entries into per-day per-quadrant counts and returns gifted-charts stackData. */
function buildStackData(
  entries: MoodEntry[],
  emotions: Array<{ id: string; quadrant: Quadrant }>
): { stackData: stackDataItem[]; totalCount: number } {
  const emotionMap = new Map(emotions.map((e) => [e.id, e.quadrant]));
  const today = startOfLocalDay(new Date());

  // Build the 7 day-keys, oldest first.
  const days: Date[] = [];
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d);
  }

  // counts[dayIndex][quadrant] -> number
  const counts: Record<Quadrant, number>[] = days.map(() => ({
    yellow: 0, green: 0, red: 0, blue: 0,
  }));

  let total = 0;
  for (const e of entries) {
    const d = startOfLocalDay(new Date(e.loggedAt));
    const idx = days.findIndex((day) => day.getTime() === d.getTime());
    if (idx === -1) continue;
    const q = emotionMap.get(e.emotionId);
    if (!q) continue;
    counts[idx][q] += 1;
    total += 1;
  }

  const stackData: stackDataItem[] = days.map((day, i) => ({
    label: dayLabel(day, i === days.length - 1),
    stacks: QUADRANT_ORDER
      .filter((q) => counts[i][q] > 0)
      .map((q) => ({ value: counts[i][q], color: QUADRANTS[q].color })),
  }));

  return { stackData, totalCount: total };
}

function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dayLabel(d: Date, isToday: boolean): string {
  if (isToday) return "Today";
  return d.toLocaleDateString([], { weekday: "short" }); // "Mon"
}

function maxStackHeight(data: stackDataItem[]): number {
  let max = 0;
  for (const item of data) {
    const sum = (item.stacks ?? []).reduce((acc, s) => acc + s.value, 0);
    if (sum > max) max = sum;
  }
  return max;
}
```

## Aggregation logic

- **Window.** The last 7 local days, inclusive of today. Day boundaries are local midnight (`startOfLocalDay`).
- **Buckets.** A 7-element array indexed by `dayIndex` (0 = oldest, 6 = today). Each element is a `Record<Quadrant, number>` initialized to 0.
- **Mapping.** For each entry, look up the emotion's quadrant via the in-memory map of `emotions`. If the entry has no matching emotion (stale id) or its day is outside the window, skip it.
- **Stacks per bar.** Quadrants with zero count are omitted from that bar's `stacks` array so the bar shrinks naturally rather than rendering invisible segments.
- **Bar order.** Within each bar, segments are stacked in `QUADRANT_ORDER` (`yellow → red → green → blue`) for visual stability across days.
- **Empty state.** If `totalCount === 0` after aggregation, render `EmptyState` with the literal text `"Log a mood to see your week."` (AC-19).

## Behavior notes

- `useFocusEffect` re-fetches when the tab is opened so a freshly logged mood from the Log tab appears.
- A `setTimeout` to local midnight schedules a re-render so the rightmost bar relabels from "Today" to "Mon" automatically. We don't strictly need this for v0, but it's cheap and prevents stale-day display in long-running sessions.
- Chart container uses `colors.card` background, `radius` matching design system. Axis colors use `colors.border`; tick labels use `colors.textMuted`.
- Legend is below the chart, one row per quadrant, full display label from `QUADRANTS[q].label` (AC-20).
- No animations beyond `gifted-charts` defaults. Do not enable interactivity (tap to highlight); v0 chart is read-only.

## Imports

- `BarChart`, `stackDataItem` from `react-native-gifted-charts`.
- `EmptyState` from `../../components/EmptyState`.
- `QUADRANTS`, `QUADRANT_ORDER` from `../../lib/quadrants`.
- `useStore`, `api` for state and refresh.

## ACs in scope

- **AC-18** — stacked bar chart with one bar per day for the past 7 days, oldest left/today right. Segments colored by quadrant; height = count.
- **AC-19** — empty state copy exactly "Log a mood to see your week." when there are zero entries in the window.
- **AC-20** — legend pairs each quadrant color with its display label.
