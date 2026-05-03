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
      const msg =
        e instanceof ApiError ? e.message : "Couldn't sign in. Try again.";
      Alert.alert("Sign in failed", msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: spacing.xl,
        }}
      >
        <Text style={[typography.display, { marginBottom: spacing.xxl }]}>
          Moods
        </Text>
        <Text
          style={[
            typography.body,
            {
              color: colors.textMuted,
              textAlign: "center",
              marginBottom: spacing.xl,
            },
          ]}
        >
          Three taps to log how you feel.
        </Text>
      </View>
      <View style={{ padding: spacing.lg, paddingBottom: spacing.xl }}>
        <Button
          label={submitting ? "Signing in…" : "Continue"}
          onPress={onContinue}
          disabled={submitting}
        />
      </View>
    </SafeAreaView>
  );
}
