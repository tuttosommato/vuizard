import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

// The three levels of the app, one route each: overview, artist, work
const levels = [
  { to: "/", label: "Overview", title: "Overview" },
  { to: "/artist", label: "Artist view", title: "Artists" },
  { to: "/work", label: "Artwork view", title: "Works" },
];

// Mounting or unmounting a heavy page (the overview most of all) blocks the main thread
// for a few hundred ms. Starting the navigation this long after the click lets the
// thumb's slide start first: it only uses transform, so it keeps running on the
// compositor while the page work blocks the main thread.
const NAV_HEAD_START_MS = 60;

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const isArtist = location.pathname.includes("artist");
  const isWork = location.pathname.includes("work");
  const activeIndex = isWork ? 2 : isArtist ? 1 : 0;

  // The level just clicked, shown before the route has actually changed. It only counts
  // while we're still on the page it was clicked from, so it expires by itself once the
  // navigation lands (or never takes effect if it doesn't).
  const [pending, setPending] = useState<{
    index: number;
    fromPath: string;
  } | null>(null);
  const displayIndex =
    pending && pending.fromPath === location.pathname
      ? pending.index
      : activeIndex;

  const handleLevelClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    to: string,
    index: number,
  ) => {
    // leave new-tab/new-window clicks to the browser
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();

    if (index === displayIndex) {
      navigate(to); // nothing to animate
      return;
    }
    setPending({ index, fromPath: location.pathname });
    setTimeout(() => navigate(to), NAV_HEAD_START_MS);
  };

  return (
    <nav id="nav">
      <div className="nav-toolbar-cnt">
        <div title="About" className="about-icon">
          i
        </div>
        <div title="How to read" className="helper-icon">
          ?
        </div>
      </div>
      {/* Same idea as the table/ordering switches: one pill, a thumb that slides to the
          active option. Here the options are links, so the route is the state. */}
      <div
        className="level-switch"
        style={{ "--active-index": displayIndex } as React.CSSProperties}
      >
        {levels.map(({ to, label, title }, i) => (
          <Link
            key={to}
            to={to}
            className="level-switch-btn"
            title={title}
            aria-label={title}
            aria-current={i === activeIndex ? "page" : undefined}
            onClick={(e) => handleLevelClick(e, to, i)}
          >
            {label}
          </Link>
        ))}
        {/* The thumb carries its own copy of the labels, in the light colour, and
            counter-slides them so each sits exactly over its link: the label colour
            then follows the thumb with no colour transition (those run on the main
            thread and stall whenever it's busy). Decorative: the links above are
            what's clickable and announced. */}
        <span className="level-switch-thumb" aria-hidden="true">
          <span className="level-switch-thumb-labels">
            {levels.map(({ label }) => (
              <span key={label}>{label}</span>
            ))}
          </span>
        </span>
      </div>
      {/*placeholder*/}
      <div></div>
    </nav>
  );
}
