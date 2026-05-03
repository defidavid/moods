import type { Emotion } from "./types";

export const api = {
  getEmotions: async (): Promise<Emotion[]> => {
    throw new Error("api.getEmotions not implemented yet");
  },
};
