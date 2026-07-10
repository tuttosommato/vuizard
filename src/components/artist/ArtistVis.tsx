import TierArcs from "./TierArcs";
import ArtistVisLegend from "./ArtistVisLegend";
import ArrowMarkerDef from "@/components/ArrowMarkerDef";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
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
  VIS_MIN_ZOOM,
  VIS_MAX_ZOOM,
  BASE_URL,
} from "@/utils/constants.ts";
import {
  forceSimulation,
  forceRadial,
  forceCollide,
  forceX,
  forceY,
} from "d3-force";
import UncertaintyPatternDefs from "./defs/UncertaintyPatternDefs";
import RadialHalftonePatternDefs from "./defs/RadialHalftonePatternDefs";
import { createPortal } from "react-dom";
import { useArtistSelection } from "@/stores/ArtistSelectionContext";

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

function WorkThumbnail({
  work,
  coords,
}: {
  work: WorkItem;
  coords: { x: number; y: number };
}) {
  const src = work.work?.photos[0]?.link;
  if (!src) return null;

  return createPortal(
    <div
      className="work-thumbnail"
      style={{
        left: coords.x,
        top: coords.y
      }}
    >
      <img src={BASE_URL + src} alt={work.work?.subject ?? "Untitled"} />
    </div>,
    document.body
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
  const [hoveredWork, setHoveredWork] = useState<{
    work: WorkItem;
    coords: { x: number; y: number };
  } | null>(null);
  const {selectedIds, toggle} = useArtistSelection();

  const dotsLength = works.flatMap((work) => {
    const attributions = work.attributions?.attributions ?? [];
    return attributions.filter((attr) => attr.local_id === artistId);
  }).length;

  const multiplier =
    dotsLength >= 400
      ? 2
      : dotsLength >= 300
        ? 3
        : dotsLength >= 200
          ? 3.25
          : 4;
  const dotRadius = useCallback(
    (d: { size: number }) => Math.sqrt(d.size) * multiplier,
    [multiplier],
  );

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
      const nAttributions = attributions.length;
      return attributions
        .filter((attr) => attr.local_id === artistId)
        .map((attr) => {
          const isDocumented = attr.reasons.some(
            (reason) => reason.rank === 10,
          );
          const relation = attr.r_qualifier;
          const radius = TIER_RADII[relation] ?? 0;
          return {
            work_id: work.id,
            aut_id: attr.local_id,
            operational_id: attr.operational_id,
            x: VIS_CX - radius,
            y: VIS_CY,
            tierRadius: radius,
            fill: attr.u_qualifier
              ? attr.u_qualifier === "?"
                ? `url(#uncertain-${attr.type}-1)`
                : `url(#uncertain-${attr.type}-2)`
              : colorScale(attr.type),
            size: nAttributions,
            type: attr.type,
            isDocumented,
          };
        });
    });

    function forceHalfPlane(
      filter: (d: (typeof nodes)[0]) => boolean,
      y0: number,
      side: "above" | "below",
    ) {
      let subset: (typeof nodes)[0][] = [];

      function force() {
        for (const d of subset) {
          const r = dotRadius(d);
          if (side === "above" && d.y > y0 - r) d.y = y0 - r;
          if (side === "below" && d.y < y0 + r) d.y = y0 + r;
        }
      }

      force.initialize = (allNodes: (typeof nodes)[0][]) => {
        subset = allNodes.filter(filter);
      };

      return force;
    }

    const centerNodes = nodes.filter((node) => node.tierRadius === 0);
    const radNodes = nodes.filter((node) => node.tierRadius !== 0);

    // apply force simulation to center nodes
    forceSimulation(centerNodes)
      .force("x", forceX(VIS_CX).strength(1))
      .force("y", forceY(VIS_CY).strength(1))
      .force(
        "half-documented",
        forceHalfPlane((d) => d.isDocumented, VIS_CY - 10, "above"),
      )
      .force(
        "half-nondocumented",
        forceHalfPlane((d) => !d.isDocumented, VIS_CY + 10, "below"),
      )
      .force(
        "collide",
        forceCollide<(typeof nodes)[0]>((d) => dotRadius(d) + 2)
          .strength(1)
          .iterations(10),
      )
      .tick(400);

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
      .force("center", forceY(VIS_CY).strength(-0.005))
      .force(
        "half-documented",
        forceHalfPlane((d) => d.isDocumented, VIS_CY - 10, "above"),
      )
      .force(
        "half-nondocumented",
        forceHalfPlane((d) => !d.isDocumented, VIS_CY + 10, "below"),
      )
      .force(
        "collide",
        forceCollide<(typeof nodes)[0]>((d) => dotRadius(d) + 2)
          .strength(1)
          .iterations(10),
      )
      .tick(400);

    return nodes;
  }, [works, artistId, dotRadius]);

  return (
    <div className="artist-vis-container">
      {hoveredWork && (
        <WorkThumbnail work={hoveredWork.work} coords={hoveredWork.coords} />
      )}
      <svg
        className="artist-vis"
        ref={svgRef}
        viewBox={`0 0 ${VIS_VIEWBOX_WIDTH} ${VIS_VIEWBOX_HEIGHT}`}
      >
        {/* Use arrow marker definition */}
        <ArrowMarkerDef />
        <UncertaintyPatternDefs />
        <RadialHalftonePatternDefs />

        <g transform={transform}>
          <TierArcs />
          <ArtistVisLegend />

          {dots.map((dot) => (
            <circle
              className={`attr-circle ${selectedIds.has(dot.work_id) ? "selected-circle" : ""}`}
              key={dot.work_id + "-" + dot.operational_id}
              cx={dot.x}
              cy={dot.y}
              r={dotRadius(dot)}
              fill={dot.fill}
              data-work-id={dot.work_id}
              onMouseEnter={(e) => {
                const work = works.find((w) => w.id === dot.work_id);
                if (!work) return;
                const rect = e.currentTarget.getBoundingClientRect();
                setHoveredWork({
                  work,
                  coords: { x: rect.right, y: rect.top + rect.height / 2 },
                });
              }}
              onMouseLeave={() => setHoveredWork(null)}
              onClick={() => toggle(dot.work_id)}
              /* stroke={dot.type === "accepted" ? "var(--color-accepted)" : "var(--color-discarded)"}
              strokeWidth={0.25} */
            />
          ))}
        </g>
      </svg>
      <ZoomControls svgRef={svgRef} zoomRef={zoomRef} />
    </div>
  );
}
