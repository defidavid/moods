import type { Emotion } from "./types.js";

export const EMOTIONS: readonly Emotion[] = [
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
