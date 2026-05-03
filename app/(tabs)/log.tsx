import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSharedValue, withTiming, Easing } from "react-native-reanimated";
import { Button } from "../../components/Button";
import { QuadrantTile } from "../../components/QuadrantTile";
import { EmotionChip } from "../../components/EmotionChip";
import { IntensitySlider } from "../../components/IntensitySlider";
import { api } from "../../lib/api";
import { useStore } from "../../lib/store";
import { QUADRANTS, QUADRANT_ORDER } from "../../lib/quadrants";
import { colors } from "../../lib/colors";
import { radius, spacing } from "../../lib/spacing";
import { typography } from "../../lib/typography";
import type { Emotion, Quadrant } from "../../lib/types";

type Step =
  | { kind: "grid" }
  | { kind: "chips"; quadrant: Quadrant }
  | { kind: "intensity"; quadrant: Quadrant; emotion: Emotion };

const NOTE_MAX = 500;

export default function LogScreen() {
  const emotions = useStore((s) => s.emotions);
  const addEntry = useStore((s) => s.addEntry);
  const setEntries = useStore((s) => s.setEntries);

  const [step, setStep] = useState<Step>({ kind: "grid" });
  const [intensity, setIntensity] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const expandedProgress = useSharedValue(0);

  // Hydrate entries on first mount so Today/Insights are populated.
  useEffect(() => {
    api
      .getEntries()
      .then(setEntries)
      .catch(() => {});
  }, [setEntries]);

  // Auto-dismiss toast after 2.5s.
  useEffect(() => {
    if (!toast) {
      return;
    }
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const tilesByGrid = useMemo(
    () =>
      [...QUADRANT_ORDER].sort(
        (a, b) => QUADRANTS[a].gridPosition - QUADRANTS[b].gridPosition,
      ),
    [],
  );

  const goToChips = (q: Quadrant) => {
    expandedProgress.value = withTiming(1, {
      duration: 280,
      easing: Easing.out(Easing.cubic),
    });
    setStep({ kind: "chips", quadrant: q });
  };

  const backToGrid = () => {
    expandedProgress.value = withTiming(0, {
      duration: 280,
      easing: Easing.out(Easing.cubic),
    });
    setStep({ kind: "grid" });
    setNote("");
    setIntensity(3);
  };

  const goToIntensity = (q: Quadrant, e: Emotion) =>
    setStep({ kind: "intensity", quadrant: q, emotion: e });

  const backToChips = (q: Quadrant) => {
    setNote("");
    setIntensity(3);
    setStep({ kind: "chips", quadrant: q });
  };

  const onSubmit = async () => {
    if (step.kind !== "intensity" || submitting) {
      return;
    }
    setSubmitting(true);
    try {
      const trimmed = note.trim();
      const entry = await api.createEntry({
        emotionId: step.emotion.id,
        intensity,
        note: trimmed.length > 0 ? trimmed : null,
      });
      addEntry(entry);
      backToGrid();
      setToast("Logged.");
    } catch {
      setToast("Couldn't save. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flex: 1, flexDirection: "row", flexWrap: "wrap" }}>
        {tilesByGrid.map((q) => (
          <View
            key={q}
            style={{
              width: step.kind === "grid" ? "50%" : "100%",
              height: step.kind === "grid" ? "50%" : "100%",
              display: stepShowsTile(step, q) ? "flex" : "none",
            }}
          >
            <QuadrantTile
              quadrant={q}
              expandedProgress={expandedProgress}
              isExpanding={step.kind !== "grid" && step.quadrant === q}
              isIdle={step.kind === "grid"}
              onPress={() => goToChips(q)}
            />
          </View>
        ))}
      </View>

      {step.kind === "chips" && (
        <ChipsLayer
          quadrant={step.quadrant}
          emotions={emotions.filter((e) => e.quadrant === step.quadrant)}
          onBack={backToGrid}
          onPick={(e) => goToIntensity(step.quadrant, e)}
        />
      )}

      {step.kind === "intensity" && (
        <IntensityLayer
          quadrant={step.quadrant}
          emotion={step.emotion}
          intensity={intensity}
          note={note}
          submitting={submitting}
          onChangeIntensity={setIntensity}
          onChangeNote={setNote}
          onBack={() => backToChips(step.quadrant)}
          onSubmit={onSubmit}
        />
      )}

      {toast ? <Toast message={toast} /> : null}
    </SafeAreaView>
  );
}

function stepShowsTile(step: Step, q: Quadrant): boolean {
  if (step.kind === "grid") {
    return true;
  }
  return step.quadrant === q;
}

function Toast({ message }: { message: string }) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: spacing.xl,
        alignItems: "center",
      }}
    >
      <View
        style={{
          backgroundColor: colors.text,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
          borderRadius: radius.pill,
        }}
      >
        <Text style={[typography.body, { color: colors.textInverse }]}>
          {message}
        </Text>
      </View>
    </View>
  );
}

function ChipsLayer({
  quadrant,
  emotions,
  onBack,
  onPick,
}: {
  quadrant: Quadrant;
  emotions: Emotion[];
  onBack: () => void;
  onPick: (e: Emotion) => void;
}) {
  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        padding: spacing.lg,
      }}
    >
      <BackBar onPress={onBack} />
      <Text
        style={[
          typography.title,
          {
            color: colors.text,
            marginTop: spacing.lg,
            marginBottom: spacing.md,
          },
        ]}
      >
        {QUADRANTS[quadrant].label}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {emotions.map((e) => (
          <EmotionChip key={e.id} label={e.label} onPress={() => onPick(e)} />
        ))}
      </View>
    </View>
  );
}

function IntensityLayer({
  quadrant,
  emotion,
  intensity,
  note,
  submitting,
  onChangeIntensity,
  onChangeNote,
  onBack,
  onSubmit,
}: {
  quadrant: Quadrant;
  emotion: Emotion;
  intensity: 1 | 2 | 3 | 4 | 5;
  note: string;
  submitting: boolean;
  onChangeIntensity: (v: 1 | 2 | 3 | 4 | 5) => void;
  onChangeNote: (s: string) => void;
  onBack: () => void;
  onSubmit: () => void;
}) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <ScrollView
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: spacing.xxl,
        }}
      >
        <BackBar onPress={onBack} />
        <Text
          style={[
            typography.title,
            { marginTop: spacing.lg, marginBottom: spacing.lg },
          ]}
        >
          {emotion.label}
        </Text>
        <IntensitySlider
          value={intensity}
          onChange={onChangeIntensity}
          quadrantColor={QUADRANTS[quadrant].color}
        />
        <TextInput
          value={note}
          onChangeText={(t) => onChangeNote(t.slice(0, NOTE_MAX))}
          placeholder="Add a note (optional)"
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={NOTE_MAX}
          style={{
            marginTop: spacing.lg,
            minHeight: 96,
            padding: spacing.md,
            backgroundColor: colors.card,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.border,
            ...typography.body,
          }}
        />
        <Text
          style={[
            typography.caption,
            { textAlign: "right", marginTop: spacing.xs },
          ]}
        >
          {note.length}/{NOTE_MAX}
        </Text>
        <Button
          label={submitting ? "Saving…" : "Submit"}
          onPress={onSubmit}
          disabled={submitting}
          style={{ marginTop: spacing.lg }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function BackBar({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Back"
      hitSlop={12}
    >
      <Text style={[typography.title, { color: colors.text }]}>‹</Text>
    </Pressable>
  );
}
