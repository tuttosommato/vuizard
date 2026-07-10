import {
  TIER_I,
  TIER_II,
  TIER_III,
  TIER_IV,
  VIS_CX,
  VIS_CY,
} from "@/utils/constants.ts";

const legendOffset = 4;
const bracketX = legendOffset * 4;
const lineX = legendOffset * 6;
const labelX = legendOffset * 9;

const legendLabelPropsRight = {
  fill: "var(--color-text-muted)",
  fontSize: "var(--text-sm)",
  textAnchor: "start" as const,
};

const legendLabelPropsLeft = {
  fill: "var(--color-text-muted)",
  fontSize: "var(--text-sm)",
  textAnchor: "end" as const,
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
        {...legendLabelPropsRight}
        dominantBaseline="auto"
      >
        More direct relationship with the artist
      </text>
      <text
        x={labelX}
        y={-(TIER_III + TIER_IV) / 2 + legendOffset}
        {...legendLabelPropsRight}
        dominantBaseline="mathematical"
      >
        Less direct relationship with the artist
      </text>
      {/* Bracketed line */}
      <path
        d={`M ${bracketX} ${TIER_II} L ${lineX} ${TIER_II} L ${lineX} ${TIER_IV} L ${bracketX} ${TIER_IV} M ${bracketX} ${TIER_III} L ${lineX} ${TIER_III}`}
        stroke="var(--color-text-muted)"
        strokeLinecap="square"
        fill="none"
      />
      <text
        x={labelX}
        y={TIER_III}
        {...legendLabelPropsRight}
        dominantBaseline="middle"
      >
        Attributions to anonyms
      </text>
      {/* Space division */}

      <text
        x={-TIER_IV - legendOffset * 4}
        y={-legendOffset * 8}
        {...legendLabelPropsLeft}
        dominantBaseline="auto"
        style={{ fontStyle: "italic" }}
      >
        <tspan>Attributions based</tspan>
        <tspan x={-TIER_IV - legendOffset * 4} dy={legendOffset * 4}>
          on documentation
        </tspan>
      </text>
      <text
        x={-TIER_IV - legendOffset * 4}
        y={legendOffset * 4}
        {...legendLabelPropsLeft}
        dominantBaseline="mathematical"
        style={{ fontStyle: "italic" }}
      >
        <tspan>Attributions based</tspan>
        <tspan x={-TIER_IV - legendOffset * 4} dy={legendOffset * 4}>
          on interpretation
        </tspan>
      </text>
    </g>
  );
}
