import { useSyncExternalStore } from "react";

// The app is laid out in side-by-side panels and needs room: below this viewport size the page
// is replaced by a notice (the nav and the About overlay stay), and comes back as soon as the
// window is big enough, no reload needed. It goes by the viewport, not the device, so a small
// desktop window gets the notice too. (The About overlay's single-column layout follows the
// same width, see global.css.)
export const MIN_WIDTH = 1024;
export const MIN_HEIGHT = 600;
const QUERY = `(min-width: ${MIN_WIDTH}px) and (min-height: ${MIN_HEIGHT}px)`;

function subscribe(onChange: () => void) {
  const query = window.matchMedia(QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export default function useScreenBigEnough() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
  );
}
