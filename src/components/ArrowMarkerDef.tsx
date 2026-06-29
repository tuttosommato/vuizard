export default function ArrowMarkerDef() {
  return (
    <defs>
      <marker
        id="arrow"
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
          stroke="context-stroke"
          strokeWidth={2.5}
          strokeLinejoin="miter"
        />
      </marker>
    </defs>
  );
}
