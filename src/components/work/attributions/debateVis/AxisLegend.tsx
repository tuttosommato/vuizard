import {
  center,
  rankScale,
} from "@/components/work/attributions/debateVis/constants";
import { useRef } from "react";

const textX = rankScale(12.5);
const textArrowX = rankScale(12.8);

export default function AxisLegend({
  open,
  onToggle,
}: {
  open: boolean; // the explanation is open: the "?" is then a "×" that closes it
  onToggle: (anchor: DOMRect) => void;
}) {
  const triggerRef = useRef<SVGGElement>(null);

  return (
    <g
      className="vis-arcs-legend"
      transform={center}
      textAnchor="end"
      dominantBaseline="middle"
      fill="var(--color-text)"
    >
      <text x={textX} y={rankScale(13)}>
        Objective evidence
      </text>
      <text x={textX} y={rankScale(14.5)}>
        F. Zeri opinion
      </text>
      <text x={textArrowX} y={rankScale(16.7)}>
        More authoritative source
      </text>
      <text x={textArrowX} y={rankScale(23.3)}>
        Less authoritative source
      </text>
      <line
        x1={textX}
        y1={rankScale(16)}
        x2={textX}
        y2={rankScale(24)}
        stroke="var(--color-text)"
        strokeWidth={1.5}
        markerEnd="url(#arrow)"
        markerStart="url(#arrow)"
      />
      <g
        className="axis-info-trigger"
        pointerEvents="all"
        ref={triggerRef}
        onClick={() => {
          if (triggerRef.current)
            onToggle(triggerRef.current.getBoundingClientRect());
        }}
      >
        <circle
          cx={textArrowX * 1.5}
          cy={rankScale(20)}
          r={13}
          fill="none"
          stroke="var(--color-text)"
          strokeWidth={1.5}
        />
        <text
          x={textArrowX * 1.5}
          y={rankScale(20)}
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--color-text)"
        >
          {open ? "×" : "?"}
        </text>
      </g>
    </g>
  );
}
