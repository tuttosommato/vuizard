import type { Artist } from "@/types/artists";
import { schoolName } from "@/utils/schoolNames";
import { formatLife } from "@/utils/formatLife";
import type { AuthorsCoBundle } from "@/types/coOccurrences";
import { useMemo, useRef, useState, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { hierarchy, pack, scaleOrdinal, schemeTableau10 } from "d3";
import type { HierarchyCircularNode } from "d3";
import { zoom } from "d3-zoom";
import type { ZoomBehavior } from "d3-zoom";
import { select } from "d3-selection";
import { easeCubicInOut } from "d3-ease";
import {
  VIS_VIEWBOX_WIDTH,
  VIS_VIEWBOX_HEIGHT,
  VIS_MIN_ZOOM,
  VIS_MAX_ZOOM,
} from "@/utils/constants.ts";
import { useOverviewFilter } from "@/stores/OverviewFilterContext";
import {
  registerDotsContainer,
  registerHoverFocus,
  highlightDot,
  registerArtistTooltipEl,
  showArtistTooltip,
  hideArtistTooltip,
} from "@/stores/hoverBus";
import { useOverviewSelection } from "@/stores/OverviewSelectionContext";
import { getHighlightedIds } from "@/utils/coOccurrences";
import { getCoOccurrenceColor } from "@/utils/coOccurrenceColor";

type LeafRecord = {
  id: string;
  name: string;
  chain: string[];
  value: number;
};

type TreeNode =
  | { type: "group"; name: string; children: TreeNode[] }
  | { type: "leaf"; id: string; name: string; value: number };

type PackedNode = HierarchyCircularNode<TreeNode>;

type RenderCircle = { key: string; x: number; y: number; r: number };
type GroupStats = { artists: number; attributions: number };
type LeafRenderCircle = RenderCircle & {
  id: string;
  name: string;
  life: string; // life dates, for the tooltip
  groupKey: string | null;
  centuryBucket: number | null;
};
type ArtistEdge = {
  key: string;
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

const TOOLTIP_GAP = 4;

// compute total attributions for a given artist
function getTotal(artist: Artist) {
  return Object.values(artist.stats).reduce(
    (total, stat) => total + stat.counts.total,
    0,
  );
}

// Groups records by their chain[depth] value. Within each group, records
// whose chain ends exactly at this depth become direct leaf children;
// records that continue deeper get grouped further, recursively.
// e.g. if depth=0, then all records with chain[0] === "Italy" will be grouped together;
// within that group, records with chain.length === 1 become leaves, while records with chain.length > 1 get grouped by their chain[1] value, and so on recursively.
function buildTree(records: LeafRecord[], depth: number): TreeNode[] {
  // Group records by their chain[depth] value
  const byKey = new Map<string, LeafRecord[]>();
  for (const rec of records) {
    const key = rec.chain[depth];
    const bucket = byKey.get(key);
    if (bucket) bucket.push(rec);
    else byKey.set(key, [rec]);
  }
  // For each group, create a TreeNode: either a leaf (if the chain ends here) or a group (if the chain continues deeper).
  // Recurse for groups that continue deeper.
  return Array.from(byKey.entries()).map(([name, recs]) => {
    const endsHere = recs.filter((r) => r.chain.length === depth + 1);
    const continues = recs.filter((r) => r.chain.length > depth + 1);

    const children: TreeNode[] = [
      ...buildTree(continues, depth + 1),
      ...endsHere.map((r) => ({
        type: "leaf" as const,
        id: r.id,
        name: r.name,
        value: r.value,
      })),
    ];

    return { type: "group" as const, name, children };
    // e.g. { type: "group", name: "Italy", children: [...] }
  });
}

// Returns a unique key for a given node, based on its ancestors' names/ids.
function pathKey(node: PackedNode): string {
  return node
    .ancestors()
    .reverse()
    .map((a) => (a.data.type === "group" ? a.data.name : a.data.id))
    .join(">");
}

// Returns the nation (chain[0]) of a given node, or "unknown" if it can't be determined.
function nationOf(node: PackedNode): string {
  const nationNode = node.ancestors().find((a) => a.depth === 1);
  return nationNode && nationNode.data.type === "group"
    ? nationNode.data.name
    : "unknown";
}

// the "zoom and pan" hint shows while the vis is (nearly) unzoomed
const ZOOM_HINT_MAX_SCALE = 1.1;

// Same zoom-control buttons as ArtistVis (+/- via d3-zoom's scaleBy,
// eased over the existing svgRef/zoomRef).
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

// Same tooltip styling used elsewhere in the app (see .reason-tooltip in
// work.css, used by DebateVis's AttributionsGroup) — a fixed-position
// portal placed from the hovered bubble's own bounding rect (by PackingVis, through
// `tooltipRef`, every time the zoom or pan moves the bubble), so it stays put on its bubble.
function AreaTooltip({
  label,
  stats,
  tooltipRef,
}: {
  label: string;
  stats: GroupStats | undefined;
  tooltipRef: React.RefObject<HTMLDivElement | null>;
}) {
  return createPortal(
    <div
      ref={tooltipRef}
      className="reason-tooltip"
      style={{
        position: "fixed",
        transform: `translate(-50%, calc(-100% - ${TOOLTIP_GAP}px))`,
      }}
    >
      <p className="tooltip-title">{label}</p>
      {stats && (
        <p className="tooltip-sub">
          {stats.artists.toLocaleString("en")}{" "}
          {stats.artists === 1 ? "artist" : "artists"} -{" "}
          {stats.attributions.toLocaleString("en")}{" "}
          {stats.attributions === 1 ? "attribution" : "attributions"}
        </p>
      )}
    </div>,
    document.body,
  );
}

// the tooltip that follows the pointer over a dot, placed against the dot's right edge
function showHoverTooltip(name: string, life: string, dot: Element) {
  const rect = dot.getBoundingClientRect();
  showArtistTooltip(
    name,
    {
      x: rect.right + TOOLTIP_GAP,
      y: rect.bottom - rect.height / 2,
    },
    life,
  );
}

function ArtistTooltip() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    registerArtistTooltipEl(ref.current);
    return () => registerArtistTooltipEl(null);
  }, []);

  return createPortal(
    <div
      ref={ref}
      className="reason-tooltip"
      style={{
        position: "fixed",
        opacity: 0,
        pointerEvents: "none",
        // centred on the dot's height, where the selected artists' tooltips sit
        transform: "translateY(-50%)",
      }}
    />,
    document.body,
  );
}

