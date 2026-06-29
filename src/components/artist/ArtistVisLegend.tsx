import {
  TIER_I,
  TIER_II,
  TIER_III,
  TIER_IV,
  VIS_CX,
  VIS_CY,
} from "@/utils/constants.ts";

const legendOffset = 4;
const bracketX = legendOffset * 5;
const lineX = legendOffset * 6;
const labelX = legendOffset * 9;

const legendLabelProps = {
  fill: "var(--color-text-muted)",
  fontSize: "var(--text-sm)",
  textAnchor: "start" as const,
};

export default function ArtistVisLegend() {
  return (
    <g transform={`translate(${VIS_CX}, ${VIS_CY})`}>
      {/* Arrow line */}
      <line
        x1={lineX}
        y1={-TIER_IV + legendOffset}
        x2={lineX}
        y2={-(TIER_I + legendOffset)}
        stroke="var(--color-text-muted)"
        strokeWidth={1.5}
        markerEnd="url(#arrow)"
        markerStart="url(#arrow)"
      />
      <text
        x={labelX}
        y={-(TIER_I + TIER_II) / 2 + legendOffset}
        {...legendLabelProps}
      >
        More direct relationship with the artist
      </text>
      <text
        x={labelX}
        y={-(TIER_III + TIER_IV) / 2 + legendOffset}
        {...legendLabelProps}
      >
        Less direct relationship with the artist
      </text>
      {/* Bracketed line */}
      <path
        d={`M ${bracketX} ${TIER_II} L ${lineX} ${TIER_II} L ${lineX} ${TIER_IV} L ${bracketX} ${TIER_IV}`}
        stroke="var(--color-text-muted)"
        strokeLinecap="square"
        fill="none"
      />
      <text x={labelX} y={TIER_III - legendOffset} {...legendLabelProps}>
        Attributions to anonyms
      </text>
    </g>
  );
}
