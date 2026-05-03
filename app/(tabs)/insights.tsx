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
  const [, setTick] = useState(0);

  useFocusEffect(
    useCallback(() => {
      api
        .getEntries()
        .then(setEntries)
        .catch(() => {});
    }, [setEntries]),
  );

  useEffect(() => {
    const now = new Date();
    const next = new Date(now);
    next.setHours(24, 0, 0, 0);
    const t = setTimeout(
      () => setTick((n) => n + 1),
      next.getTime() - now.getTime(),
    );
    return () => clearTimeout(t);
  }, []);

  const { stackData, totalCount } = useMemo(
    () => buildStackData(entries, emotions),
    [entries, emotions],
  );

  const width = Dimensions.get("window").width - spacing.lg * 2;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        style={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.lg,
          paddingBottom: spacing.md,
        }}
      >
        <Text style={typography.title}>Insights</Text>
        <Text style={[typography.caption, { marginTop: spacing.xs }]}>
          Past 7 days
        </Text>
      </View>

      {totalCount === 0 ? (
        <EmptyState message="Log a mood to see your week." />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: spacing.lg, paddingTop: 0 }}
        >
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: radius.md,
              padding: spacing.md,
            }}
          >
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
        <View
          key={q}
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: spacing.sm,
          }}
        >
          <View
            style={{
              width: sizes.dotMd,
              height: sizes.dotMd,
              borderRadius: radius.pill,
              backgroundColor: QUADRANTS[q].color,
              marginRight: spacing.sm,
            }}
          />
          <Text style={typography.body}>{QUADRANTS[q].label}</Text>
        </View>
      ))}
    </View>
  );
}

function buildStackData(
  entries: MoodEntry[],
  emotions: Array<{ id: string; quadrant: Quadrant }>,
): { stackData: stackDataItem[]; totalCount: number } {
  const emotionMap = new Map(emotions.map((e) => [e.id, e.quadrant]));
  const today = startOfLocalDay(new Date());

  const days: Date[] = [];
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d);
  }

  const counts: Record<Quadrant, number>[] = days.map(() => ({
    yellow: 0,
    green: 0,
    red: 0,
    blue: 0,
  }));

  let total = 0;
  for (const e of entries) {
    const d = startOfLocalDay(new Date(e.loggedAt));
    const idx = days.findIndex((day) => day.getTime() === d.getTime());
    if (idx === -1) {
      continue;
    }
    const bucket = counts[idx];
    if (!bucket) {
      continue;
    }
    const q = emotionMap.get(e.emotionId);
    if (!q) {
      continue;
    }
    bucket[q] += 1;
    total += 1;
  }

  const stackData: stackDataItem[] = days.map((day, i) => {
    const bucket = counts[i] ?? { yellow: 0, green: 0, red: 0, blue: 0 };
    return {
      label: dayLabel(day, i === days.length - 1),
      stacks: QUADRANT_ORDER.filter((q) => bucket[q] > 0).map((q) => ({
        value: bucket[q],
        color: QUADRANTS[q].color,
      })),
    };
  });

  return { stackData, totalCount: total };
}

function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dayLabel(d: Date, isToday: boolean): string {
  if (isToday) {
    return "Today";
  }
  return d.toLocaleDateString([], { weekday: "short" });
}

function maxStackHeight(data: stackDataItem[]): number {
  let max = 0;
  for (const item of data) {
    const sum = (item.stacks ?? []).reduce((acc, s) => acc + s.value, 0);
    if (sum > max) {
      max = sum;
    }
  }
  return max;
}
