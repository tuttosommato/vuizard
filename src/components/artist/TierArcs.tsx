import {
  TIER_I,
  TIER_II,
  TIER_III,
  TIER_IV,
  VIS_CX,
  VIS_CY,
  VIS_NUCLEUS_RADIUS,
} from "@/utils/constants.ts";

const tiers = [
  { id: "tier-1", r: TIER_I, label: "The artist and collaborating anonyms" },
  {
    id: "tier-2",
    r: TIER_II,
    label: "Anonyms who worked directly with the artist",
  },
  {
    id: "tier-3",
    r: TIER_III,
    label: "Anonyms who didn't work directly with the artist",
  },
  {
    id: "tier-4",
    r: TIER_IV,
    label: "Anonyms influenced by the known artist",
  },
];

const legendOffset = 4;

const arcLabelProps = {
  fill: "var(--color-text-muted)",
  fontSize: "var(--text-2xs)",
  textAnchor: "end" as const,
};

export default function TierArcs() {
  return (
    <g transform={`translate(${VIS_CX}, ${VIS_CY})`}>
      {/* Solid line ranging from TIER_I to TIER_I that stays in the background */}
      <line
        x1="0"
        y1={-TIER_I}
        x2="0"
        y2={TIER_I}
        stroke="var(--color-text)"
        strokeLinecap="square"
      />

      {/* Generates two specular dashed lines ranging from TIER_I to TIER_IV */}
      {[1, -1].map((sign) => (
        <line
          key={sign}
          x1="0"
          y1={sign * TIER_IV}
          x2="0"
          y2={sign * TIER_I}
          stroke="var(--color-text)"
          strokeDasharray="8,8"
          strokeLinecap="square"
        />
      ))}

      {/* Nucleus circle with text */}
      <g>
        <circle
          r={VIS_NUCLEUS_RADIUS}
          stroke="var(--color-text)"
          fill="var(--color-bg)" // necessary to cover the first line behind the nucleus
        />
        <circle
          id="nucleous-text"
          r={VIS_NUCLEUS_RADIUS - legendOffset / 2}
          stroke="none"
          fill="none"
        />
        <text>
          <textPath
            href={`#nucleous-text`}
            startOffset="74.5%"
            {...arcLabelProps}
            dominantBaseline="hanging"
          >
            Attributions to the artist
          </textPath>
        </text>
      </g>

      {/* Arcs with text for each tier */}
      {tiers.map(({ id, r, label }) => (
        <g key={id}>
          <path
            id={id}
            d={`M 0 ${r} A ${r} ${r} 0 0 1 0 ${-r}`}
            stroke="var(--color-text)"
            fill="none"
            strokeLinecap="square"
          />
          <path
            id={`${id}-text`}
            d={`M 0 ${r + legendOffset} A ${r + legendOffset} ${r + legendOffset} 0 0 1 0 ${-(r + legendOffset)}`}
            stroke="none"
            fill="none"
          />
          <text>
            <textPath
              href={`#${id}-text`}
              startOffset="99.5%"
              {...arcLabelProps}
            >
              {label}
            </textPath>
          </text>
        </g>
      ))}

      {/* Dashed line dividing the space in two */}
      <line
        x1={VIS_NUCLEUS_RADIUS}
        y1={0}
        x2={-TIER_IV}
        y2={0}
        stroke="var(--color-text)"
        strokeDasharray="4,4"
        strokeLinecap="square"
      />
    </g>
  );
}
