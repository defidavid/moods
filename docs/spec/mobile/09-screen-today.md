# Mobile 09 — Today Screen

## Purpose

Lists today's entries newest-first. Reads `entries` from the store; refreshes from the API on focus so deletes from elsewhere or external creates appear. Empty state when nothing has been logged today. Tapping a card navigates to the entry detail.

## Files to create

- `/app/(tabs)/today.tsx`

## `app/(tabs)/today.tsx` — full implementation

```tsx
import { useCallback } from "react";
import { FlatList, RefreshControl, SafeAreaView, Text, View } from "react-native";
import { useFocusEffect, router } from "expo-router";
import { useState } from "react";
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

  // Refresh on focus so cross-screen edits land here.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const todays = entries.filter(isToday);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md }}>
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.textMuted} />}
          renderItem={({ item }) => (
            <EntryCard entry={item} onPress={() => router.push(`/entry/${item.id}`)} />
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
    weekday: "long", month: "long", day: "numeric",
  });
}
```

## Behavior notes

- **Today filter.** Local time, not UTC. `isToday` uses `getFullYear/getMonth/getDate` against the current `Date()` so DST and TZ work correctly. Entries with `loggedAt` from yesterday in local time are excluded even if their UTC date matches today.
- **Sort order.** `entries` in the store is already newest-first (see `lib/store.ts`). No re-sort here.
- **Refresh on focus.** `useFocusEffect` reruns whenever the tab comes into focus (returning from detail after a delete, switching from Insights, etc.). A failed refresh silently keeps the last-known list.
- **Pull to refresh.** `RefreshControl` exposes the same call manually. Spinner color is `colors.textMuted` to stay subdued.
- **Card content.** Owned by `EntryCard` (see step 2.7): emotion label, 5 intensity dots in quadrant color, local time `h:mm A`, single-line note preview if a note exists. AC-15.
- **Empty state.** `EmptyState` text is exactly `"Nothing logged yet today."`. AC-16.
- **Navigation.** `router.push("/entry/" + id)` opens the detail (AC-17). The detail screen is a stack child of the root layout (not nested in tabs), so the tab bar disappears on detail.
- **Header.** Title "Today" + subdued formatted date (e.g. "Friday, May 2"). Helps confirm scope to the user.

## Performance

- `FlatList` is more than enough for v0 volume (single user, tens of entries/day max).
- No memoization is required; renders are cheap.
- Do not extract a separate `keyExtractor` constant unless needed.

## ACs in scope

- **AC-15** — entries render newest-first with emotion label, 5 dots filled to value, local time `h:mm A`, single-line note preview when present.
- **AC-16** — empty state with the exact copy "Nothing logged yet today." in subdued typography.
- **AC-17** — tapping a card navigates to `/entry/[id]` with the entry's id.
