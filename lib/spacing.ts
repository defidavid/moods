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
  dotSm: 8,
  dotMd: 12,
  accentBar: 4,
} as const;

export type SpacingKey = keyof typeof spacing;
export type RadiusKey = keyof typeof radius;
export type SizeKey = keyof typeof sizes;
