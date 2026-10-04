import {
  center,
  rankScale,
} from "@/components/work/attributions/debateVis/constants";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

const textX = rankScale(12.5);
const textArrowX = rankScale(12.8);

export default function AxisLegend() {
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(
    null,
  );
  const triggerRef = useRef<SVGGElement>(null);

  const handleToggle = () => {
    if (tooltipPos) {
      setTooltipPos(null);
      return;
    }
    if (!triggerRef.current) return;
    const bbox = triggerRef.current.getBoundingClientRect();
    setTooltipPos({ x: bbox.x + bbox.width, y: bbox.y });
  };

  // Position is computed once at open time from the trigger's screen
  // coordinates; the svg is responsive, so a resize would leave the popup
  // pointing at the wrong place. Simplest fix: close it on resize.
  useEffect(() => {
    if (!tooltipPos) return;
    const handleResize = () => setTooltipPos(null);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [tooltipPos]);

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
        onClick={() => handleToggle()}
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
          {tooltipPos ? "×" : "?"}
        </text>
      </g>
      {tooltipPos &&
        createPortal(
          <div
            className="ranking-explanation-tooltip"
            style={{ position: "fixed", left: tooltipPos.x + 10 }}
          >
            <h3>About attribution motivations</h3>
            <p className="ranking-explanation-p">
              Each <span className="keyword">attribution</span> is positioned
              according to{" "}
              <span className="keyword">how authoritative its sources are</span>{" "}
              (the closer to the centre, the more authoritative). The{" "}
              <span className="keyword">ranking</span> we used was built with
              the Fondazione Zeri, and separates{" "}
              <span className="keyword">objective evidence</span> from{" "}
              <span className="keyword">subjective attributions</span>.
            </p>
            <p className="ranking-explanation-p ranking-explanation-note">
              The <span className="keyword">ranking</span> itself is an{" "}
              <span className="keyword">interpretation</span>, built to make
              attributions comparable, not to measure truth.
            </p>
            <p className="ranking-explanation-p">
              Roughly grouped from most to least authoritative:
            </p>

            <div className="reason-type-groups">
              <div className="reason-type-cnt">
                <p className="reason-type-item-label">Objective evidence</p>
                <div className="objective-list-cnt">
                  <p>
                    Artist's signature; <br />
                    Documentation
                  </p>
                </div>
              </div>

              <div className="reason-type-cnt">
                <p className="reason-type-item-label">Subjective attributions</p>
                <div className="reason-type-list-cnt">
                  <div className="zeri-list-cnt">
                    <p>F. Zeri attribution; F. Zeri bibliography</p>
                    <p>F. Zeri note on the photograph; F. Zeri classification</p>
                  </div>
                  <div className="subjective-list-cnt">
                    <p>Bibliography</p>
                    <p>Archival classification</p>
                    <p>Scholar's attribution</p>
                    <p>
                      Scholar's note on the photograph; Sigla; Museum
                      attribution; Inscription
                    </p>
                    <p>
                      Collection attribution; Traditional attribution; Auction
                      attribution; Market attribution
                    </p>
                    <p>Anonymous note on the photograph; Stylistic analysis</p>
                    <p>False signature; Caption on photograph; Other</p>
                    <p>None</p>
                  </div>
                </div>
              </div>
            </div>
            <p className="ranking-explanation-p">
              Among subjective attributions,{" "}
              <span className="keyword">Zeri's own judgment</span> carries the
              most weight, reflecting a convention in connoisseurship archives,
              where the archive's own creator, whose eye and method shaped the
              collection in the first place, is treated as a{" "}
              <span className="keyword">privileged interpretive voice</span>{" "}
              when objective evidence is lacking, often enough to tip an
              attribution toward being accepted.
            </p>
          </div>,
          document.body,
        )}
    </g>
  );
}
