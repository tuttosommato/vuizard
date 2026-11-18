// Using an imperative approach here -->
// Hover fires far more often than click, and at 5000+ artists routing it through
// React state would force a re-render/diff of the whole dot list on every mouseenter
// so this bypasses React entirely for this one direction.
//
//
// !! An artist can own more than one leaf circle (multiple cultural-context declarations), so a given id can match several dots/edges at once.

let dotsContainer: SVGGElement | null = null;

// artist id -> its dots, built on first use (see hoverFocus below)
let dotsById: Map<string, Element[]> | null = null;

export function registerDotsContainer(el: SVGGElement | null) {
  dotsContainer = el;
  dotsById = null;
  focusedDots = [];
}

// Hovering an artist only highlights the artist with its tooltip, while only by selecting it
// who appears with them gets also highlighted
// (the others dim, the co-occurring ones take their acceptance colour).

type HoverFocusSource = {
  // related artist id -> the fill it takes; null when there's nothing to show for this one
  related: (id: string) => Map<string, string> | null;
};
let hoverFocusSource: HoverFocusSource | null = null;
let focusedDots: Element[] = [];

export function registerHoverFocus(source: HoverFocusSource | null) {
  hoverFocusSource = source;
}

function getDotsById(): Map<string, Element[]> {
  if (!dotsById) {
    dotsById = new Map();
    dotsContainer?.querySelectorAll("[data-artist-id]").forEach((el) => {
      if (!el.classList.contains("author-dot")) return;
      const id = el.getAttribute("data-artist-id") as string;
      const dots = dotsById!.get(id);
      if (dots) dots.push(el);
      else dotsById!.set(id, [el]);
    });
  }
  return dotsById;
}

function clearHoverFocus() {
  for (const el of focusedDots) {
    el.classList.remove("hover-related");
    (el as SVGElement).style.removeProperty("fill");
  }
  focusedDots = [];
  dotsContainer?.classList.remove("hover-focus");
}

function applyHoverFocus(id: string) {
  const related = hoverFocusSource?.related(id);
  if (!related) return;
  const dotsMap = getDotsById();
  related.forEach((fill, relatedId) => {
    dotsMap.get(relatedId)?.forEach((el) => {
      el.classList.add("hover-related");
      (el as SVGElement).style.fill = fill;
      focusedDots.push(el);
    });
  });
  dotsContainer?.classList.add("hover-focus");
}

// Overlapping tooltips of selected artists (they stay on, see PackingVis): hovering an artist
// brings its tooltip(s) in front of the others.
function raiseSelectedLabels(id: string | null) {
  document
    .querySelectorAll(".selected-artist-label.raised")
    .forEach((el) => el.classList.remove("raised"));
  if (id !== null) {
    document
      .querySelectorAll(`.selected-artist-label[data-artist-id="${id}"]`)
      .forEach((el) => el.classList.add("raised"));
  }
}

// `withRelated`: also show who appears with the artist (they stay, in their acceptance colour,
// and everyone else dims strongly). A real hover doesn't (it outlines the artist and dims the
// rest a little; who appears with it is shown by selecting it); the idle demo does, to show what
// selecting an artist does.
function applyHighlight(id: string | null, withRelated: boolean) {
  clearHoverFocus();
  raiseSelectedLabels(id);
  dotsContainer
    ?.querySelectorAll(".hovered")
    .forEach((el) => el.classList.remove("hovered"));
  dotsContainer?.classList.toggle("dimming", id !== null);
  if (id !== null) {
    dotsContainer
      ?.querySelectorAll(`[data-artist-id="${id}"]`)
      .forEach((el) => el.classList.add("hovered"));
    if (withRelated) applyHoverFocus(id);
  }
}

// What the pointer does over a dot, or over an artist's card in the list.
export function highlightDot(id: string | null) {
  // someone is really hovering: whatever is showing a demo of the highlight stops first
  if (id !== null) userHoverListener?.();
  applyHighlight(id, false);
}

// The highlight of the idle demo (see useIdleHoverDemo), shown without anyone hovering: it
// includes who appears with the artist, which a real hover no longer does.
export const demoHighlightDot = (id: string | null) => applyHighlight(id, true);

// While the demo plays the dots get a `demo` class, which gives them a transition (see
// overview.css), so that it fades from one artist to the next. A real hover is instant: the
// class is dropped before its highlight is applied. When the demo just ends, the class stays
// until the fade has played.
const DEMO_FADE_MS = 700; // a little over the transition's length
let demoOffTimer: number | undefined;

export function startDemoMode() {
  window.clearTimeout(demoOffTimer);
  dotsContainer?.classList.add("demo");
}

export function endDemoMode(fade: boolean) {
  window.clearTimeout(demoOffTimer);
  if (fade) {
    demoOffTimer = window.setTimeout(
      () => dotsContainer?.classList.remove("demo"),
      DEMO_FADE_MS,
    );
  } else {
    dotsContainer?.classList.remove("demo");
  }
}

let userHoverListener: (() => void) | null = null;

// Called whenever an artist is really hovered; returns the way to stop listening.
export function onUserHover(listener: () => void) {
  userHoverListener = listener;
  return () => {
    if (userHoverListener === listener) userHoverListener = null;
  };
}

let tooltipEl: HTMLDivElement | null = null;

export function registerArtistTooltipEl(el: HTMLDivElement | null) {
  tooltipEl = el;
}

export function showArtistTooltip(
  name: string,
  coords: { x: number; y: number },
  details: string[] = [],
) {
  if (!tooltipEl) return;
  // the name, and under it a muted line for each detail (the life dates, the attributions…)
  const title = document.createElement("p");
  title.className = "tooltip-title";
  title.textContent = name;
  const lines: HTMLElement[] = [title];
  for (const detail of details) {
    const sub = document.createElement("p");
    sub.className = "tooltip-sub";
    sub.textContent = detail;
    lines.push(sub);
  }
  tooltipEl.replaceChildren(...lines);
  tooltipEl.style.left = `${coords.x}px`;
  tooltipEl.style.top = `${coords.y}px`;
  tooltipEl.style.opacity = "1";
}

export function hideArtistTooltip() {
  if (tooltipEl) tooltipEl.style.opacity = "0";
}
