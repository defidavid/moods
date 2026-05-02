# 03 — Design System

The complete visual language. Mobile components consume these tokens directly via imports from `lib/colors.ts`, `lib/spacing.ts`, and `lib/typography.ts`. Hand-rolled — no UI library.

## Colors

```ts
// lib/colors.ts
export const colors = {
  // Quadrants — must match spec/02-emotion-taxonomy.md
  yellow: "#F4D35E",
  green:  "#7BC47F",
  red:    "#E07A5F",
  blue:   "#6B8AC4",

  // Surfaces
  bg:      "#FAFAF7",  // app background
  card:    "#FFFFFF",  // raised surface
  border:  "#E5E5EA",  // hairline borders

  // Text
  text:        "#1C1C1E",  // primary
  textMuted:   "#8A8A8E",  // secondary
  textInverse: "#FFFFFF",  // on colored surfaces

  // States
  pressedOverlay: "rgba(0, 0, 0, 0.06)",
  destructive:    "#D9534F",
} as const;

export type ColorKey = keyof typeof colors;
```

Dark mode is out of scope for v0. The app is light only.

## Spacing & Radius

```ts
// lib/spacing.ts
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
```

## Typography

```ts
// lib/typography.ts
import { TextStyle } from "react-native";

export const typography = {
  caption: { fontSize: 12, fontWeight: "400", lineHeight: 16, color: "#8A8A8E" },
  body:    { fontSize: 16, fontWeight: "400", lineHeight: 22, color: "#1C1C1E" },
  bodyEm:  { fontSize: 16, fontWeight: "600", lineHeight: 22, color: "#1C1C1E" },
  title:   { fontSize: 22, fontWeight: "600", lineHeight: 28, color: "#1C1C1E" },
  display: { fontSize: 32, fontWeight: "700", lineHeight: 38, color: "#1C1C1E" },
} satisfies Record<string, TextStyle>;
```

System font only. No custom font load.

## Component Patterns

### Button (Primary)
- Height 48, full width unless inline.
- `borderRadius: radius.lg`.
- Background `colors.text` (near black), label `colors.textInverse`.
- Pressed: opacity 0.85.
- Disabled: background `colors.border`, label `colors.textMuted`.

### Button (Ghost)
- Same metrics as primary.
- Background transparent, label `colors.text`.
- Pressed: background `colors.pressedOverlay`.

### Card
- Background `colors.card`, `borderRadius: radius.md`, shadow:
  - iOS: `shadowColor: "#000"`, `shadowOpacity: 0.04`, `shadowRadius: 6`, `shadowOffset: {width:0, height:2}`.
  - Android: `elevation: 1`.
- Internal padding `spacing.md`.

### Chip (emotion selector)
- Height 40, padding `spacing.md` horizontal.
- `borderRadius: radius.pill`.
- Background `colors.textInverse` with 1px border `rgba(255,255,255,0.5)` (when on a colored quadrant background).
- Label uses `typography.bodyEm`, color `colors.text`.
- Pressed: scale to 0.97 with Reanimated.

### Intensity dots (display)
- Five circles, `sizes.dotSm` diameter, `spacing.xs` gap, `borderRadius: radius.pill`.
- Filled circles use the entry's quadrant color; empty use `colors.border`.

### Intensity slider (input)
- Five segments, equal width, height 56.
- Selected segment fills with quadrant color and shows the number in white.
- Unselected segments are `colors.card` with `colors.textMuted` numerals.
- `expo-haptics` `impactAsync(Light)` on each value change.

## Quadrant Tile (the core canvas component)

- Renders a 2×2 grid of four tiles filling the available area.
- Each tile fills its quadrant background color, displays its quadrant label centered (`typography.bodyEm`, `colors.text`).
- On tap, the tapped tile must animate to fill the full canvas. Use Reanimated `useSharedValue` + `withTiming(280ms, Easing.out(Easing.cubic))`.
- The unselected tiles fade out (opacity 0) over the same duration.
- On the back gesture, the animation reverses.

## Iconography

No icon library. Use Unicode glyphs only:
- Back: `‹`
- Delete: `Delete` text label (no trash icon)
- Tab labels: text only ("Log", "Today", "Insights")

## Accessibility minimums (v0)

- All touch targets ≥ 44×44 pt.
- All text contrast ≥ AA against its background using the tokens above (verified manually).
- All buttons have `accessibilityRole="button"`.

(Full a11y matrix is out of scope for v0.)
