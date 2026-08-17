import type { Attribution } from "@/types/attributions";
import uncertaintyLine from "@/utils/uncertaintyLine";
import AttributionCircle from "@/components/work/attributions/AttributionCircle";
import { verticalCenterOffset } from "@/components/work/attributions/debateVis/geometry";
import {
  circleTypeFor,
  formatAttributionLabel,
  representativeAuthor,
} from "@/components/work/attributions/utils";
import { rankScale, radius, center } from "@/components/work/attributions/debateVis/constants";
import { colorScale } from "@/utils/constants.ts";
import { createPortal } from "react-dom";
import { useState, useRef, useEffect } from "react";
import { useCrossSelection } from "@/stores/CrossSelectionContext";
import { useHighlight } from "@/stores/HighlightContext";

type GroupProps = {
  attr: Attribution;
  rotation: number;
  labelsRef: React.RefObject<Map<string, SVGTextElement>>;
  highlightMembers: Set<string> | null;
  tooltipPosition: "top" | "bottom";
};

const TOOLTIP_GAP = 4;

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
  highlightMembers,
  tooltipPosition,
}: GroupProps) {
  const attrFill = colorScale(attr.type);
  const circleType = circleTypeFor(attr);

  const symbolRefs = useRef<Map<number, SVGElement>>(new Map());
  const [coordsList, setCoordsList] = useState<
    ({ x: number; y: number } | null)[]
  >([]);

  const { selectedIds, toggle } = useCrossSelection();
  const { highlightedId, setHighlightedId } = useHighlight();
  const isHighlighted = highlightedId === attr.attribution_id;

  const isSelected = selectedIds.has(attr.attribution_id);
  const isSymbolActive = isSelected || isHighlighted;
  const isLabelActive =
    highlightMembers?.has(attr.attribution_id) || isHighlighted || isSelected;

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

  return (
    <>
      {isHighlighted &&
        attr.reasons.map((reason, ri) => {
          const date = reason.date != "" ? reason.date : null;
          return (
            <ReasonTooltip
              key={`${attr.attribution_id}-tooltip-${ri}`}
              reason={reason.reason}
              date={date}
              coords={coordsList[ri] ?? null}
              tooltipPosition={tooltipPosition}
            />
          );
        })}

      <g
        className="attribution-group"
        data-active={isSymbolActive || undefined}
        data-label-active={isLabelActive || undefined}
        transform={`${center} rotate(${rotation})`}
        fill={attrFill}
        onClick={() => toggle(attr.attribution_id)}
        onMouseEnter={() => setHighlightedId(attr.attribution_id)}
        onMouseLeave={() => setHighlightedId(null)}
      >
        {/* Edges */}
        {attr.reasons.map((reason) => {
          const x1 = rankScale(reason.rank) + radius; // edge is traced from the right edge of the circle so that it is not visible when opacity is reduced
          const x2 = rankScale(0);
          const key = `${attr.attribution_id}-${reason.reason}`;

          // call representativeAuthor since the relation is shared among all reasons of the same attribution
          return representativeAuthor(attr).u_qualifier ? (
            <path
              className="reason-edge"
              key={key}
              d={uncertaintyLine(
                [x1, 0, x2, 0],
                representativeAuthor(attr).u_qualifier === "?" ? 0.85 : 0.6,
              )}
              fill="none"
              stroke="var(--color-text)"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
            />
          ) : (
            <line
              className="reason-edge"
              key={key}
              x1={x1}
              y1={0}
              x2={x2}
              y2={0}
              stroke="var(--color-text)"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}

        {/* Symbols */}
        {attr.reasons.map((reason, ri) => (
          <g
            className="reason-symbol"
            key={`${attr.attribution_id}-sym-${ri}`}
            ref={(el) => {
              if (el) symbolRefs.current.set(ri, el);
              else symbolRefs.current.delete(ri);
            }}
            transform={`translate(${rankScale(reason.rank)}, 0)`}
          >
            <AttributionCircle type={circleType} fill={attrFill} r={radius} />
          </g>
        ))}

        {/* Labels */}
        <text
          ref={(el) => {
            if (el) labelsRef.current.set(attr.attribution_id, el);
            else labelsRef.current.delete(attr.attribution_id);
          }}
          className="vis-artist-label"
          transform={`translate(${rankScale(-0.2)}, 0) rotate(${-rotation}) translate(0, ${verticalCenterOffset(rotation)})`}
          dominantBaseline="middle"
          fill="var(--color-text)"
        >
          {formatAttributionLabel(attr)}
        </text>
      </g>
    </>
  );
}
