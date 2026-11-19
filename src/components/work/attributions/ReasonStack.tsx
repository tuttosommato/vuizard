import AttributionCircle from "@/components/work/attributions/AttributionCircle";

// The circles of the reasons that share one place on an attribution's ray (the same rank), drawn
// as a small stack spread across the ray, so that the place on the ray stays exact. With one
// reason it is just the circle. Used by the visualisation and by the table, so that the two look
// alike. It is centred on the place of the reasons; `ray` runs along x, the stack along y.
export default function ReasonStack({
  type,
  fill,
  r,
  count,
}: {
  type: React.ComponentProps<typeof AttributionCircle>["type"];
  fill: string;
  r: number;
  count: number;
}) {
  const step = r * 1.15;
  // the first reason on top: drawn last
  return (
    <>
      {Array.from({ length: count }, (_, i) => count - 1 - i).map((i) => (
        <g key={i} transform={`translate(0, ${(i - (count - 1) / 2) * step})`}>
          {count > 1 && (
            // a thin outline in the background colour tells the circles apart
            <circle r={r + 1.5} fill="var(--color-bg)" />
          )}
          <AttributionCircle type={type} fill={fill} r={r} />
        </g>
      ))}
    </>
  );
}
