import type { Attribution } from "@/types/attributions";
import uncertaintyLine from "@/utils/uncertaintyLine";
import AttributionCircle from "@/components/work/attributions/AttributionCircle";
import type { Author } from "@/types/authors";
import {
  center,
  labelsFontSize,
  radius,
  rankScale,
  colorScale,
} from "@/components/work/attributions/debateVis/constants";
import { verticalCenterOffset } from "./geometry";
import { circleTypeFor } from "@/components/work/attributions/utils";

type GroupProps = {
  attr: Attribution;
  rotation: number;
  labelsRef: React.RefObject<Map<string, SVGTextElement>>;
  authors: { [key: string]: Author };
};


export default function AttributionsGroup({
attr,
  rotation,
  labelsRef,
  authors,
}: GroupProps) {
  const attrFill = colorScale(attr.type);
  const authorStats = authors[attr.local_id]?.stats?.[attr.operational_id];
  const circleType = circleTypeFor(attr);

  return (
    <g
      key={attr.operational_id}
      transform={`${center} rotate(${rotation})`}
      fill={attrFill}
    >
      {/* Attribution edges */}
      {attr.reasons.map((reason) => {
        const x1 = rankScale(reason.rank);
        const x2 = rankScale(0);
        const key = `${attr.operational_id}-${reason.reason}`;
        const strokeWidth = 1.5;

        return attr.u_qualifier ? (
          <path
            key={key}
            d={uncertaintyLine(
              [x1, 0, x2, 0],
              attr.u_qualifier === "?" ? 0.85 : 0.6,
            )}
            fill="none"
            stroke="var(--color-text)"
            strokeWidth={strokeWidth}
          />
        ) : (
          <line
            key={key}
            x1={x1}
            y1={0}
            x2={x2}
            y2={0}
            stroke="var(--color-text)"
            strokeWidth={strokeWidth}
          />
        );
      })}

      {/* Author symbol */}
      {attr.reasons.map((reason, ri) => {
        return (
          <g
            key={`${attr.operational_id}-${ri}`}
            transform={`translate(${rankScale(reason.rank)}, 0)`}
          >
            <AttributionCircle type={circleType} fill={attrFill} r={radius} />
            <title>{reason.reason}</title>
          </g>
        );
      })}

      {/* Average motivation value */}
      {authorStats && (
        <circle
          cx={rankScale(authorStats.counts.mean)}
          cy={0}
          r={radius / 1.5}
          fill="var(--color-text)"
          stroke="var(--color-text)"
          strokeWidth={0.75}
          fillOpacity={0.1}
          strokeOpacity={0.7}
        />
      )}

      {/* Labels - counter rotated to be read normally */}
      <text
        ref={(el) => {
          if (el) labelsRef.current.set(attr.operational_id, el);
          else labelsRef.current.delete(attr.operational_id);
        }}
        className="vis-author-label"
        transform={`translate(${rankScale(-0.2)}, 0) rotate(${-rotation}) translate(0, ${verticalCenterOffset(rotation)})`}
        dominantBaseline="middle"
        fill="var(--color-text)"
        fontSize={labelsFontSize}
      >
        {attr.author +
          (attr.r_qualifier ? " " + attr.r_qualifier : "") +
          (attr.u_qualifier ? " " + attr.u_qualifier : "")}
      </text>
    </g>
  );
}
