import { center, rankScale } from "@/components/work/attributions/debateVis/constants";

const textX = rankScale(12.5);
const textArrowX = rankScale(12.8);

export default function AxisLegend() {
           return (
             <g
              className="vis-arcs-legend"
              transform={center}
              textAnchor="end"
              dominantBaseline="middle"
              fill="var(--color-text)"
        >
          <text x={textX} y={rankScale(13)}>Documented evidence</text>
          <text x={textX} y={rankScale(14.5)}>F. Zeri opinion</text>
          <text x={textArrowX} y={rankScale(17.7)}>More reliable reason</text>
          <text x={textArrowX} y={rankScale(23.3)}>Less reliable reason</text>
          <line
            x1={textX}
            y1={rankScale(17)}
            x2={textX}
            y2={rankScale(24)}
            stroke="var(--color-text)"
            strokeWidth={1.5}
            markerEnd="url(#arrow)"
            markerStart="url(#arrow)"
          />
        </g>)
}