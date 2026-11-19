// The arrowhead of the double arrows on the visualisations' labels. A marker can't take the colour
// of the line it is on in every browser (`context-stroke` is missing from Safari, where it
// computes to no stroke and the head isn't drawn), so there is one for each colour in use:
// `#arrow` in the text colour, and `#arrow-muted` for the muted lines.
const MARKERS = [
  { id: "arrow", color: "var(--color-text)" },
  { id: "arrow-muted", color: "var(--color-text-muted)" },
];

export default function ArrowMarkerDef() {
  return (
    <defs>
      {MARKERS.map(({ id, color }) => (
        <marker
          key={id}
          id={id}
          viewBox="0 0 20 20"
          refX={10}
          refY={10}
          markerWidth={10}
          markerHeight={10}
          orient="auto-start-reverse"
          markerUnits="userSpaceOnUse"
        >
          <path
            d="M 0,0 L 10,10 L 0,20"
            fill="none"
            stroke={color}
            strokeWidth={2.5}
            strokeLinejoin="miter"
          />
        </marker>
      ))}
    </defs>
  );
}
