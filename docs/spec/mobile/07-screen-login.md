# Mobile 07 — Login Screen

## Purpose

The single auth screen. A centered "Moods" wordmark and one Continue button. Tapping Continue calls `api.login()`, persists the token via the store, and navigates to `/(tabs)/log`. There are no input fields — v0 has a hardcoded demo user.

## Files to create

- `/app/login.tsx`

## `app/login.tsx` — full implementation

```tsx
import { useState } from "react";
import { Alert, SafeAreaView, Text, View } from "react-native";
import { router } from "expo-router";
import { Button } from "../components/Button";
import { api, ApiError } from "../lib/api";
import { useStore } from "../lib/store";
import { colors } from "../lib/colors";
import { spacing } from "../lib/spacing";
import { typography } from "../lib/typography";

export default function LoginScreen() {
  const setToken = useStore((s) => s.setToken);
  const [submitting, setSubmitting] = useState(false);

  const onContinue = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await api.login();
      await setToken(res.token, res.user);
      router.replace("/(tabs)/log");
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Couldn't sign in. Try again.";
      Alert.alert("Sign in failed", msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl }}>
        <Text style={[typography.display, { marginBottom: spacing.xxl }]}>Moods</Text>
        <Text style={[typography.body, { color: colors.textMuted, textAlign: "center", marginBottom: spacing.xl }]}>
          Three taps to log how you feel.
        </Text>
      </View>
      <View style={{ padding: spacing.lg, paddingBottom: spacing.xl }}>
        <Button label={submitting ? "Signing in…" : "Continue"} onPress={onContinue} disabled={submitting} />
      </View>
    </SafeAreaView>
  );
}
```

## Behavior notes

- The screen does NOT render the tab bar — it lives outside the `(tabs)` group as a sibling route.
- `api.login()` always returns 200 in v0 (per `spec/04-api-contract.md`), so the catch path mainly handles network errors.
- `setToken` writes `moods.token` to AsyncStorage and updates the store atomically. The auth gate in `app/_layout.tsx` will already see `token != null` after the await resolves, but we explicitly `router.replace` to avoid a flash.
- Use `router.replace` (not `push`) so back-swipe from `/(tabs)/log` cannot return to the login screen.
- Wordmark uses `typography.display`. Spacing uses `spacing.xxl` between wordmark and tagline; the tagline uses `colors.textMuted`.
- Background is `colors.bg` (off-white). No imagery, no logo asset, no animation.
- The Continue button is full-width, anchored bottom with `spacing.lg` horizontal padding and `spacing.xl` bottom padding to clear the home indicator.
- `submitting` state debounces double-taps and gives a "Signing in…" label on the button.
- No keyboard handling needed — there is no input.

## Failure path

If `api.login()` throws (network down):

1. `setSubmitting(false)` runs in the `finally`.
2. A native `Alert.alert("Sign in failed", message)` shows with the error message.
3. The user remains on the login screen and can retry.

There is no toast on this screen; the alert is fine because it's the only blocking failure mode pre-auth.

## Imports

- `Button` from `../components/Button`
- `api, ApiError` from `../lib/api`
- `useStore` from `../lib/store`
- Tokens from `../lib/colors`, `../lib/spacing`, `../lib/typography`
- `router` from `expo-router`

## ACs in scope

- **AC-01** — When no token is in AsyncStorage, the auth gate in `_layout.tsx` redirects here. (This screen is the destination; the redirect is exercised in step 2.3.)
- **AC-02** — Tapping Continue calls `POST /login`, stores the token under `moods.token`, and navigates to `/(tabs)/log`.
