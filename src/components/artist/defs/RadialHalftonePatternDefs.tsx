const RINGS = 6;
const DOTS_BASE = 6;

function RadialHalftonePattern({
  id,
  base,
  dot,
}: {
  id: string;
  base: string;
  dot: string;
}) {
  const dots = Array.from({ length: RINGS }, (_, ring) => {
    const ringRadius = ((ring + 1) / RINGS) * 0.45;
    const dotsInRing = DOTS_BASE * (ring + 1);
    const dotRadius = 0.055 * (1 - ring / RINGS) + 0.008;

    return Array.from({ length: dotsInRing }, (_, i) => {
      const angle = (i / dotsInRing) * Math.PI * 2;
      const cx = 0.5 + ringRadius * Math.cos(angle);
      const cy = 0.5 + ringRadius * Math.sin(angle);
      return (
        <circle key={`${ring}-${i}`} cx={cx} cy={cy} r={dotRadius} fill={dot} />
      );
    });
  });

  return (
    <pattern
  id={id}
  patternUnits="objectBoundingBox"
  patternContentUnits="objectBoundingBox"
  width={1}
  height={1}
>
      <rect width={1} height={1} fill={base} />
      {dots}
    </pattern>
  );
}

export default function RadialHalftonePatternDefs() {
  return (
    <defs>
      <RadialHalftonePattern id="halftone-accepted" base="var(--color-bg)" dot="var(--color-accepted)" />
      <RadialHalftonePattern id="halftone-discarded" base="var(--color-bg)" dot="var(--color-discarded)" />
    </defs>
  );
}