// Labels with a curved arrow to the main bubbles, to say what the picture is about. Each label
// sits at `offset` from its bubble's centre (viewBox units, so it follows the bubble when the
// data moves it), and its arrow runs from there to the rim at `tipAngle` (degrees, y pointing
// down; by default the direction of the label), bowed sideways by `bend` (a fraction of its
// length: positive turns it one way, negative the other). The offsets are chosen so that no
// two arrows cross and no arrow runs through a label. Keys are the bubbles' paths in the
// pack (see pathKey); a bubble that isn't there is skipped.
//
// `from` is where on the string the arrow starts, i.e. which side of the text hangs off the
// start point (`offset`):
//   "left" / "right"                        the middle of the text's left / right end
//   "top" / "top-start" / "top-end"         the top edge: centre, start or end of the text
//   "bottom" / "bottom-start" / "bottom-end"  the bottom edge: likewise
// Left out, it is worked out from the direction of the label (the label sits away from its
// bubble).
type LabelFrom =
  | "left"
  | "right"
  | "top"
  | "top-start"
  | "top-end"
  | "bottom"
  | "bottom-start"
  | "bottom-end";
type Annotation = {
  key: string;
  label: string;
  offset: [number, number];
  from?: LabelFrom;
  tipAngle?: number;
  bend: number;
};
const ANNOTATIONS: Annotation[] = [
  {
    key: "root>italiana",
    label: "Italian school",
    offset: [-10, -490],
    from: "right",
    tipAngle: -85,
    bend: -0.7,
  },
  {
    key: "root>unknown",
    label: "Unknown",
    offset: [80, -120],
    from: "bottom",
    tipAngle: -50,
    bend: -0.2,
  },
  {
    key: "root>francese",
    label: "French school",
    offset: [60, -100],
    from: "left",
    tipAngle: -80,
    bend: 0.4,
  },
  {
    key: "root>olandese",
    label: "Dutch school",
    offset: [60, -67],
    from: "left",
    tipAngle: -60,
    bend: 0.2,
  },
  {
    key: "root>fiamminga",
    label: "Flemish school",
    offset: [80, 50],
    from: "top",
    tipAngle: 7,
    bend: 0.6,
  },
  {
    key: "root>tedesca",
    label: "German school",
    offset: [60, 60],
    from: "left",
    tipAngle: 70,
    bend: -0.5,
  },
  {
    key: "root>spagnola",
    label: "Spanish school",
    offset: [0, -100],
    from: "bottom",
    tipAngle: -60,
    bend: -0.4,
  },
  {
    key: "root>inglese",
    label: "English school",
    offset: [30, 60],
    from: "top",
    tipAngle: 40,
    bend: 0.4,
  },
];
const ANNOTATION_FONT_SIZE = 16; // viewBox units
const ANNOTATION_TIP_GAP = 10; // an arrow stops this far from the rim
const ANNOTATION_LABEL_GAP = 6; // between an arrow's start and its text
const ANNOTATION_HEAD_LENGTH = 10; // the two strokes of an arrowhead
const ANNOTATION_HEAD_ANGLE = 0.7; // radians either side of the arrow's direction

