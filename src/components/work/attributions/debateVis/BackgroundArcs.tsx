import { range } from "d3-array";
import { arc } from "d3-shape";
import { min, max, increment, center } from "./constants";

const arcGenerator = arc<null>().innerRadius(0).startAngle(0).endAngle(Math.PI);
const radii = range(min, max, increment);

export default function BackgroundArcs() {
  return (
    <>
      {radii.map((rad) => {
        const isMaxRadius = rad >= max - 1;
        return (
          <path
            key={rad}
            transform={center}
            d={arcGenerator.outerRadius(rad)(null) ?? undefined}
            fill="none"
            stroke="var(--color-text)"
            opacity={isMaxRadius ? 1 : 0.5}
            strokeWidth={isMaxRadius ? "1.5px" : "0.5px"}
            strokeDasharray={
              rad <= min ? undefined : isMaxRadius ? undefined : "6, 8"
            }
            vectorEffect="non-scaling-stroke"
          ></path>
        );
      })}
    </>
  );
}
