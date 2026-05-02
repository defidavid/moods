# Mobile 02 — Routing

## Purpose

Wire up Expo Router. Define the root Stack, the auth gate, and the bottom Tab navigator. After this step, the app boots to `/login` when no token is present and to `/(tabs)/log` (placeholder) when one is.

## Files to create

- `/app/_layout.tsx`
- `/app/(tabs)/_layout.tsx`
- `/app/login.tsx` — minimal stub (full screen lives in step 2.8)
- `/app/(tabs)/log.tsx` — placeholder (full screen in 2.9)
- `/app/(tabs)/today.tsx` — placeholder (full screen in 2.10)
- `/app/(tabs)/insights.tsx` — placeholder (full screen in 2.11)
- `/app/entry/[id].tsx` — placeholder (full screen in 2.12)

Placeholders return a `<View>` with a single `<Text>` for the route name so navigation can be verified end to end.

## Routes

| Path                  | File                          | Purpose                |
|-----------------------|-------------------------------|------------------------|
| `/login`              | `app/login.tsx`               | Auth screen            |
| `/(tabs)/log`         | `app/(tabs)/log.tsx`          | Log mood (default tab) |
| `/(tabs)/today`       | `app/(tabs)/today.tsx`        | Today list             |
| `/(tabs)/insights`    | `app/(tabs)/insights.tsx`     | Weekly chart           |
| `/entry/[id]`         | `app/entry/[id].tsx`          | Entry detail (modal-ish, in stack) |

Route params: `/entry/[id]` exposes `{ id: string }` via `useLocalSearchParams<{ id: string }>()`.

## `app/_layout.tsx`

Root Stack with auth gate. Hydrates the store, then renders either a Redirect or the Stack children.

```tsx
import { useEffect, useState } from "react";
import { Redirect, Stack, SplashScreen } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { useStore } from "../lib/store";
import { api } from "../lib/api";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const token = useStore((s) => s.token);
  const hydrate = useStore((s) => s.hydrate);
  const setEmotions = useStore((s) => s.setEmotions);

  useEffect(() => {
    (async () => {
      await hydrate();
      try {
        const list = await api.getEmotions();
        setEmotions(list);
      } catch {
        /* keep bundled EMOTIONS — AC-40 */
      }
      setReady(true);
      SplashScreen.hideAsync().catch(() => {});
    })();
  }, [hydrate, setEmotions]);

  if (!ready) return null;
  if (!token) return <Redirect href="/login" />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="entry/[id]" options={{ headerShown: true, title: "" }} />
        <Stack.Screen name="login" />
      </Stack>
    </GestureHandlerRootView>
  );
}
```

Notes:
- `api.getEmotions()` is called during boot but its failure does not block. Emotions in the store fall back to bundled `EMOTIONS` (set by the store's initializer).
- `<Redirect>` runs before `<Stack>` mounts when there is no token (AC-01).
- 401 mid-session clears the token in the store; the `token` selector flips to `null`, this layout re-renders, and `<Redirect href="/login" />` fires (AC-04).

## `app/(tabs)/_layout.tsx`

Three tabs. Text-only labels. No icons.

```tsx
import { Tabs } from "expo-router";
import { Text, View } from "react-native";
import { colors } from "../../lib/colors";
import { typography } from "../../lib/typography";

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text
      style={[
        typography.caption,
        { color: focused ? colors.text : colors.textMuted, fontWeight: focused ? "600" : "400" },
      ]}
    >
      {label}
    </Text>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 56,
        },
        tabBarIcon: () => <View />, // no icons
      }}
    >
      <Tabs.Screen
        name="log"
        options={{ tabBarLabel: ({ focused }) => <TabLabel label="Log" focused={focused} /> }}
      />
      <Tabs.Screen
        name="today"
        options={{ tabBarLabel: ({ focused }) => <TabLabel label="Today" focused={focused} /> }}
      />
      <Tabs.Screen
        name="insights"
        options={{ tabBarLabel: ({ focused }) => <TabLabel label="Insights" focused={focused} /> }}
      />
    </Tabs>
  );
}
```

Tab order is fixed: Log, Today, Insights. Default landing tab is `log` (Expo Router uses the first child).

## Placeholder screen template

For each placeholder file in this step, use this body. Replace with the full screen in the named follow-on step.

```tsx
import { View, Text } from "react-native";
import { colors } from "../../lib/colors";
import { typography } from "../../lib/typography";

export default function Screen() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
      <Text style={typography.title}>Log</Text>
    </View>
  );
}
```

Substitute the title for each route ("Log" / "Today" / "Insights" / "Detail"). The login placeholder uses the same shape with title "Login" until step 2.8.

## Behavior notes

- `app/_layout.tsx` is the single auth gate. Child screens never check the token.
- `expo-router` automatically registers `app/` as the route root via `"main": "expo-router/entry"` in `package.json`.
- `Stack.Screen name="entry/[id]"` enables a header on the detail screen so the back chevron appears; tabs and login keep `headerShown: false`.
- The login screen is a sibling of `(tabs)`, not nested inside it; tab bar must not show on the login route.

## ACs in scope

- **AC-01** — Auth gate redirects to `/login` when there is no token.
- **AC-03** — Tab bar shows three labeled tabs.
- Indirectly enables **AC-04** (the gate re-evaluates when the store clears the token).
