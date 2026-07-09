import type { Attribution } from "@/types/attributions";
import uncertaintyLine from "@/utils/uncertaintyLine";
import AttributionCircle from "@/components/work/attributions/AttributionCircle";
import type { Author } from "@/types/authors";
import { verticalCenterOffset } from "./geometry";
import { circleTypeFor } from "@/components/work/attributions/utils";
import { rankScale, radius, center } from "./constants";
import { colorScale } from "@/utils/constants.ts";
import { createPortal } from "react-dom";
import { useState, useRef, useEffect } from "react";
import { useCrossSelection } from "@/stores/CrossSelectionContext";

type GroupProps = {
  attr: Attribution;
  rotation: number;
  labelsRef: React.RefObject<Map<string, SVGTextElement>>;
  artists: { [key: string]: Author };
  setHighlightedId: React.Dispatch<React.SetStateAction<string | null>>;
  highlightedId: string | null;
  highlightMembers: Set<string> | null;
  tooltipPosition: "top" | "bottom";
};

const TOOLTIP_GAP = 8;

function ReasonTooltip({
  reason,
  date,
  coords,
  tooltipPosition,
}: {
  reason: string;
  date: string | null;
  coords: { x: number; y: number } | null;
  tooltipPosition: "top" | "bottom";
}) {
  if (!coords) return null;
  const reasonClean = reason.replace(/[-–—]/g, " ").trim();
  return createPortal(
    <div
      className="reason-tooltip"
      style={{
        position: "fixed",
        left: coords.x,
        top: coords.y,
        transform:
          tooltipPosition === "top"
            ? `translate(${TOOLTIP_GAP}px, calc(-100% - ${TOOLTIP_GAP}px))`
            : `translate(${TOOLTIP_GAP}px, ${TOOLTIP_GAP}px)`,
      }}
    >
      <p>
        <span className="keyword">{reasonClean}</span>
        <br />
        {date ? `${date}` : "date: n/a"}
      </p>
    </div>,
    document.body,
  );
}

export default function AttributionsGroup({
  attr,
  rotation,
  labelsRef,
  artists,
  setHighlightedId,
  highlightedId,
  highlightMembers,
  tooltipPosition,
}: GroupProps) {
  const attrFill = colorScale(attr.type);
  const artistStats = artists[attr.local_id]?.stats?.[attr.operational_id];
  const circleType = circleTypeFor(attr);

  const symbolRefs = useRef<Map<number, SVGElement>>(new Map());
  const [coordsList, setCoordsList] = useState<
    ({ x: number; y: number } | null)[]
  >([]);
  
  const isHighlighted = highlightedId === attr.operational_id;

  useEffect(() => {
    const next = attr.reasons.map((_, ri) => {
      const el = symbolRefs.current.get(ri);
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2,
        y: tooltipPosition === "top" ? rect.top : rect.bottom,
      };
    });
    setCoordsList(next);
  }, [isHighlighted, attr.reasons, tooltipPosition]);

  
  const { selectedIds, toggle } = useCrossSelection();

  const opacityLogic1 = !selectedIds.has(attr.operational_id) ? !highlightedId
    ? 1
    : highlightedId && highlightedId === attr.operational_id
      ? 1
      : 0.4
        : 1;
  const opacityLogic2 = !selectedIds.has(attr.operational_id) ? !highlightedId
    ? 1
    : (highlightedId && highlightedId === attr.operational_id) ||
        (highlightedId && highlightMembers?.has(attr.operational_id))
      ? 1
      : 0.4
        : 1;



  return (
    <>
      {isHighlighted &&
        attr.reasons.map((reason, ri) => {
          const date = reason.dates.length > 0 ? reason.dates[0] : null;
          return (
            <ReasonTooltip
              key={`${attr.operational_id}-tooltip-${ri}`}
              reason={reason.reason}
              date={date}
              coords={coordsList[ri] ?? null}
              tooltipPosition={tooltipPosition}
            />
          );
        })}

      <g
        className="attribution-group"
        transform={`${center} rotate(${rotation})`}
        fill={attrFill}
        onClick={() => toggle(attr.operational_id)}
        onMouseEnter={() => setHighlightedId(attr.operational_id)}
        onMouseLeave={() => setHighlightedId(null)}
      >
        {/* Edges */}
        {attr.reasons.map((reason) => {
          const x1 = rankScale(reason.rank) + radius; // edge is traced from the right edge of the circle so that it is not visible when opacity is reduced
          const x2 = rankScale(0);
          const key = `${attr.operational_id}-${reason.reason}`;

          return attr.u_qualifier ? (
            <path
              key={key}
              d={uncertaintyLine(
                [x1, 0, x2, 0],
                attr.u_qualifier === "?" ? 0.85 : 0.6,
              )}
              fill="none"
              stroke="var(--color-text)"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
              style={{
                opacity: opacityLogic1,
              }}
            />
          ) : (
            <line
              key={key}
              x1={x1}
              y1={0}
              x2={x2}
              y2={0}
              stroke="var(--color-text)"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
              style={{
                opacity: opacityLogic1,
              }}
            />
          );
        })}

        {/* Symbols */}
        {attr.reasons.map((reason, ri) => (
          <g
            key={`${attr.operational_id}-sym-${ri}`}
            ref={(el) => {
              if (el) symbolRefs.current.set(ri, el);
              else symbolRefs.current.delete(ri);
            }}
            transform={`translate(${rankScale(reason.rank)}, 0)`}
            style={{
              opacity: opacityLogic1,
            }}
          >
            <AttributionCircle type={circleType} fill={attrFill} r={radius} />
            <title>{reason.reason}</title>
          </g>
        ))}

        {/* Average */}
        {artistStats && (
          <circle
            cx={rankScale(artistStats.counts.mean)}
            cy={0}
            r={radius / 1.5}
            fill="var(--color-text)"
            stroke="var(--color-text)"
            strokeWidth={0.75}
            fillOpacity={0.1}
            strokeOpacity={0.7}
            vectorEffect="non-scaling-stroke"
            style={{
              opacity: opacityLogic1,
            }}
          />
        )}

        {/* Labels */}
        <text
          ref={(el) => {
            if (el) labelsRef.current.set(attr.operational_id, el);
            else labelsRef.current.delete(attr.operational_id);
          }}
          className="vis-artist-label"
          transform={`translate(${rankScale(-0.2)}, 0) rotate(${-rotation}) translate(0, ${verticalCenterOffset(rotation)})`}
          dominantBaseline="middle"
          fill="var(--color-text)"
          style={{
            opacity: opacityLogic2,
          }}
        >
          {attr.author +
            (attr.r_qualifier ? " " + attr.r_qualifier : "") +
            (attr.u_qualifier ? " " + attr.u_qualifier : "")}
        </text>
      </g>
    </>
  );
}
