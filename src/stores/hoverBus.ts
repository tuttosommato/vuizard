// Imperative, non-React hover bridge from the artist card list into PackingVis.
// Hover fires far more often than click, and at 5000+ artists routing it through
// React state would force a re-render/diff of the whole dot list on every mouseenter
// so this bypasses React entirely for this one direction.
//
//
// !! An artist can own more than one leaf circle (multiple cultural-context declarations),
// so a given id can match several dots/edges at once.

let dotsContainer: SVGGElement | null = null;

export function registerDotsContainer(el: SVGGElement | null) {
  dotsContainer = el;
}

export function highlightDot(id: string | null) {
  dotsContainer
    ?.querySelectorAll(".hovered")
    .forEach((el) => el.classList.remove("hovered"));
  dotsContainer?.classList.toggle("dimming", id !== null);
  if (id !== null) {
    dotsContainer
      ?.querySelectorAll(`[data-artist-id="${id}"]`)
      .forEach((el) => el.classList.add("hovered"));
  }
}
