# Mobile 05 — Design Tokens

## Purpose

Materialize the design system from `spec/03-design-system.md` and the quadrant taxonomy from `spec/02-emotion-taxonomy.md` as importable TypeScript modules. Every component reads from these tokens; no hardcoded hex strings, pixel values, or font weights anywhere else in the codebase.

## Files to create

- `/lib/colors.ts`
- `/lib/spacing.ts`
- `/lib/typography.ts`
- `/lib/quadrants.ts`

## `lib/colors.ts`

Copy verbatim from `spec/03-design-system.md`. Quadrant hexes must match `spec/02-emotion-taxonomy.md`.

```ts
export const colors = {
  // Quadrants — must match spec/02-emotion-taxonomy.md
  yellow: "#F4D35E",
  green:  "#7BC47F",
  red:    "#E07A5F",
  blue:   "#6B8AC4",

  // Surfaces
  bg:      "#FAFAF7",
  card:    "#FFFFFF",
  border:  "#E5E5EA",

  // Text
  text:        "#1C1C1E",
  textMuted:   "#8A8A8E",
  textInverse: "#FFFFFF",

  // States
  pressedOverlay: "rgba(0, 0, 0, 0.06)",
  destructive:    "#D9534F",
} as const;

export type ColorKey = keyof typeof colors;
```

## `lib/spacing.ts`

```ts
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 999,
} as const;

/**
 * Fixed pixel dimensions for decorative UI elements (intensity dots,
 * legend swatches, accent strips). Use these instead of bare numbers
 * inside `app/` and `components/`.
 */
export const sizes = {
  dotSm: 8,     // intensity dots on cards and detail
  dotMd: 12,    // legend swatches
  accentBar: 4, // entry-card vertical accent strip width
} as const;

export type SpacingKey = keyof typeof spacing;
export type RadiusKey = keyof typeof radius;
export type SizeKey = keyof typeof sizes;
```

## `lib/typography.ts`

```ts
import type { TextStyle } from "react-native";

export const typography = {
  caption: { fontSize: 12, fontWeight: "400", lineHeight: 16, color: "#8A8A8E" },
  body:    { fontSize: 16, fontWeight: "400", lineHeight: 22, color: "#1C1C1E" },
  bodyEm:  { fontSize: 16, fontWeight: "600", lineHeight: 22, color: "#1C1C1E" },
  title:   { fontSize: 22, fontWeight: "600", lineHeight: 28, color: "#1C1C1E" },
  display: { fontSize: 32, fontWeight: "700", lineHeight: 38, color: "#1C1C1E" },
} satisfies Record<string, TextStyle>;

export type TypographyKey = keyof typeof typography;
```

Color values are duplicated literally rather than imported from `colors.ts` so the `satisfies TextStyle` constraint stays purely literal — copy verbatim from `spec/03`.

## `lib/quadrants.ts`

The single source of truth for quadrant display metadata. The log grid, the insights chart, and the detail accent strip all read from this map.

```ts
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
  yellow: { label: "High Energy / Pleasant",   color: colors.yellow, gridPosition: 0 },
  red:    { label: "High Energy / Unpleasant", color: colors.red,    gridPosition: 1 },
  green:  { label: "Low Energy / Pleasant",    color: colors.green,  gridPosition: 2 },
  blue:   { label: "Low Energy / Unpleasant",  color: colors.blue,   gridPosition: 3 },
};

/** All quadrants ordered by gridPosition. Used for iterating in fixed display order. */
export const QUADRANT_ORDER: Quadrant[] = ["yellow", "red", "green", "blue"];
```

## Usage rules

- Components import named tokens, not the whole module: `import { colors } from "../lib/colors"`.
- Inline style objects use token references only:
  ```tsx
  <View style={{ backgroundColor: colors.bg, padding: spacing.md, borderRadius: radius.md }} />
  ```
- A literal hex, font weight, or pixel value in any file under `app/` or `components/` is a spec violation. Use `colors`, `spacing`, `radius`, `sizes`, and `typography` exclusively. If you need a value not covered by these tokens, add it to `lib/spacing.ts` (or the appropriate token file) first, then import it.
- Spreading typography styles is canonical: `<Text style={[typography.body, { color: colors.textMuted }]}>`. Override only the color when needed; do not redefine `fontSize` or `lineHeight`.

## Behavior notes

- `colors`, `spacing`, `radius`, and `typography` are `as const` / `satisfies` so autocompletion narrows correctly.
- `QUADRANTS` keys are typed by `Quadrant` so any new quadrant added to `lib/types.ts` would force a TS error here — intentional.
- `gridPosition` matches the table in `spec/02`. The log screen lays out tiles by sorting on this field, not by hardcoded x/y.

## ACs in scope

This step is foundational; it satisfies no AC by itself but is required by:
- **AC-05** — quadrant grid colors and labels
- **AC-15, AC-21** — intensity dot fill colors keyed by quadrant
- **AC-18, AC-20** — insights bar segment colors and legend