// How the text is set so that the arrow starts at `from` of it
function labelLayout(
  from: LabelFrom,
  tail: { x: number; y: number },
): {
  x: number;
  y: number;
  anchor: "start" | "middle" | "end";
  baseline: "auto" | "middle" | "hanging";
} {
  const gap = ANNOTATION_LABEL_GAP;
  switch (from) {
    case "left":
      return {
        x: tail.x + gap,
        y: tail.y,
        anchor: "start",
        baseline: "middle",
      };
    case "right":
      return { x: tail.x - gap, y: tail.y, anchor: "end", baseline: "middle" };
    case "top":
      return {
        x: tail.x,
        y: tail.y + gap,
        anchor: "middle",
        baseline: "hanging",
      };
    case "top-start":
      return {
        x: tail.x,
        y: tail.y + gap,
        anchor: "start",
        baseline: "hanging",
      };
    case "top-end":
      return { x: tail.x, y: tail.y + gap, anchor: "end", baseline: "hanging" };
    case "bottom":
      return { x: tail.x, y: tail.y - gap, anchor: "middle", baseline: "auto" };
    case "bottom-start":
      return { x: tail.x, y: tail.y - gap, anchor: "start", baseline: "auto" };
    case "bottom-end":
      return { x: tail.x, y: tail.y - gap, anchor: "end", baseline: "auto" };
  }
}

const toRad = (deg: number) => (deg * Math.PI) / 180;

