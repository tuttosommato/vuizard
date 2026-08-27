import { interpolateRgb } from "d3";
import { colorScale } from "@/utils/constants.ts";

// colorScale("accepted")/colorScale("discarded") return CSS var()
// so they need conversion for d3
let cachedInterpolator: ((t: number) => string) | null = null;

function resolveCssColor(varReference: string): string {
  const propertyName = varReference.replace(/^var\(|\)$/g, "");
  return getComputedStyle(document.documentElement)
    .getPropertyValue(propertyName)
    .trim();
}

function getInterpolator(): (t: number) => string {
  // CSS custom properties don't change at runtime, so this only ever
  // needs to be resolved once and reused for every call after that.
  if (!cachedInterpolator) {
    const discarded = resolveCssColor(colorScale("discarded"));
    const accepted = resolveCssColor(colorScale("accepted"));
    cachedInterpolator = interpolateRgb(discarded, accepted);
  }
  return cachedInterpolator;
}

// ratio = accepted / total for one co-occurrence connection, pulled from AuthorsCoBundle.
// 0 reads as fully "discarded", 1 as fully "accepted".
export function getCoOccurrenceColor(ratio: number): string {
  const clamped = Math.max(0, Math.min(1, ratio));
  return getInterpolator()(clamped);
}
