import TierArcs from "./TierArcs";
import ArtistVisLegend from "./ArtistVisLegend";
import ArrowMarkerDef from "@/components/ArrowMarkerDef";
import { useEffect, useState, useRef, useMemo } from "react";
import { zoom } from "d3-zoom";
import type { ZoomBehavior } from "d3-zoom";
import { select } from "d3-selection";
import type { WorkItem } from "@/types/artists";
import { easeCubicInOut } from "d3-ease";

import {
  TIER_RADII,
  colorScale,
  VIS_VIEWBOX_WIDTH,
  VIS_VIEWBOX_HEIGHT,
  VIS_CX,
  VIS_CY,
  VIS_DOT_RADIUS,
  VIS_MIN_ZOOM,
  VIS_MAX_ZOOM,
} from "@/utils/constants.ts";
import {
  forceSimulation,
  forceRadial,
  forceCollide,
  forceX,
  forceY,
} from "d3-force";

function ZoomControls({
  svgRef,
  zoomRef,
}: {
  svgRef: React.RefObject<SVGSVGElement | null>;
  zoomRef: React.RefObject<ZoomBehavior<SVGSVGElement, unknown> | null>;
}) {
  const handleZoom = (direction: "+" | "-") => {
    if (!svgRef.current || !zoomRef.current) return;
    const factor = direction === "+" ? 1.6 : 0.6;
    select(svgRef.current)
      .transition()
      .duration(200)
      .ease(easeCubicInOut)
      .call(zoomRef.current.scaleBy, factor);
  };

  return (
    <div className="zoom-controls">
      <button onClick={() => handleZoom("+")}>+</button>
      <button onClick={() => handleZoom("-")}>-</button>
    </div>
  );
}

export default function ArtistVis({
  artistId,
  works,
}: {
  artistId: string;
  works: WorkItem[];
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [transform, setTransform] = useState("translate(0, 0) scale(1)");

  useEffect(() => {
    if (!svgRef.current) return;
    const currentSvg = svgRef.current;
    const z = zoom<SVGSVGElement, unknown>()
      .scaleExtent([VIS_MIN_ZOOM, VIS_MAX_ZOOM])
      .translateExtent([
        [-50, -50],
        [VIS_VIEWBOX_WIDTH + 50, VIS_VIEWBOX_HEIGHT + 50],
      ])
      .on("zoom", (event) => {
        const t = event.transform;
        setTransform(`translate(${t.x}, ${t.y}) scale(${t.k})`);
      });

    zoomRef.current = z;
    select(currentSvg).call(z);

    return () => {
      select(currentSvg).on(".zoom", null);
    };
  }, []);

  const dots = useMemo(() => {
    const nodes = works.flatMap((work) => {
      const attributions = work.attributions?.attributions ?? [];
      return attributions
        .filter((attr) => attr.local_id === artistId)
        .map((attr) => {
          const relation = attr.r_qualifier;
          const radius = TIER_RADII[relation] ?? 0;
          return {
            work_id: work.id,
            aut_id: attr.local_id,
            operational_id: attr.operational_id,
            x: VIS_CX - radius,
            y: VIS_CY,
            tierRadius: radius,
            fill: colorScale(attr.type),
          };
        });
    });

    const centerNodes = nodes.filter((node) => node.tierRadius === 0);
    const radNodes = nodes.filter((node) => node.tierRadius !== 0);

    // apply force simulation to center nodes
    forceSimulation(centerNodes)
      .force("x", forceX(VIS_CX).strength(1))
      .force("y", forceY(VIS_CY).strength(1))
      .force(
        "collide",
        forceCollide(VIS_DOT_RADIUS + 2)
          .strength(1)
          .iterations(5),
      )
      .tick(200);
    // apply force simulation to radial nodes
    forceSimulation(radNodes)
      .force(
        "radial",
        forceRadial<(typeof nodes)[0]>(
          (d) => d.tierRadius,
          VIS_CX,
          VIS_CY,
        ).strength(2),
      )
      .force("center", forceY(VIS_CY).strength(0.02))
      .force(
        "collide",
        forceCollide(VIS_DOT_RADIUS + 2)
          .strength(1)
          .iterations(5),
      )
      .tick(200);

    return nodes;
  }, [works, artistId]);

  return (
    <div className="artist-vis-container">
      <svg
        className="artist-vis"
        ref={svgRef}
        viewBox={`0 0 ${VIS_VIEWBOX_WIDTH} ${VIS_VIEWBOX_HEIGHT}`}
      >
        {/* Use arrow marker definition */}
        <ArrowMarkerDef />

        <g transform={transform}>
          <TierArcs />
          <ArtistVisLegend />

          {dots.map((dot) => (
            <circle
              key={dot.operational_id}
              cx={dot.x}
              cy={dot.y}
              r={VIS_DOT_RADIUS}
              fill={dot.fill}
              data-work-id={dot.work_id}
            />
          ))}
        </g>
      </svg>
      <ZoomControls svgRef={svgRef} zoomRef={zoomRef} />
    </div>
  );
}
