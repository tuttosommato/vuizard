import type { Attribution } from "@/types/attributions";
import uncertaintyLine from "@/utils/uncertaintyLine";
import ReasonStack from "@/components/work/attributions/ReasonStack";
import { verticalCenterOffset } from "@/components/work/attributions/debateVis/geometry";
import {
  circleTypeFor,
  formatAttributionLabel,
  reasonsByRank,
  representativeAuthor,
} from "@/components/work/attributions/utils";
import { rankScale, radius, center } from "@/components/work/attributions/debateVis/constants";
import { colorScale } from "@/utils/constants.ts";
import { createPortal } from "react-dom";
import { useState, useRef, useEffect, useMemo } from "react";
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

// The tooltip of a position on the ray: one entry for each reason that has it (usually one)
function ReasonTooltip({
  entries,
  coords,
  tooltipPosition,
}: {
  entries: { reason: string; date: string | null; rawReason: string }[];
  coords: { x: number; y: number } | null;
  tooltipPosition: "top" | "bottom";
}) {
  if (!coords) return null;
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
      {entries.map((entry, i) => (
        <p key={i} className="reason-tooltip-entry">
          <span className="keyword">
            {entry.reason.replace(/[-–—]/g, " ").trim()}
          </span>
          <br />
          {entry.rawReason}
          <br />
          {entry.date ? "" : "date: n/a"}
        </p>
      ))}
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

  // the reasons by position on the ray: reasons of the same rank share one
  const positions = useMemo(() => reasonsByRank(attr.reasons), [attr.reasons]);

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
    const next = positions.map((_, pi) => {
      const el = symbolRefs.current.get(pi);
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2,
        y: tooltipPosition === "top" ? rect.top : rect.bottom,
      };
    });
    setCoordsList(next);
  }, [isHighlighted, positions, tooltipPosition]);

  return (
    <>
      {isHighlighted &&
        positions.map((position, pi) => (
          <ReasonTooltip
            key={`${attr.attribution_id}-tooltip-${pi}`}
            entries={position.reasons.map((reason) => ({
              reason: reason.reason,
              date: reason.date != "" ? reason.date : null,
              rawReason: reason.original_text,
            }))}
            coords={coordsList[pi] ?? null}
            tooltipPosition={tooltipPosition}
          />
        ))}

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
        {positions.map(({ rank }) => {
          const x1 = rankScale(rank) + radius; // edge is traced from the right edge of the circle so that it is not visible when opacity is reduced
          const x2 = rankScale(0);
          const key = `${attr.attribution_id}-edge-${rank}`;

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

        {/* Symbols: one place for each rank; several reasons of the same rank make a small stack */}
        {positions.map(({ rank, reasons }, pi) => {
          const n = reasons.length;
          return (
            <g
              className="reason-symbol"
              key={`${attr.attribution_id}-sym-${rank}`}
              ref={(el) => {
                if (el) symbolRefs.current.set(pi, el);
                else symbolRefs.current.delete(pi);
              }}
              transform={`translate(${rankScale(rank)}, 0)`}
            >
              <ReasonStack
                type={circleType}
                fill={attrFill}
                r={radius}
                count={n}
              />
            </g>
          );
        })}

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
