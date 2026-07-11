import TierArcs from "./TierArcs";
import ArtistVisLegend from "./ArtistVisLegend";
import ArrowMarkerDef from "@/components/ArrowMarkerDef";
import { useEffect, useState, useRef, useMemo } from "react";
import { zoom } from "d3-zoom";
import type { ZoomBehavior } from "d3-zoom";
import { select } from "d3-selection";
import type { WorkItem } from "@/types/artists";
import { easeCubicInOut } from "d3-ease";
import { useImperativeHandle } from "react";
import { useArtistFilter } from "@/stores/ArtistFilterContext";
import { zoomIdentity } from "d3-zoom";
import uncertaintyBucket from "@/utils/uncertaintyBucket";
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
        top: coords.y,
      }}
    >
      <img src={BASE_URL + src} alt={work.work?.subject ?? "Untitled"} />
    </div>,
    document.body,
  );
}

export type ArtistVisHandle = {
  focusOnWorks: (workIds: string[]) => void;
};

function ArtistVis({
  artistId,
  works,
  multiplier,
  ref,
}: {
  artistId: string;
  works: WorkItem[];
  multiplier: number;
  ref?: React.Ref<ArtistVisHandle>;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [transform, setTransform] = useState("translate(0, 0) scale(1)");
  const [hoveredWork, setHoveredWork] = useState<{
    work: WorkItem;
    coords: { x: number; y: number };
  } | null>(null);
  const { selectedIds, toggle, hoveredWorkId } = useArtistSelection();

  const isWorkActive = (workId: string) =>
    selectedIds.has(workId) ||
    workId === hoveredWork?.work.id ||
    workId === hoveredWorkId;

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
            uncertaintyStatus: uncertaintyBucket(attr.u_qualifier),
            radius: Math.sqrt(nAttributions) * multiplier,
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
          const r = d.radius;
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
        forceCollide<(typeof nodes)[0]>((d) => d.radius + 2)
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
        forceCollide<(typeof nodes)[0]>((d) => d.radius + 2)
          .strength(1)
          .iterations(10),
      )
      .tick(400);

    return nodes;
  }, [works, artistId, multiplier]);

  const { isWorkFilteredOut, isAttributionFilteredOut } = useArtistFilter();

  const workEdges = useMemo(() => {
    const groups = new Map<string, typeof dots>();
    for (const dot of dots) {
      const group = groups.get(dot.work_id) ?? [];
      group.push(dot);
      groups.set(dot.work_id, group);
    }

    return [...groups.values()]
      .filter((group) => group.length > 1)
      .flatMap((group) => {
        const cx = group.reduce((sum, d) => sum + d.x, 0) / group.length;
        const cy = group.reduce((sum, d) => sum + d.y, 0) / group.length;
        return group.map((d) => ({
          work_id: d.work_id,
          operational_id: d.operational_id,
          x1: d.x,
          y1: d.y,
          x2: cx,
          y2: cy,
        }));
      });
  }, [dots]);

  useImperativeHandle(ref, () => ({
    focusOnWorks(workIds) {
      if (!svgRef.current || !zoomRef.current) return;
      const matches = dots.filter((d) => workIds.includes(d.work_id));
      if (matches.length === 0) return;

      if (matches.length === 1) {
        const target = matches[0];
        const transform = zoomIdentity
          .translate(VIS_VIEWBOX_WIDTH / 2, VIS_VIEWBOX_HEIGHT / 2)
          .scale(2)
          .translate(-target.x, -target.y);

        select(svgRef.current)
          .transition()
          .duration(300)
          .call(zoomRef.current.transform, transform);
        return;
      }

      const xs = matches.map((d) => d.x);
      const ys = matches.map((d) => d.y);
      const [minX, maxX] = [Math.min(...xs), Math.max(...xs)];
      const [minY, maxY] = [Math.min(...ys), Math.max(...ys)];
      const padding = 80;
      const scale = Math.min(
        VIS_VIEWBOX_WIDTH / (maxX - minX + padding * 2), // es. 1000/500 = 2
        VIS_VIEWBOX_HEIGHT / (maxY - minY + padding * 2), // es. 900/300 = 3
        VIS_MAX_ZOOM, // es. 5
      ); // choosing the min to avoid overzoom

      const transform = zoomIdentity
        .translate(VIS_VIEWBOX_WIDTH / 2, VIS_VIEWBOX_HEIGHT / 2)
        .scale(scale)
        .translate(-(minX + maxX) / 2, -(minY + maxY) / 2); // -(left + right)/2 & -(top + bottom)/2

      select(svgRef.current)
        .transition()
        .duration(300)
        .call(zoomRef.current.transform, transform);
    },
  }));

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

          {workEdges
            .filter((edge) => isWorkActive(edge.work_id))
            .map((edge) => (
              <line
                key={`edge-${edge.work_id}-${edge.operational_id}`}
                x1={edge.x1}
                y1={edge.y1}
                x2={edge.x2}
                y2={edge.y2}
                stroke="var(--color-text-muted)"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
                data-work-id={edge.work_id}
              />
            ))}

          {dots.map((dot) => (
            <circle
              className={`attr-circle
                ${isWorkActive(dot.work_id) ? " selected-circle" : ""}
                ${isWorkFilteredOut(dot.size) || isAttributionFilteredOut(dot.uncertaintyStatus, dot.type as "accepted" | "discarded") ? "filtered-out" : ""}`}
              key={dot.work_id + "-" + dot.operational_id}
              cx={dot.x}
              cy={dot.y}
              r={dot.radius}
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

export default ArtistVis;
