// The "?" on the artist visualisation's arrow leads to the explanation of the circles' position
// in the legend panel: the panel scrolls to put it at its top (one layout margin below it), then it blinks twice (the
// .position-blink animation, see artist.css) to show where it is.
export const POSITION_EXPLANATION_ID = "position-explanation";

export function showPositionExplanation() {
  const section = document.getElementById(POSITION_EXPLANATION_ID);
  const panel = section?.closest<HTMLElement>(".artist-left");
  if (!section || !panel) return;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const blink = () => {
    section.classList.remove("position-blink");
    void section.offsetWidth; // restart the animation if it is still running
    section.classList.add("position-blink");
    section.addEventListener(
      "animationend",
      () => section.classList.remove("position-blink"),
      { once: true },
    );
  };

  // its scroll-margin (artist.css) leaves the page's layout margin above it
  section.scrollIntoView({
    block: "start",
    behavior: reducedMotion ? "auto" : "smooth",
  });
  // blink once it has arrived (a fallback timer for when there is nothing to scroll, or no
  // scrollend)
  let done = false;
  const arrived = () => {
    if (done) return;
    done = true;
    panel.removeEventListener("scrollend", arrived);
    blink();
  };
  panel.addEventListener("scrollend", arrived);
  window.setTimeout(arrived, 900);
}
