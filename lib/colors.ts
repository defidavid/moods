export const colors = {
  // Quadrants — must match spec/02-emotion-taxonomy.md
  yellow: "#F4D35E",
  green: "#7BC47F",
  red: "#E07A5F",
  blue: "#6B8AC4",

  // Surfaces
  bg: "#FAFAF7",
  card: "#FFFFFF",
  border: "#E5E5EA",

  // Text
  text: "#1C1C1E",
  textMuted: "#8A8A8E",
  textInverse: "#FFFFFF",

  // States
  pressedOverlay: "rgba(0, 0, 0, 0.06)",
  destructive: "#D9534F",
} as const;

export type ColorKey = keyof typeof colors;