function Annotations({
  circles,
  hidden,
}: {
  circles: RenderCircle[];
  hidden: boolean;
}) {
  const byKey = new Map(circles.map((c) => [c.key, c]));
  return (
    <g
      className={"overview-annotations" + (hidden ? " hidden" : "")}
      aria-hidden="true"
    >
      {ANNOTATIONS.map(
        ({ key, label, offset, from, tipAngle, bend }, index) => {
          const c = byKey.get(key);
          if (!c) return null;
          const tail = { x: c.x + offset[0], y: c.y + offset[1] };
          // which way the label lies from the bubble: decides how the text is anchored
          const away = Math.atan2(offset[1], offset[0]);
          const dx = Math.cos(away);
          const dy = Math.sin(away);
          const landing = tipAngle === undefined ? away : toRad(tipAngle);
          const tip = {
            x: c.x + (c.r + ANNOTATION_TIP_GAP) * Math.cos(landing),
            y: c.y + (c.r + ANNOTATION_TIP_GAP) * Math.sin(landing),
          };
          // a quadratic curve: its control point is the arrow's midpoint pushed sideways
          const length = Math.hypot(tip.x - tail.x, tip.y - tail.y);
          const control = {
            x:
              (tail.x + tip.x) / 2 -
              ((tip.y - tail.y) / length) * bend * length,
            y:
              (tail.y + tip.y) / 2 +
              ((tip.x - tail.x) / length) * bend * length,
          };
          // where the text goes: as asked by `from`, or else away from the bubble
          const layout = from
            ? labelLayout(from, tail)
            : {
                x:
                  tail.x +
                  (dx > 0.35
                    ? ANNOTATION_LABEL_GAP
                    : dx < -0.35
                      ? -ANNOTATION_LABEL_GAP
                      : 0),
                y:
                  dy < -0.35
                    ? tail.y - ANNOTATION_LABEL_GAP
                    : dy > 0.35
                      ? tail.y + ANNOTATION_LABEL_GAP
                      : tail.y,
                anchor: (dx > 0.35
                  ? "start"
                  : dx < -0.35
                    ? "end"
                    : "middle") as "start" | "middle" | "end",
                baseline: (dy < -0.35
                  ? "auto"
                  : dy > 0.35
                    ? "hanging"
                    : "middle") as "auto" | "middle" | "hanging",
              };
          // the arrowhead: two short strokes back from the tip, along the curve's end
          // direction. Drawn apart from the line (not as a marker, which would show before
          // the line gets there) so it can appear at the end of the drawing.
          const endLength = Math.hypot(tip.x - control.x, tip.y - control.y);
          const back = {
            x: (control.x - tip.x) / endLength,
            y: (control.y - tip.y) / endLength,
          };
          const headPoint = (angle: number) => {
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            return `${tip.x + ANNOTATION_HEAD_LENGTH * (back.x * cos - back.y * sin)} ${tip.y + ANNOTATION_HEAD_LENGTH * (back.x * sin + back.y * cos)}`;
          };
          return (
            // --i staggers the labels' drawing in (see overview.css)
            <g key={key} style={{ "--i": index } as React.CSSProperties}>
              <path
                className="annotation-arrow"
                d={`M ${tail.x} ${tail.y} Q ${control.x} ${control.y} ${tip.x} ${tip.y}`}
                fill="none"
                pathLength={1}
              />
              <path
                className="annotation-head"
                d={`M ${headPoint(ANNOTATION_HEAD_ANGLE)} L ${tip.x} ${tip.y} L ${headPoint(-ANNOTATION_HEAD_ANGLE)}`}
                fill="none"
              />
              <text
                x={layout.x}
                y={layout.y}
                textAnchor={layout.anchor}
                dominantBaseline={layout.baseline}
                fontSize={ANNOTATION_FONT_SIZE}
              >
                {label}
              </text>
            </g>
          );
        },
      )}
    </g>
  );
}

// The name tooltip of every selected artist stays on (one per dot, if the artist has dots in
// several schools). Like the hover tooltip it follows its dot, but it is placed against the
// vis's container, not the page, so it stays under the About overlay and the sidebar, and
// is hidden when the dot is panned out of view. Positions are set straight on the elements
// (no state) whenever the zoom, the selection or the container's size changes.
const SELECTED_LABEL_GAP = 4; // px between a dot and its label

function SelectedArtistLabels({
  dots,
  transform,
  containerRef,
}: {
  dots: { key: string; id: string; name: string; life: string }[];
  transform: string; // only so that the labels follow the zoom
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const labelRefs = useRef(new Map<string, HTMLDivElement>());

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const place = () => {
      const box = container.getBoundingClientRect();
      for (const { key } of dots) {
        const label = labelRefs.current.get(key);
        const dot = container.querySelector(
          `[data-dot-key="${key.replace(/["\\]/g, "\\$&")}"]`,
        );
        if (!label || !dot) continue;
        const rect = dot.getBoundingClientRect();
        const x = rect.right + SELECTED_LABEL_GAP - box.left;
        const y = rect.top + rect.height / 2 - box.top;
        const inView = x > 0 && x < box.width && y > 0 && y < box.height;
        label.style.transform = `translate(${x}px, ${y}px) translateY(-50%)`;
        label.style.visibility = inView ? "visible" : "hidden";
      }
    };

    place();
    const observer = new ResizeObserver(place);
    observer.observe(container);
    return () => observer.disconnect();
  }, [dots, transform, containerRef]);

  return dots.map(({ key, id, name, life }) => (
    <div
      key={key}
      data-artist-id={id}
      ref={(el) => {
        if (el) labelRefs.current.set(key, el);
        else labelRefs.current.delete(key);
      }}
      className="reason-tooltip selected-artist-label"
    >
      <p className="tooltip-title">{name}</p>
      <p className="tooltip-sub">{life}</p>
    </div>
  ));
}

