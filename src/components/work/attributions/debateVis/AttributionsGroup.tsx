import type { Attribution } from "@/types/attributions";
import uncertaintyLine from "@/utils/uncertaintyLine";
import { scaleOrdinal } from "d3";
import AttributionCircle from "../AttributionCircle";
import type { Author } from "@/types/authors";
import { center, labelsFontSize, radius, rankScale } from "./constants";
import { verticalCenterOffset } from "./geometry";

type groupProps = {
  attr: Attribution;
  rotation: number;
  labelsRef: React.RefObject<Map<string, SVGTextElement>>;
  authors: { [key: string]: Author };
};

const colorScale = scaleOrdinal(
  ["accepted", "discarded"],
  ["var(--color-accepted)", "var(--color-discarded)"],
);

export default function AttributionsGroup({
  attr,
  rotation,
  labelsRef,
  authors,
}: groupProps) {
  return (
    <g
      key={attr.operational_id}
      transform={`${center} rotate(${rotation})`}
      fill={colorScale(attr.type)}
    >
      {/* Attribution edged */}
      {attr.u_qualifier
        ? attr.reasons.map((reason) => {
            const x1 = rankScale(reason.rank);
            const x2 = rankScale(0);
            return (
              <path
                key={`${attr.operational_id}-${reason.reason}`}
                d={uncertaintyLine(
                  [x1, 0, x2, 0],
                  attr.u_qualifier === "?" ? 0.85 : 0.6,
                )}
                fill="none"
                stroke="var(--color-text)"
                strokeWidth="1.5px"
              ></path>
            );
          })
        : attr.reasons.map((reason) => {
            const x1 = rankScale(reason.rank);
            const x2 = rankScale(0);
            return (
              <line
                key={`${attr.operational_id}-${reason.reason}`}
                x1={x1}
                y1={0}
                x2={x2}
                y2={0}
                stroke="var(--color-text)"
                strokeWidth={1.5}
              ></line>
            );
          })}

      {/* Author symbol */}
      {attr.reasons.map((reason, ri) => {
        const circleType = attr.is_anonymous
          ? "anonym"
          : !attr.r_qualifier
            ? "author"
            : attr.r_qualifier.trimStart().startsWith("e ")
              ? "recognised"
              : "unrecognised";
        return (
          <g
            key={`${attr.operational_id}-${ri}`}
            transform={`translate(${rankScale(reason.rank)}, 0)`}
          >
            <AttributionCircle
              type={circleType}
              fill={
                attr.type === "accepted"
                  ? "var(--color-accepted)"
                  : "var(--color-discarded)"
              }
              r={radius}
            />
            <title>{reason.reason}</title>
          </g>
        );
      })}

      {/* Average motivation value */}
      {authors[attr.local_id] &&
        authors[attr.local_id].stats[attr.operational_id] && (
          <circle
            cx={rankScale(
              authors[attr.local_id].stats[attr.operational_id].counts.mean,
            )}
            cy="0"
            r={radius / 1.5}
            fill="var(--color-text)"
            stroke="var(--color-text)"
            strokeWidth={0.75}
            fillOpacity={0.1}
            strokeOpacity={0.7}
          ></circle>
        )}

      {/* Labels - counter rotated to be read normally */}
      {(() => {
        return (
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
        );
      })()}
    </g>
  );
}
