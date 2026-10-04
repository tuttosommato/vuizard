import TierArcs from "@/components/artist/TierArcs";
import ArtistVisLegend from "@/components/artist/ArtistVisLegend";
import ArrowMarkerDef from "@/components/ArrowMarkerDef";
import { useEffect, useState, useRef, useMemo } from "react";
import { zoom } from "d3-zoom";
import type { ZoomBehavior } from "d3-zoom";
import { select } from "d3-selection";
import type { WorkItem } from "@/types/works";
import { easeCubicInOut } from "d3-ease";
import { useImperativeHandle } from "react";
import { useArtistFilter } from "@/stores/ArtistFilterContext";
import { zoomIdentity } from "d3-zoom";
import uncertaintyBucket from "@/utils/uncertaintyBucket";
import {
  colorScale,
  VIS_VIEWBOX_WIDTH,
  VIS_VIEWBOX_HEIGHT,
  VIS_CX,
  VIS_CY,
  VIS_MIN_ZOOM,
  VIS_MAX_ZOOM,
  VIS_HALF_PLANE_GAP,
  VIS_NUCLEUS_DOT_PADDING,
  BASE_URL,
} from "@/utils/constants.ts";
import { getArtistDotSpecs, dotTierRadius } from "@/utils/artistDots";
import {
  forceSimulation,
  forceRadial,
  forceCollide,
  forceX,
  forceY,
} from "d3-force";
import UncertaintyPatternDefs from "@/components/artist/defs/UncertaintyPatternDefs";
import RadialHalftonePatternDefs from "@/components/artist/defs/RadialHalftonePatternDefs";
import { createPortal } from "react-dom";
import { useArtistSelection } from "@/stores/ArtistSelectionContext";
import { representativeAuthor } from "@/components/work/attributions/utils";

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
  const src = work.work?.photos[0]?.image_path;
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
  nucleusRadius,
  nucleusOnly,
  outerRingRadius,
  ref,
}: {
  artistId: string;
  works: WorkItem[];
  multiplier: number;
  nucleusRadius: number;
  nucleusOnly: boolean;
  outerRingRadius: number | null;
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

  const isSelected = (workId: string) => selectedIds.has(workId);
  const isHovered = (workId: string) =>
    workId === hoveredWork?.work.id || workId === hoveredWorkId;
  // Same condition that puts any circle into .selected-circle/.hovered-circle
  // — drives the ambient dimming via a plain descendant selector instead
  // of :has(), which the previous rule depended on.
  const isDimming =
    selectedIds.size > 0 || hoveredWorkId !== null || hoveredWork !== null;

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
    const nodes = getArtistDotSpecs(works, artistId).map((spec) => {
      const { work, attr, nAttributions, isDocumented } = spec;
      const tierRadius = dotTierRadius(spec, outerRingRadius);
      return {
        work_id: work.id,
        aut_id: attr.attribution_id,
        operational_id: attr.attribution_id,
        x: VIS_CX - tierRadius,
        y: VIS_CY,
        tierRadius,
        fill: representativeAuthor(attr).u_qualifier
          ? representativeAuthor(attr).u_qualifier === "?"
            ? `url(#uncertain-${attr.type}-1)`
            : `url(#uncertain-${attr.type}-2)`
          : colorScale(attr.type),
        size: nAttributions,
        type: attr.type,
        uncertaintyStatus: uncertaintyBucket(
          representativeAuthor(attr).u_qualifier,
        ),
        radius: Math.sqrt(nAttributions) * multiplier,
        isDocumented,
      };
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
        forceHalfPlane(
          (d) => d.isDocumented,
          VIS_CY - VIS_HALF_PLANE_GAP,
          "above",
        ),
      )
      .force(
        "half-nondocumented",
        forceHalfPlane(
          (d) => !d.isDocumented,
          VIS_CY + VIS_HALF_PLANE_GAP,
          "below",
        ),
      )
      .force(
        "collide",
        // tighter than the tier dots (+2): the nucleus is a small, hard-edged space,
        // and the multiplier is fitted to this padding (see fitNucleusMultiplier)
        forceCollide<(typeof nodes)[0]>(
          (d) => d.radius + VIS_NUCLEUS_DOT_PADDING,
        )
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
        forceHalfPlane(
          (d) => d.isDocumented,
          VIS_CY - VIS_HALF_PLANE_GAP,
          "above",
        ),
      )
      .force(
        "half-nondocumented",
        forceHalfPlane(
          (d) => !d.isDocumented,
          VIS_CY + VIS_HALF_PLANE_GAP,
          "below",
        ),
      )
      .force(
        "collide",
        forceCollide<(typeof nodes)[0]>((d) => d.radius + 2)
          .strength(1)
          .iterations(10),
      )
      .tick(400);

    return nodes;
  }, [works, artistId, multiplier, outerRingRadius]);

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
        className={"artist-vis" + (isDimming ? " dimming" : "")}
        ref={svgRef}
        viewBox={`0 0 ${VIS_VIEWBOX_WIDTH} ${VIS_VIEWBOX_HEIGHT}`}
      >
        {/* Use arrow marker definition */}
        <ArrowMarkerDef />
        <UncertaintyPatternDefs />
        <RadialHalftonePatternDefs />

        <g transform={transform}>
          <TierArcs
            nucleusRadius={nucleusRadius}
            nucleusOnly={nucleusOnly}
            outerRingRadius={outerRingRadius}
          />
          <ArtistVisLegend
            nucleusRadius={nucleusRadius}
            nucleusOnly={nucleusOnly}
            outerRingRadius={outerRingRadius}
          />

          {workEdges
            .filter(
              (edge) => isSelected(edge.work_id) || isHovered(edge.work_id),
            )
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
                ${isSelected(dot.work_id) ? " selected-circle" : ""}
                ${isHovered(dot.work_id) ? " hovered-circle" : ""}
                ${isWorkFilteredOut(dot.size) || isAttributionFilteredOut(dot.uncertaintyStatus, dot.type as "accepted" | "discarded") ? " filtered-out" : ""}`}
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
