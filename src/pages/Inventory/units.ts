/**
 * Supported inventory units for a café / food-service POS.
 * Only these values may be saved. Prevents free-text garbage
 * and keeps stock quantities comparable across items.
 */
export const SUPPORTED_UNITS = [
  "pcs",
  "unit",
  "kg",
  "g",
  "L",
  "ml",
  "pack",
  "bottle",
  "cup",
  "bag",
  "box",
  "can",
  "sachet",
  "slice",
  "serving",
] as const;

export type SupportedUnit = (typeof SUPPORTED_UNITS)[number];

export function isSupportedUnit(value: string): value is SupportedUnit {
  return (SUPPORTED_UNITS as readonly string[]).includes(value.trim());
}
