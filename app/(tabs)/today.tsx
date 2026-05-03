import { useCallback, useState } from "react";
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  Text,
  View,
} from "react-native";
import { useFocusEffect, router } from "expo-router";
import { EntryCard } from "../../components/EntryCard";
import { EmptyState } from "../../components/EmptyState";
import { api } from "../../lib/api";
import { useStore } from "../../lib/store";
import { colors } from "../../lib/colors";
import { spacing } from "../../lib/spacing";
import { typography } from "../../lib/typography";
import type { MoodEntry } from "../../lib/types";

export default function TodayScreen() {
  const entries = useStore((s) => s.entries);
  const setEntries = useStore((s) => s.setEntries);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const list = await api.getEntries();
      setEntries(list);
    } catch {
      /* swallow — leave whatever's in the store */
    } finally {
      setRefreshing(false);
    }
  }, [setEntries]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const todays = entries.filter(isToday);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        style={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.lg,
          paddingBottom: spacing.md,
        }}
      >
        <Text style={typography.title}>Today</Text>
        <Text style={[typography.caption, { marginTop: spacing.xs }]}>
          {formatDateHeader(new Date())}
        </Text>
      </View>

      {todays.length === 0 ? (
        <EmptyState message="Nothing logged yet today." />
      ) : (
        <FlatList
          data={todays}
          keyExtractor={(e) => e.id}
          contentContainerStyle={{ padding: spacing.lg, paddingTop: 0 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={colors.textMuted}
            />
          }
          renderItem={({ item }) => (
            <EntryCard
              entry={item}
              onPress={() => router.push(`/entry/${item.id}`)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function isToday(entry: MoodEntry): boolean {
  const d = new Date(entry.loggedAt);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function formatDateHeader(d: Date): string {
  return d.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
