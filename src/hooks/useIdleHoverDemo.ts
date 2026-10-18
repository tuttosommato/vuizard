import { useEffect, useMemo, useRef } from "react";
import type { Artist } from "@/types/artists";
import {
  demoHighlightDot,
  endDemoMode,
  onUserHover,
  startDemoMode,
} from "@/stores/hoverBus";
import { getArtistTotal } from "@/utils/getArtistTotal";

// A hint that hovering the circles does something: a few artists are highlighted one after
// another, as if they were hovered (the rest dims, who appears with them lights up), with
// no tooltip. It plays when the page opens, until the first real hover on a circle (or an
// artist's card), and again whenever the pointer has been outside both the visualisation
// and the artist list for a few seconds. It never plays while the filters are being used
// (the pointer or the keyboard focus on their controls), and the caller keeps it off while a filter is on.
const DEMO_ARTISTS = [
  "Bellini Giovanni",
  "Vecellio Tiziano",
  "Robusti Jacopo",
  "Caliari Paolo",
  "Merisi Michelangelo",
];
const START_DELAY_MS = 500; // before the first run, once the page is uncovered
const SHOW_MS = 2000; // each artist stays highlighted this long, then the next one fades in
const IDLE_MS = 3000; // pointer away from the vis and the list for this long: play again

// the filters' controls: using them stops the demo and keeps it from starting
const FILTER_ZONES = ".search-legend-items, .temp-legend-items";
// where the pointer counts as "on the page's content": the filters too, so that being at them
// doesn't count as being away and doesn't start the demo
const ZONES = `.overview-vis-cnt, .overview-right, ${FILTER_ZONES}`;

export default function useIdleHoverDemo({
  artists,
  paused,
  playOnOpen = true,
}: {
  artists: Record<string, Artist>;
  paused: boolean; // e.g. the About overlay is covering the page, or a filter is on
  // false: no run when the page opens (someone who came here for a given artist doesn't need
  // the hint); only the idle rule plays it
  playOnOpen?: boolean;
}) {
  // the demo artists' ids (when several artists share a name, the one with most attributions)
  const demoIds = useMemo(() => {
    const ids: string[] = [];
    for (const name of DEMO_ARTISTS) {
      const same = Object.values(artists).filter((a) => a.name === name);
      same.sort((a, b) => getArtistTotal(b) - getArtistTotal(a));
      if (same[0]) ids.push(same[0].id);
    }
    return ids;
  }, [artists]);

  // once someone has hovered, the page-opening run is over for good (closing and reopening
  // the About overlay doesn't bring it back); only the idle rule plays it again
  const hasHoveredRef = useRef(false);

  useEffect(() => {
    if (
      paused ||
      demoIds.length === 0 ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    let running = false;
    let step = 0;
    let stepTimer: number | undefined;
    let idleTimer: number | undefined;
    let startTimer: number | undefined;

    // `fade`: let the highlight fade out; not when a real hover takes over, which is instant
    const stop = (fade: boolean) => {
      window.clearTimeout(stepTimer);
      running = false;
      if (fade) {
        demoHighlightDot(null);
        endDemoMode(true);
      } else {
        endDemoMode(false);
        demoHighlightDot(null);
      }
    };

    // the next demo artist whose circles are on show (not dimmed by the search or the
    // century filter)
    const nextVisibleId = () => {
      for (let i = 0; i < demoIds.length; i++) {
        const id = demoIds[(step + i) % demoIds.length];
        if (
          document.querySelector(
            `.author-dot[data-artist-id="${id}"]:not(.filtered-out)`,
          )
        ) {
          step = step + i + 1;
          return id;
        }
      }
      return null;
    };

    const showNext = () => {
      const id = nextVisibleId();
      if (id === null) {
        stepTimer = window.setTimeout(showNext, SHOW_MS);
        return;
      }
      // straight from one artist to the next, with nothing cleared in between: the dots
      // cross-fade (the transition is on while the demo plays, see startDemoMode)
      demoHighlightDot(id);
      stepTimer = window.setTimeout(showNext, SHOW_MS);
    };

    const start = () => {
      if (running) return;
      running = true;
      startDemoMode();
      showNext();
    };

    // someone hovers an artist for real: the demo has made its point
    const stopListening = onUserHover(() => {
      hasHoveredRef.current = true;
      window.clearTimeout(startTimer);
      stop(false);
    });

    // on opening the page (and until the first hover) it runs by itself
    if (!hasHoveredRef.current && playOnOpen)
      startTimer = window.setTimeout(start, START_DELAY_MS);

    // afterwards, whenever the pointer is away from the vis, the list and the filters for IDLE_MS
    let pointerInside = false;
    let focusInFilters = false;
    let inside = false;
    const refresh = () => {
      const now = pointerInside || focusInFilters;
      if (now === inside) return;
      inside = now;
      window.clearTimeout(idleTimer);
      if (!inside) idleTimer = window.setTimeout(start, IDLE_MS);
    };
    // someone is using a filter: stop the demo and don't let it start for now
    const pauseForFilters = () => {
      window.clearTimeout(startTimer);
      stop(true);
    };
    const onOver = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      pointerInside = target?.closest(ZONES) != null;
      if (target?.closest(FILTER_ZONES)) pauseForFilters();
      refresh();
    };
    const onLeaveWindow = () => {
      pointerInside = false;
      refresh();
    };
    const onFocusIn = (event: FocusEvent) => {
      if (
        event.target instanceof Element &&
        event.target.closest(FILTER_ZONES)
      ) {
        focusInFilters = true;
        pauseForFilters();
        refresh();
      }
    };
    const onFocusOut = () => {
      focusInFilters = false;
      refresh();
    };
    document.addEventListener("mouseover", onOver);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    document.documentElement.addEventListener("mouseleave", onLeaveWindow);
    idleTimer = window.setTimeout(start, IDLE_MS); // the pointer starts out away from it all

    return () => {
      stopListening();
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      document.documentElement.removeEventListener("mouseleave", onLeaveWindow);
      window.clearTimeout(startTimer);
      window.clearTimeout(idleTimer);
      stop(true);
    };
  }, [paused, demoIds, playOnOpen]);
}
