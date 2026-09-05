type TimeSpanProp = {
  from: number;
  fromQ: string;
  to: number;
  toQ: string;
  scale: (value: number) => number;
  height: number;
  barHeight: number;
  fill: string;
  fillOpacity?: number;
  raw: string;
  fontSize?: number;
};

export default function TimeSpan({
  from,
  fromQ,
  to,
  toQ,
  scale,
  height,
  barHeight,
  fill,
  fillOpacity = 1,
  raw,
  fontSize
}: TimeSpanProp) {
  const y = height / 2;
  const labelY = y - 3;
  const x1 = scale(from);
  const x2 = scale(to);
  const r = barHeight / 2.5;
  const labelFontSize = fontSize ?? barHeight;

  if (from === to) {
    const n = 3;
    return (
      <>
        {fromQ &&
          Array.from({ length: n }).map((_, i) => (
            <>
              <circle
                key={i}
                cx={scale(from - (i + 2))}
                cy={y + r}
                r={r / n}
                fill={fill}
                fillOpacity={fillOpacity - i / n}
              />

              <circle
                key={i + 3}
                cx={scale(to + (i + 2))}
                cy={y + r}
                r={r / n}
                fill={fill}
                fillOpacity={fillOpacity - i / n}
              />
            </>
          ))}
        <circle
          cx={x1}
          cy={y + r}
          r={r}
          fill={fill}
          fillOpacity={fillOpacity}
        />
        <text
          x={x1}
          y={labelY}
          fontSize={labelFontSize}
          textAnchor="middle"
          dominantBaseline="alphabetic"
          fill="var(--color-text)"
        >
          {raw || `${from}${fromQ}`}
        </text>
      </>
    );
  }

  return (
    <>
      {fromQ &&
        (() => {
          const n = 5;
          const unitW = (scale(from) - scale(from - 1)) / 2;
          return Array.from({ length: n }).map((_, i) => {
            return (
              <rect
                key={i}
                x={scale(from - (i + 1))}
                y={y}
                width={unitW}
                height={barHeight}
                fill={fill}
                fillOpacity={fillOpacity - i / n}
              />
            );
          });
        })()}

      {toQ &&
        (() => {
          const n = 5;
          const unitW = (scale(to + 1) - scale(to)) / 2;
          return Array.from({ length: n }).map((_, i) => {
            return (
              <rect
                key={i}
                x={scale(to + (i + 0.5))}
                y={y}
                width={unitW}
                height={barHeight}
                fill={fill}
                fillOpacity={fillOpacity - i / n}
              />
            );
          });
        })()}

      <rect
        x={x1}
        y={y}
        width={x2 - x1}
        height={barHeight}
        fill={fill}
        fillOpacity={fillOpacity}
      />
      <text
        fontSize={labelFontSize}
        x={x1 + (x2 - x1) / 2}
        y={labelY}
        textAnchor="middle"
        dominantBaseline="alphabetic"
        fill="var(--color-text)"
      >
        {raw || `${from}${fromQ ? " ca." : ""} - ${to}${toQ ? " ca." : ""}`}
      </text>
    </>
  );
}
