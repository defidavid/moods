import { create } from "zustand";

interface StoreState {
  token: string | null;
  emotions: unknown[];
  hydrate: () => Promise<void>;
  setEmotions: (emotions: unknown[]) => void;
}

export const useStore = create<StoreState>((set) => ({
  token: null,
  emotions: [],
  hydrate: async () => {},
  setEmotions: (emotions) => set({ emotions }),
}));
