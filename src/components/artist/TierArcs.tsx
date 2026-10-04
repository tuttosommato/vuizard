import {
  TIER_I,
  TIER_II,
  TIER_III,
  TIER_IV,
  VIS_CX,
  VIS_CY,
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

// Anonymous artists' vis has one outer ring instead of the four tiers: every dot with
// a relation qualifier goes there, and the ring is only drawn if there is one.
// Kept short on purpose: at the anonymous labels' size it has to fit in the quarter of the
// ring above the dashed line (about 360 units on the smallest ring), or it runs into the
// documentation/interpretation labels.
const ANON_OUTER_LABEL = "Attributions with a qualifier (falso, copia da…)";

const legendOffset = 4;

const arcLabelProps = {
  fill: "var(--color-text-muted)",
  fontSize: "var(--text-2xs)",
  textAnchor: "end" as const,
};

// Anonymous artists' vis has just the nucleus (and at most one ring), so its labels get the
// same size as the documentation/interpretation ones instead of the tiers' tiny one.
const anonArcLabelProps = { ...arcLabelProps, fontSize: "var(--text-sm)" };

export default function TierArcs({
  nucleusRadius,
  nucleusOnly,
  outerRingRadius,
}: {
  nucleusRadius: number;
  // anonymous artists: the nucleus plus, at most, one outer ring (no tier rings)
  nucleusOnly: boolean;
  outerRingRadius: number | null;
}) {
  const nucleusTextR = nucleusRadius - legendOffset / 2;
  const labelProps = nucleusOnly ? anonArcLabelProps : arcLabelProps;

  const rings = nucleusOnly
    ? outerRingRadius !== null
      ? [{ id: "tier-outer", r: outerRingRadius, label: ANON_OUTER_LABEL }]
      : []
    : tiers;
  const innerRing = rings[0]?.r;
  const outermostRing = rings[rings.length - 1]?.r;

  return (
    <g transform={`translate(${VIS_CX}, ${VIS_CY})`}>
      {/* Anonymous artists' single outer ring: dashed lines from the nucleus out to the
          ring's two ends, rather than the solid line the first tier has in the normal view */}
      {nucleusOnly &&
        outerRingRadius !== null &&
        [1, -1].map((sign) => (
          <line
            key={sign}
            x1="0"
            y1={sign * nucleusRadius}
            x2="0"
            y2={sign * outerRingRadius}
            stroke="var(--color-text)"
            strokeDasharray="8,8"
            strokeLinecap="square"
          />
        ))}

      {!nucleusOnly && rings.length > 0 && (
        <>
          {/* Solid line ranging across the first ring that stays in the background */}
          <line
            x1="0"
            y1={-innerRing}
            x2="0"
            y2={innerRing}
            stroke="var(--color-text)"
            strokeLinecap="square"
          />

          {/* Generates two specular dashed lines from the first to the outermost ring
              (nothing to draw when there is only one ring) */}
          {outermostRing > innerRing &&
            [1, -1].map((sign) => (
              <line
                key={sign}
                x1="0"
                y1={sign * outermostRing}
                x2="0"
                y2={sign * innerRing}
                stroke="var(--color-text)"
                strokeDasharray="8,8"
                strokeLinecap="square"
              />
            ))}
        </>
      )}

      {/* Nucleus circle with text */}
      <g>
        <circle
          r={nucleusRadius}
          stroke="var(--color-text)"
          fill="var(--color-bg)" // necessary to cover the first line behind the nucleus
        />
        {/* A <path>, not a <circle>: textPath can only follow a basic shape in
            browsers that implement SVG 2 (Firefox), Chromium paints nothing.
            Same geometry as the circle: starts at 3 o'clock, runs clockwise. */}
        <path
          id="nucleous-text"
          d={`M ${nucleusTextR} 0 A ${nucleusTextR} ${nucleusTextR} 0 1 1 ${-nucleusTextR} 0 A ${nucleusTextR} ${nucleusTextR} 0 1 1 ${nucleusTextR} 0`}
          stroke="none"
          fill="none"
        />
        <text>
          <textPath
            href={`#nucleous-text`}
            startOffset="74.5%"
            {...labelProps}
            dominantBaseline="hanging"
          >
            Attributions to the artist
          </textPath>
        </text>
      </g>

      {/* Arcs with text for each ring */}
      {rings.map(({ id, r, label }) => (
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
              {...labelProps}
            >
              {label}
            </textPath>
          </text>
        </g>
      ))}

      {/* Dashed line dividing the space in two */}
      <line
        x1={nucleusRadius}
        y1={0}
        x2={-(outermostRing ?? nucleusRadius)}
        y2={0}
        stroke="var(--color-text)"
        strokeDasharray="4,4"
        strokeLinecap="square"
      />
    </g>
  );
}
