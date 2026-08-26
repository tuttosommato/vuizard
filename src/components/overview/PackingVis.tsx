import type { Artist } from "@/types/artists";
import type { AuthorsCoBundle } from "@/types/coOccurrences";
import { useMemo, useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { hierarchy, pack, scaleOrdinal, schemeTableau10 } from "d3";
import type { HierarchyCircularNode } from "d3";
import { zoom } from "d3-zoom";
import type { ZoomBehavior } from "d3-zoom";
import { select } from "d3-selection";
import {
  VIS_VIEWBOX_WIDTH,
  VIS_VIEWBOX_HEIGHT,
  VIS_MIN_ZOOM,
  VIS_MAX_ZOOM,
} from "@/utils/constants.ts";
import { useOverviewFilter } from "@/stores/OverviewFilterContext";

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
type LeafRenderCircle = RenderCircle & { groupKey: string | null, centuryBucket: number | null };

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

// Same tooltip styling used elsewhere in the app (see .reason-tooltip in
// work.css, used by DebateVis's AttributionsGroup) — a fixed-position
// portal placed from the hovered element's own bounding rect, so it
// tracks correctly even inside the vis's zoom/pan transform.
function AreaTooltip({
  label,
  coords,
}: {
  label: string;
  coords: { x: number; y: number } | null;
}) {
  if (!coords) return null;
  return createPortal(
    <div
      className="reason-tooltip"
      style={{
        position: "fixed",
        left: coords.x,
        top: coords.y,
        transform: `translate(-50%, calc(-100% - ${TOOLTIP_GAP}px))`,
      }}
    >
      <p>{label}</p>
    </div>,
    document.body,
  );
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
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [transform, setTransform] = useState("translate(0, 0) scale(1)");

  const groupCircleRefs = useRef<Map<string, SVGCircleElement>>(new Map());
  const [hoveredGroupKey, setHoveredGroupKey] = useState<string | null>(null);
  const [hoveredGroupCoords, setHoveredGroupCoords] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // When hoveredGroupKey changes, update hoveredGroupCoords to the center of the
  // corresponding group circle's bounding rect, or null if not found.
  useEffect(() => {
    if (!hoveredGroupKey) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHoveredGroupCoords(null);
      return;
    }
    const el = groupCircleRefs.current.get(hoveredGroupKey);
    if (!el) {
      setHoveredGroupCoords(null);
      return;
    }
    const rect = el.getBoundingClientRect();
    setHoveredGroupCoords({ x: rect.left + rect.width / 2, y: rect.top });
  }, [hoveredGroupKey]);

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
      });
    
    zoomRef.current = z;
    select(currentSvg).call(z);

    return () => {
      select(currentSvg).on(".zoom", null);
    };
  }, [])

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
    return scaleOrdinal<string>().domain([...nations]).range(schemeTableau10);
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
  const { groupCircles, leafCircles, nationByKey, labelByKey } = useMemo(() => {
    const groupCircles: RenderCircle[] = [];
    const leafCircles: LeafRenderCircle[] = [];
    const nationByKey = new Map<string, string>();
    const labelByKey = new Map<string, string>();
    for (const node of packedRoot.descendants()) {
      if (node.depth === 0) continue;
      const key = pathKey(node);
      if (node.data.type === "group") {
        groupCircles.push({ key, x: node.x, y: node.y, r: node.r });
        nationByKey.set(key, nationOf(node));
        labelByKey.set(key, node.data.name);
      } else {
        // hovering an author dot shows the tooltip for
        // whichever bubble directly contains it 
        const parentKey = node.parent ? pathKey(node.parent) : null;
        const centuryBucket = artists[node.data.id].cultural_context_info.century_bucket ?? null;
        leafCircles.push({ key, x: node.x, y: node.y, r: node.r, groupKey: parentKey, centuryBucket });
      }
    }
    return { groupCircles, leafCircles, nationByKey, labelByKey };
  }, [packedRoot, artists]);

  return (
    <div className="overview-vis-cnt">
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

          {leafCircles.map((c) => (
            <circle
              key={c.key}
              className={`author-dot${isArtistFilteredOut(c.centuryBucket ?? 0) ? " filtered-out" : ""}`}
              cx={c.x}
              cy={c.y}
              r={c.r}
              fill="var(--color-text)"
              onMouseEnter={() => c.groupKey && setHoveredGroupKey(c.groupKey)}
              onMouseLeave={() =>
                setHoveredGroupKey((k) => (k === c.groupKey ? null : k))
              }
            />
          ))}
        </g>
      </svg>

      {hoveredGroupKey && (
        <AreaTooltip
          label={labelByKey.get(hoveredGroupKey) ?? ""}
          coords={hoveredGroupCoords}
        />
      )}
    </div>
  );
}