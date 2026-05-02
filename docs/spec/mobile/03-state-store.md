# Mobile 03 — State Store

## Purpose

A single Zustand store, `lib/store.ts`, holds everything the app needs across screens: token, user, entries, and the emotion taxonomy (seeded with the bundled fallback). No slices, no middleware, no persist plugin — token persistence is one explicit `AsyncStorage.setItem` call. Other state lives in memory and is rebuilt each cold launch from the API.

## Files to create

- `/lib/store.ts`
- `/lib/types.ts` — copied verbatim from `spec/01-data-contracts.md`
- `/lib/emotions.ts` — bundled `EMOTIONS` per `spec/02-emotion-taxonomy.md`

## State shape

```ts
interface StoreState {
  token: string | null;
  user: User | null;
  entries: MoodEntry[];
  emotions: Emotion[];

  hydrate: () => Promise<void>;
  setToken: (token: string, user: User) => Promise<void>;
  clearAuth: () => Promise<void>;
  setEntries: (entries: MoodEntry[]) => void;
  addEntry: (entry: MoodEntry) => void;
  removeEntry: (id: string) => void;
  setEmotions: (emotions: Emotion[]) => void;
}
```

## `lib/store.ts` — full implementation

```ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import type { Emotion, MoodEntry, User } from "./types";
import { EMOTIONS } from "./emotions";

const TOKEN_KEY = "moods.token";

interface StoreState {
  token: string | null;
  user: User | null;
  entries: MoodEntry[];
  emotions: Emotion[];

  hydrate: () => Promise<void>;
  setToken: (token: string, user: User) => Promise<void>;
  clearAuth: () => Promise<void>;
  setEntries: (entries: MoodEntry[]) => void;
  addEntry: (entry: MoodEntry) => void;
  removeEntry: (id: string) => void;
  setEmotions: (emotions: Emotion[]) => void;
}

export const useStore = create<StoreState>((set, get) => ({
  token: null,
  user: null,
  entries: [],
  emotions: EMOTIONS, // bundled fallback per spec/02

  hydrate: async () => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
      // user is hardcoded "u1" in v0; rehydrate it locally
      set({ token, user: { id: "u1", displayName: "You" } });
    }
  },

  setToken: async (token, user) => {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    set({ token, user });
  },

  clearAuth: async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    set({ token: null, user: null, entries: [] });
  },

  setEntries: (entries) =>
    set({
      entries: [...entries].sort(
        (a, b) => Date.parse(b.loggedAt) - Date.parse(a.loggedAt)
      ),
    }),

  addEntry: (entry) =>
    set((s) => ({
      entries: [entry, ...s.entries].sort(
        (a, b) => Date.parse(b.loggedAt) - Date.parse(a.loggedAt)
      ),
    })),

  removeEntry: (id) =>
    set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),

  setEmotions: (emotions) => set({ emotions }),
}));

/**
 * Non-React accessor — only `lib/api.ts` should call these.
 * Avoid using outside the api module; use the hook in components.
 */
export const storeApi = {
  getToken: () => useStore.getState().token,
  clearAuth: () => useStore.getState().clearAuth(),
};
```

## `lib/types.ts`

Copy verbatim from `spec/01-data-contracts.md`. Do not paraphrase, reorder, or add fields. Forbidden fields listed there must remain absent.

## `lib/emotions.ts`

```ts
import type { Emotion } from "./types";

export const EMOTIONS: Emotion[] = [
  { id: "energetic",  label: "Energetic",  quadrant: "yellow" },
  { id: "excited",    label: "Excited",    quadrant: "yellow" },
  { id: "joyful",     label: "Joyful",     quadrant: "yellow" },
  { id: "proud",      label: "Proud",      quadrant: "yellow" },

  { id: "calm",       label: "Calm",       quadrant: "green"  },
  { id: "content",    label: "Content",    quadrant: "green"  },
  { id: "grateful",   label: "Grateful",   quadrant: "green"  },
  { id: "relaxed",    label: "Relaxed",    quadrant: "green"  },

  { id: "angry",      label: "Angry",      quadrant: "red"    },
  { id: "anxious",    label: "Anxious",    quadrant: "red"    },
  { id: "frustrated", label: "Frustrated", quadrant: "red"    },
  { id: "stressed",   label: "Stressed",   quadrant: "red"    },

  { id: "sad",        label: "Sad",        quadrant: "blue"   },
  { id: "tired",      label: "Tired",      quadrant: "blue"   },
  { id: "lonely",     label: "Lonely",     quadrant: "blue"   },
  { id: "bored",      label: "Bored",      quadrant: "blue"   },
];
```

## Behavior notes

- `entries` is always kept sorted newest-first. The Today and Insights screens read it as-is.
- `clearAuth()` empties `entries` so a subsequent login starts clean.
- `hydrate()` is called exactly once, from `app/_layout.tsx`. Components must never call it.
- `storeApi` is a tiny non-hook escape hatch for `lib/api.ts` to read the token and trigger 401 logout without using `useStore` (which is hook-only).
- The store does not store any per-screen UI state. Selected quadrant, slider value, note draft — all `useState` inside the screen.
- Do not add `set({ ... }, true)` (replace) anywhere; the merging default is required.

## ACs in scope

- **AC-02** (partial) — `setToken` writes the token to AsyncStorage under `moods.token`.
- **AC-04** (partial) — `clearAuth` removes the token; `lib/api.ts` calls it on 401.
- **AC-11** — `addEntry` makes the new entry visible to Today without a re-fetch.
- **AC-22** — `removeEntry` makes the deletion visible to Today without a re-fetch.
- **AC-40** — `emotions` defaults to bundled `EMOTIONS` even if the API never responds.