export default function PackingVis({
  artists,
  coOccurrences,
}: {
  artists: Record<string, Artist>;
  coOccurrences: AuthorsCoBundle;
}) {
  const { isArtistFilteredOut } = useOverviewFilter();
  const svgRef = useRef<SVGSVGElement>(null);
  const visContainerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [transform, setTransform] = useState("translate(0, 0) scale(1)");
  const [isZoomedIn, setIsZoomedIn] = useState(false);
  const { selectedIds, toggle } = useOverviewSelection();
  // Selected authors + whoever co-occurs with all of them.
  const highlightedIds = useMemo(
    () => getHighlightedIds(selectedIds, coOccurrences),
    [selectedIds, coOccurrences],
  );

  // Hovering an artist shows what selecting it would do (hoverBus.ts): with nothing selected,
  // who appears with it; with something selected, who appears with the selection and the
  // hovered artist, i.e. what the highlight would narrow down to if it were selected too.
  const selectedIdsRef = useRef(selectedIds);
  useEffect(() => {
    selectedIdsRef.current = selectedIds;
  }, [selectedIds]);
  useEffect(() => {
    registerHoverFocus({
      related: (id) => {
        const selected = selectedIdsRef.current;
        if (selected.has(id)) return null; // already selected: nothing to preview
        const withHovered = new Set([...selected, id]); // in selection order, as it would be
        const related = new Map<string, string>();
        for (const relatedId of getHighlightedIds(withHovered, coOccurrences)) {
          if (withHovered.has(relatedId)) continue; // the selected ones keep their look
          // coloured by its first connection to the (would-be) selection, as dots are
          let ratio = 0;
          for (const anyId of withHovered) {
            const connection = coOccurrences[anyId]?.co_authors?.[relatedId];
            if (connection) {
              const { accepted, total } = connection.co_author_counts;
              ratio = total ? accepted / total : 0;
              break;
            }
          }
          related.set(relatedId, getCoOccurrenceColor(ratio));
        }
        return related;
      },
    });
    return () => registerHoverFocus(null);
  }, [coOccurrences]);

  const groupCircleRefs = useRef<Map<string, SVGCircleElement>>(new Map());
  const [hoveredGroupKey, setHoveredGroupKey] = useState<string | null>(null);
  const areaTooltipRef = useRef<HTMLDivElement>(null);

  // Put the school tooltip at the top centre of the hovered bubble, and keep it there as the
  // zoom or pan moves the bubble (`transform`): it is set straight on the element, no state,
  // so that following a zoom doesn't cost another render of the 5,000+ dots. Before the
  // first paint, so it never shows up at the wrong place.
  useLayoutEffect(() => {
    const tooltip = areaTooltipRef.current;
    const bubble = hoveredGroupKey
      ? groupCircleRefs.current.get(hoveredGroupKey)
      : null;
    if (!tooltip || !bubble) return;
    const rect = bubble.getBoundingClientRect();
    tooltip.style.left = `${rect.left + rect.width / 2}px`;
    tooltip.style.top = `${rect.top}px`;
  }, [hoveredGroupKey, transform]);

  // Set up D3 zoom behavior on the SVG element and update the transform state
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

  // Compute leaf records and packed layout (only when artists data changes)
  const leafRecords: LeafRecord[] = useMemo(() => {
    return Object.values(artists).flatMap((artist) =>
      artist.cultural_context_info.declarations.map((d) => ({
        id: artist.id,
        name: artist.name,
        chain: d.chain,
        value: getTotal(artist),
      })),
    );
  }, [artists]);

  const areaColor = useMemo(() => {
    const nations = new Set(leafRecords.map((r) => r.chain[0]));
    return scaleOrdinal<string>()
      .domain([...nations])
      .range(schemeTableau10);
  }, [leafRecords]);

  // Everything in one global nested pack
  // so that the bubbles are sized relative to each other across nations.
  const packedRoot: PackedNode = useMemo(() => {
    const tree: TreeNode = {
      type: "group",
      name: "root",
      children: buildTree(leafRecords, 0),
    };

    const root = hierarchy<TreeNode>(tree, (d) =>
      d.type === "group" ? d.children : undefined,
    )
      .sum((d) => (d.type === "leaf" ? d.value : 0))
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    return pack<TreeNode>()
      .size([VIS_VIEWBOX_WIDTH, VIS_VIEWBOX_HEIGHT])
      .padding(3)(root);
  }, [leafRecords]);

  // Compute the circles to render for groups and leaves,
  // along with maps for nation and label lookups
  const { groupCircles, leafCircles, nationByKey, labelByKey, statsByKey } =
    useMemo(() => {
      const groupCircles: RenderCircle[] = [];
      const leafCircles: LeafRenderCircle[] = [];
      const nationByKey = new Map<string, string>();
      const labelByKey = new Map<string, string>();
      const statsByKey = new Map<string, GroupStats>();
      for (const node of packedRoot.descendants()) {
        if (node.depth === 0) continue;
        const key = pathKey(node);
        if (node.data.type === "group") {
          groupCircles.push({ key, x: node.x, y: node.y, r: node.r });
          nationByKey.set(key, nationOf(node));
          labelByKey.set(key, schoolName(node.data.name));
          // the artists in it (one with dots in two schools counts once in each, and once in
          // the bubbles that hold both) and their attributions
          const ids = new Set<string>();
          for (const leaf of node.leaves()) {
            if (leaf.data.type === "leaf") ids.add(leaf.data.id);
          }
          let attributions = 0;
          for (const id of ids) attributions += getTotal(artists[id]);
          statsByKey.set(key, { artists: ids.size, attributions });
        } else {
          // hovering an author dot shows the tooltip for
          // whichever bubble directly contains it
          const parentKey = node.parent ? pathKey(node.parent) : null;
          const centuryBucket =
            artists[node.data.id].cultural_context_info.century_bucket ?? null;
          leafCircles.push({
            key,
            id: node.data.id,
            name: node.data.name,
            life: formatLife(artists[node.data.id].life),
            x: node.x,
            y: node.y,
            r: node.r,
            groupKey: parentKey,
            centuryBucket,
          });
        }
      }
      return { groupCircles, leafCircles, nationByKey, labelByKey, statsByKey };
    }, [packedRoot, artists]);

  // One artist can own more than one leaf circle (multiple cultural-
  // context declarations) — same shape as ArtistVis's workEdges: group
  // by id, and for any group with more than one member, connect each
  // circle to the group's centroid. Only rendered/visible when that
  // artist's id is hovered (see hoverBus.ts + the "hovered" class).
  const artistEdges: ArtistEdge[] = useMemo(() => {
    const groups = new Map<string, LeafRenderCircle[]>();
    for (const c of leafCircles) {
      const group = groups.get(c.id) ?? [];
      group.push(c);
      groups.set(c.id, group);
    }

    return [...groups.entries()]
      .filter(([, group]) => group.length > 1)
      .flatMap(([id, group]) => {
        const cx = group.reduce((sum, c) => sum + c.x, 0) / group.length;
        const cy = group.reduce((sum, c) => sum + c.y, 0) / group.length;
        return group.map((c) => ({
          key: `edge-${c.key}`,
          id,
          x1: c.x,
          y1: c.y,
          x2: cx,
          y2: cy,
        }));
      });
  }, [leafCircles]);

  // the dots of the selected artists (more than one when an artist is in several schools)
  const selectedDots = useMemo(
    () =>
      leafCircles
        .filter((c) => selectedIds.has(c.id))
        .map((c) => ({ key: c.key, id: c.id, name: c.name, life: c.life })),
    [leafCircles, selectedIds],
  );

  return (
    <div className="overview-vis-cnt" ref={visContainerRef}>
      <svg
        className="overview-vis"
        ref={svgRef}
        viewBox={`0 0 ${VIS_VIEWBOX_WIDTH} ${VIS_VIEWBOX_HEIGHT}`}
      >
        <g transform={transform}>
          {groupCircles.map((c) => {
            const color = areaColor(nationByKey.get(c.key) ?? "unknown");
            return (
              <circle
                key={c.key}
                ref={(el) => {
                  if (el) groupCircleRefs.current.set(c.key, el);
                  else groupCircleRefs.current.delete(c.key);
                }}
                className="context-bubble"
                cx={c.x}
                cy={c.y}
                r={c.r}
                fill={color}
                fillOpacity={0.1}
                stroke={"var(--color-text)"}
                strokeOpacity={0.6}
                strokeWidth={1}
                onMouseEnter={() => setHoveredGroupKey(c.key)}
                onMouseLeave={() =>
                  setHoveredGroupKey((k) => (k === c.key ? null : k))
                }
              />
            );
          })}

          <g className="author-dots-group" ref={registerDotsContainer}>
            {artistEdges.map((edge) => (
              <line
                key={edge.key}
                data-artist-id={edge.id}
                className={
                  "artist-edge" + (selectedIds.has(edge.id) ? " selected" : "")
                }
                x1={edge.x1}
                y1={edge.y1}
                x2={edge.x2}
                y2={edge.y2}
                stroke="var(--color-text-muted)"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            ))}

            {leafCircles.map((c) => {
              const isSelected = selectedIds.has(c.id);
              const isCoOccurring = !isSelected && highlightedIds.has(c.id);
              const isDimmedBySelection =
                selectedIds.size > 0 && !highlightedIds.has(c.id);

              // Only the small co-occurring subset needs the actual ratio/color
              let fill = "var(--color-text)";
              if (isCoOccurring) {
                let ratio = 0;
                for (const selectedId of selectedIds) {
                  const connection =
                    coOccurrences[selectedId]?.co_authors?.[c.id];
                  if (connection) {
                    // by now it considers only the first selected author
                    ratio =
                      connection.co_author_counts.accepted /
                      connection.co_author_counts.total;
                    break;
                  }
                }
                fill = getCoOccurrenceColor(ratio);
              }

              return (
                <circle
                  key={c.key}
                  data-artist-id={c.id}
                  data-dot-key={c.key}
                  className={
                    "author-dot" +
                    (isSelected ? " selected" : "") +
                    (isDimmedBySelection ? " dimmed-by-selection" : "") +
                    (isArtistFilteredOut(c.centuryBucket)
                      ? " filtered-out"
                      : "")
                  }
                  cx={c.x}
                  cy={c.y}
                  r={c.r}
                  fill={fill}
                  onClick={(e) => {
                    toggle(c.id);
                    // a selected artist has its own tooltip that stays on (see
                    // SelectedArtistLabels), so the hover one steps aside, and comes
                    // back when the artist is deselected under the pointer
                    if (isSelected)
                      showHoverTooltip(c.name, c.life, e.currentTarget);
                    else hideArtistTooltip();
                  }}
                  onMouseEnter={(e) => {
                    highlightDot(c.id);
                    if (c.groupKey) setHoveredGroupKey(c.groupKey);
                    if (!isSelected)
                      showHoverTooltip(c.name, c.life, e.currentTarget);
                  }}
                  onMouseLeave={() => {
                    highlightDot(null);
                    setHoveredGroupKey((k) => (k === c.groupKey ? null : k));
                    hideArtistTooltip();
                  }}
                />
              );
            })}
          </g>

          <Annotations circles={groupCircles} hidden={isZoomedIn} />
        </g>
      </svg>

      <ZoomControls
        svgRef={svgRef}
        zoomRef={zoomRef}
        hint="Zoom and pan to explore the visualisation. Click an artist to select it and see how the visualisation and the lists change."
        showHint={!isZoomedIn}
      />

      <ArtistTooltip />

      <SelectedArtistLabels
        dots={selectedDots}
        transform={transform}
        containerRef={visContainerRef}
      />

      {hoveredGroupKey && (
        <AreaTooltip
          label={labelByKey.get(hoveredGroupKey) ?? ""}
          stats={statsByKey.get(hoveredGroupKey)}
          tooltipRef={areaTooltipRef}
        />
      )}
    </div>
  );
}
