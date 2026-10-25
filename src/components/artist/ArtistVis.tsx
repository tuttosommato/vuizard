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

// the "zoom and pan" hint shows while the vis is (nearly) unzoomed
const ZOOM_HINT_MAX_SCALE = 1.1;

function ZoomControls({
  svgRef,
  zoomRef,
  hint,
  showHint,
}: {
  svgRef: React.RefObject<SVGSVGElement | null>;
  zoomRef: React.RefObject<ZoomBehavior<SVGSVGElement, unknown> | null>;
  hint: string; // shown while the vis is unzoomed
  showHint: boolean;
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
    <>
      <div className="zoom-controls">
        <button onClick={() => handleZoom("+")}>+</button>
        <button onClick={() => handleZoom("-")}>-</button>
      </div>
      <p className={"zoom-hint" + (showHint ? "" : " zoom-hint-hidden")}>
        {hint}
      </p>
    </>
  );
}

// The photo shown for a work: the first one that has an image, as the work's card does
function thumbnailUrl(work: WorkItem): string | null {
  const path = work.work?.photos.find((photo) => photo.image_path)?.image_path;
  return path ? BASE_URL + path : null;
}

// The images already asked for are kept (and not only shown), so that one still on its way
// keeps loading after the pointer has left the circle, and the next hover finds it ready. Only
// the hovered circle's image is loaded; the oldest are let go past a limit.
const PRELOADED_LIMIT = 60;
const preloaded = new Map<string, HTMLImageElement>();
function preloadThumbnail(url: string) {
  if (preloaded.has(url)) return;
  const image = new Image();
  image.src = url;
  preloaded.set(url, image);
  if (preloaded.size > PRELOADED_LIMIT) {
    preloaded.delete(preloaded.keys().next().value as string);
  }
}

// The preview of the hovered circle's work. It is slow to arrive (the images come from the
// Foundation's server), so a frame shows meanwhile that something is on its way. Remounted
// for each work (see the key where it's used), so its state is that of one image.
function WorkThumbnail({
  work,
  coords,
}: {
  work: WorkItem;
  coords: { x: number; y: number };
}) {
  const [status, setStatus] = useState<"loading" | "ready" | "failed">(
    "loading",
  );
  const url = thumbnailUrl(work);
  if (!url || status === "failed") return null;

  return createPortal(
    <div
      className={
        "work-thumbnail" +
        (status === "loading" ? " work-thumbnail-loading" : "")
      }
      style={{
        left: coords.x,
        top: coords.y,
      }}
    >
      <img
        src={url}
        alt={work.work?.subject ?? "Untitled"}
        // an image that is already there (loaded before) may not fire load again
        ref={(img) => {
          if (img?.complete && img.naturalWidth > 0) setStatus("ready");
        }}
        onLoad={() => setStatus("ready")}
        onError={() => setStatus("failed")}
      />
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
  const [isZoomedIn, setIsZoomedIn] = useState(false);
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
        setIsZoomedIn(t.k > ZOOM_HINT_MAX_SCALE);
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
          (d) => d.radius + VIS_NUCLEUS_DOT_PADDING/1.5,
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
        forceCollide<(typeof nodes)[0]>((d) => d.radius + 1)
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
        <WorkThumbnail
          key={hoveredWork.work.id}
          work={hoveredWork.work}
          coords={hoveredWork.coords}
        />
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
                const previewUrl = thumbnailUrl(work);
                if (previewUrl) preloadThumbnail(previewUrl);
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
      <ZoomControls
        svgRef={svgRef}
        zoomRef={zoomRef}
        hint="Zoom and pan to explore the visualisation. Click a dot to select a work and see its card in the list."
        showHint={!isZoomedIn}
      />
    </div>
  );
}

export default ArtistVis;
