import type { TextStyle } from "react-native";

export const typography = {
  caption: {
    fontSize: 12,
    fontWeight: "400",
    lineHeight: 16,
    color: "#8A8A8E",
  },
  body: { fontSize: 16, fontWeight: "400", lineHeight: 22, color: "#1C1C1E" },
  bodyEm: { fontSize: 16, fontWeight: "600", lineHeight: 22, color: "#1C1C1E" },
  title: { fontSize: 22, fontWeight: "600", lineHeight: 28, color: "#1C1C1E" },
  display: {
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 38,
    color: "#1C1C1E",
  },
} satisfies Record<string, TextStyle>;

export type TypographyKey = keyof typeof typography;
