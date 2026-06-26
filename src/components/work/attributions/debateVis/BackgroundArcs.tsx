import { range } from "d3-array";
import { arc } from "d3-shape";
import { min, max, increment, center } from "./constants";

const arcGenerator = arc<null>().innerRadius(0).startAngle(0).endAngle(Math.PI);
const radii = range(max, min, - increment);

export default function BackgroundArcs() {
  return (
    <>
      {radii.map((rad, i) => {
        return (
          <path
            key={rad}
            transform={center}
            d={arcGenerator.outerRadius(rad)(null) ?? undefined}
            fill={i === 11 ? "var(--color-bg)" : i === 8 ? "var(--color-text)" : "none"}
            fillOpacity={i === 11 ? 1 : i === 8 ? 0.2 : 0}
            stroke="var(--color-text)"
            strokeOpacity={(i === 0 || i === 11) ? 1 : i === 8 ? 0.7 : 0.4}
            strokeWidth={i === 0 ? 1.5 : (i === 8 || i === 11)  ? 0.6 : 0.4}
            strokeDasharray={
              (i === 0 || i === 11) ? undefined : "6, 8"
            }
            vectorEffect="non-scaling-stroke"
          ></path>
        );
      })}
    </>
  );
}
