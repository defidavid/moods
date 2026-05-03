import type { Quadrant } from "./types";
import { colors } from "./colors";

export interface QuadrantMeta {
  /** Human-readable label shown in the log grid and insights legend. */
  label: string;
  /** Hex color from the design system (matches lib/colors.ts). */
  color: string;
  /**
   * Position in the canonical 2x2 grid.
   *   0 = top-left, 1 = top-right, 2 = bottom-left, 3 = bottom-right.
   * Per spec/02-emotion-taxonomy.md:
   *   yellow → top-left, red → top-right, green → bottom-left, blue → bottom-right.
   */
  gridPosition: 0 | 1 | 2 | 3;
}

export const QUADRANTS: Record<Quadrant, QuadrantMeta> = {
  yellow: {
    label: "High Energy / Pleasant",
    color: colors.yellow,
    gridPosition: 0,
  },
  red: {
    label: "High Energy / Unpleasant",
    color: colors.red,
    gridPosition: 1,
  },
  green: {
    label: "Low Energy / Pleasant",
    color: colors.green,
    gridPosition: 2,
  },
  blue: {
    label: "Low Energy / Unpleasant",
    color: colors.blue,
    gridPosition: 3,
  },
};

/** All quadrants ordered by gridPosition. Used for iterating in fixed display order. */
export const QUADRANT_ORDER: Quadrant[] = ["yellow", "red", "green", "blue"];
