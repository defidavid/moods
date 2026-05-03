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

export const useStore = create<StoreState>((set) => ({
  token: null,
  user: null,
  entries: [],
  emotions: EMOTIONS,

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
        (a, b) => Date.parse(b.loggedAt) - Date.parse(a.loggedAt),
      ),
    }),

  addEntry: (entry) =>
    set((s) => ({
      entries: [entry, ...s.entries].sort(
        (a, b) => Date.parse(b.loggedAt) - Date.parse(a.loggedAt),
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
