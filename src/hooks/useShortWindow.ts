import { useSyncExternalStore } from "react";

// A short window makes the work visualisation render at a small scale, so its labels are drawn
// larger there, in two steps (work.css uses the same heights).
export const SHORT_WINDOW_HEIGHT = 900;
export const VERY_SHORT_WINDOW_HEIGHT = 700;
const QUERIES = [
  `(max-height: ${SHORT_WINDOW_HEIGHT}px)`,
  `(max-height: ${VERY_SHORT_WINDOW_HEIGHT}px)`,
];

function subscribe(onChange: () => void) {
  const queries = QUERIES.map((q) => window.matchMedia(q));
  queries.forEach((q) => q.addEventListener("change", onChange));
  return () =>
    queries.forEach((q) => q.removeEventListener("change", onChange));
}

// 0: tall enough, 1: short, 2: very short
export default function useShortWindow(): 0 | 1 | 2 {
  return useSyncExternalStore(subscribe, () =>
    window.matchMedia(QUERIES[1]).matches
      ? 2
      : window.matchMedia(QUERIES[0]).matches
        ? 1
        : 0,
  );
}
