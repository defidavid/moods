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

  if (!ready) {
    return null;
  }
  if (!token) {
    return <Redirect href="/login" />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="entry/[id]"
          options={{ headerShown: true, title: "" }}
        />
        <Stack.Screen name="login" />
      </Stack>
    </GestureHandlerRootView>
  );
}
