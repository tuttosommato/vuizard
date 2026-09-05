import { range } from "d3-array";
import { arc } from "d3-shape";
import {
  min,
  max,
  increment,
  center,
  rankScale,
} from "@/components/work/attributions/debateVis/constants";

const arcGenerator = arc<null>().innerRadius(0).startAngle(0).endAngle(Math.PI);
const radii = range(max, min, -increment);
const bandOuterRank = 8.5;
const bandInnerRank = 10.5;

export default function BackgroundArcs() {
  return (
    <>
      <path
        transform={center}
        d={
          arcGenerator.outerRadius(rankScale(bandOuterRank))(null) ?? undefined
        }
        fill="var(--color-text)"
        fillOpacity={0.12}
      />
      <path
        transform={center}
        d={
          arcGenerator.outerRadius(rankScale(bandInnerRank))(null) ?? undefined
        }
        fill="var(--color-bg)"
        fillOpacity={1}
      />

      {radii.map((rad, i) => {
        return (
          <path
            key={rad}
            transform={center}
            d={arcGenerator.outerRadius(rad)(null) ?? undefined}
            fill={i === 11 ? "var(--color-bg)" : "none"}
            fillOpacity={i === 11 ? 1 : 0}
            stroke="var(--color-text)"
            strokeOpacity={i === 0 || i === 11 ? 1 : 0.3}
            strokeWidth={i === 0 ? 1.5 : i === 11 ? 1 : 0.4}
            strokeDasharray={i === 0 || i === 11 ? undefined : "6, 8"}
            vectorEffect="non-scaling-stroke"
          ></path>
        );
      })}
    </>
  );
}
