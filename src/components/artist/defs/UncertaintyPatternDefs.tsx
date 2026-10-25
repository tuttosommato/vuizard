// The fills of the circles whose identification is probable (level 1) or uncertain (level 2):
// the colour of the attribution with waves cut across it, as the artwork view draws such
// attributions with waves (utils/uncertaintyLine.ts): the less certain, the taller the waves.
//
// The pattern is laid out on each circle's own box (like the radial halftone ones), not on a
// fixed grid, so every circle shows the same composition, whole, at its own size: a grid of a
// few pixels cut a tiny circle into unreadable fragments.
//
//   rows:    how many waves are stacked in the circle
//   periods: how many full waves each one makes across it
//   height:  the wave's crest above its middle line, as a fraction of the row's height
//   cut:     the thickness of the cut, as a fraction of the row's height
const LEVELS = {
  1: { rows: 3, periods: 2.5, height: 0.2, cut: 0.28 }, // probable: gentle
  2: { rows: 4, periods: 1.5, height: 0.5, cut: 0.4 }, // uncertain: tall
} as const;

function UncertaintyPattern({
  id,
  base,
  uncertaintyLevel,
}: {
  id: string;
  base: string;
  uncertaintyLevel: 1 | 2;
}) {
  const { rows, periods, height, cut } = LEVELS[uncertaintyLevel];
  const rowHeight = 1 / rows;
  const amplitude = rowHeight * height;
  const wavelength = 1 / periods;

  // one wave across the whole width, from the left edge to the right one: half-waves, a crest and
  // then a trough, each drawn as a quadratic curve (T repeats it mirrored)
  const halfWaves = Math.round(periods * 2);
  const wave = (y: number) =>
    `M0,${y} Q${wavelength / 4},${y - 2 * amplitude} ${wavelength / 2},${y}` +
    Array.from(
      { length: halfWaves - 1 },
      (_, i) => ` T${(wavelength / 2) * (i + 2)},${y}`,
    ).join("");

  return (
    <pattern
      id={id}
      patternUnits="objectBoundingBox"
      patternContentUnits="objectBoundingBox"
      width={1}
      height={1}
    >
      <rect width={1} height={1} fill={base} />
      {Array.from({ length: rows }, (_, row) => (
        <path
          key={row}
          d={wave((row + 0.5) * rowHeight)}
          fill="none"
          stroke="var(--color-bg)"
          strokeWidth={rowHeight * cut}
        />
      ))}
    </pattern>
  );
}

export default function UncertaintyPatternDefs() {
  return (
    <defs>
      <UncertaintyPattern id="uncertain-accepted-1" base="var(--color-accepted)" uncertaintyLevel={1} />
      <UncertaintyPattern id="uncertain-discarded-1" base="var(--color-discarded)" uncertaintyLevel={1} />
      <UncertaintyPattern id="uncertain-accepted-2" base="var(--color-accepted)" uncertaintyLevel={2} />
      <UncertaintyPattern id="uncertain-discarded-2" base="var(--color-discarded)" uncertaintyLevel={2} />
      <UncertaintyPattern id="uncertain-legend-1" base="var(--color-text)" uncertaintyLevel={1} />
      <UncertaintyPattern id="uncertain-legend-2" base="var(--color-text)" uncertaintyLevel={2} />
    </defs>
  );
}
