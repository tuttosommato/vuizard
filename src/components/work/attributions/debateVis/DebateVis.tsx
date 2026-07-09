import type { AttributionsBundle } from "@/types/attributions";
import BackgroundArcs from "@/components/work/attributions/debateVis/BackgroundArcs";
import AttributionsGroup from "@/components/work/attributions/debateVis/AttributionsGroup";
import { slotRotationDeg } from "./geometry";
import useArtists from "@/hooks/useArtists";
import useLabelsEnd from "@/hooks/useLabelsEnd";
import { useMemo } from "react";
import { useHighlight } from "@/stores/HighlightContext";
import { VIEW_W, VIEW_H, center, outerX } from "./constants";
import VisLegend from "./VisLegend";
import AxisLegend from "./AxisLegend";
import ArrowMarkerDef from "@/components/ArrowMarkerDef";

type LinkSpec = {
  a: string;
  b: string;
  stroke: string;
  strokeWidth: number;
  className: string;
};

const similarity_threshold = 0.35; // minimum npmi for a similarity link to be drawn

export default function DebateVis({
  currentAttributions,
}: {
  currentAttributions: AttributionsBundle;
}) {
  // data and fetching
  const {
    attributions,
    author_similarities,
    implicit_relations,
    master_relations,
  } = currentAttributions;

  const artists = useArtists(attributions);

  const highlightedId = useHighlight().highlightedId;

  const highlightMembers = useMemo(() => {
    if (!highlightedId) return null;
    const cluster = new Set<string>();
    author_similarities.forEach((s) => {
      if (s.npmi > similarity_threshold) {
        if (s.a === highlightedId) cluster.add(s.b);
        if (s.b === highlightedId) cluster.add(s.a);
      }
    });
    implicit_relations.forEach(([a, b]) => {
      if (a === highlightedId) cluster.add(b);
      if (b === highlightedId) cluster.add(a);
    });
    master_relations.forEach(([a, b]) => {
      if (a === highlightedId) cluster.add(b);
      if (b === highlightedId) cluster.add(a);
    });
    return cluster;
  }, [
    highlightedId,
    author_similarities,
    implicit_relations,
    master_relations,
  ]);

  const clusterMembers = useMemo(() => {
    if (!highlightedId) return null;
    const cluster = new Set<string>();
    cluster.add(highlightedId);
    implicit_relations.forEach(([a, b]) => {
      if (a === highlightedId) cluster.add(b);
      if (b === highlightedId) cluster.add(a);
    });
    master_relations.forEach(([a, b]) => {
      if (a === highlightedId) cluster.add(b);
      if (b === highlightedId) cluster.add(a);
    });
    return cluster;
  }, [highlightedId, implicit_relations, master_relations]);

  const highlightedAttributions = useMemo(() => {
    if (!highlightedId) return attributions;
    const anchorIdx = attributions.findIndex(
      (a) => a.operational_id === highlightedId,
    );
    const above = attributions.slice(0, anchorIdx);
    const below = attributions.slice(anchorIdx + 1);
    return [
      ...above.filter((a) => !clusterMembers?.has(a.operational_id)),
      ...above.filter((a) => clusterMembers?.has(a.operational_id)),
      attributions[anchorIdx],
      ...below.filter((a) => clusterMembers?.has(a.operational_id)),
      ...below.filter((a) => !clusterMembers?.has(a.operational_id)),
    ];
  }, [attributions, highlightedId, clusterMembers]);

  const displayAttributions = highlightedAttributions ?? attributions;

  /* const rotationMap = useMemo(() => {
    const order = highlightedAttributions ?? attributions;

    return new Map(
        order.map((a, i) => [
            a.operational_id,
            slotRotationDeg(i, order.length)
        ])
    );
}, [highlightedAttributions, attributions]); */

  // derived geometry
  const rotations = displayAttributions.map((_, i) =>
    slotRotationDeg(i, displayAttributions.length),
  );

  const { labelsRef, labelsEnd } = useLabelsEnd(displayAttributions, rotations);

  // render-only helpers
  const curvePath = (idA: string, idB: string): string | null => {
    const a = labelsEnd[idA];
    const b = labelsEnd[idB];
    if (!a || !b) return null;
    return `M ${a.x},${a.y} C ${outerX},${a.y} ${outerX},${b.y} ${b.x},${b.y}`;
  };

  // links normalisation into readable form
  const linkSpecs: LinkSpec[] = useMemo(
    () => [
      ...author_similarities.map((l) => ({
        a: l.a,
        b: l.b,
        stroke: "var(--color-text)",
        strokeWidth: l.npmi > similarity_threshold ? l.npmi * 5 : 0,
        className: "similarity artist-connection",
      })),
      ...implicit_relations.map(([a, b]) => ({
        a,
        b,
        stroke: "var(--color-link-1)",
        strokeWidth: 1,
        className: "same-artist artist-connection",
      })),
      ...master_relations.map(([a, b]) => ({
        a,
        b,
        stroke: "var(--color-link-2)",
        strokeWidth: 1,
        className: "master-relations artist-connection",
      })),
    ],
    [author_similarities, implicit_relations, master_relations],
  );

  return (
    <div className="debate-vis-cnt">
      <VisLegend />
      {/* Avoid rendering if width is not available yet */}
      <svg
        className="debate-vis"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <BackgroundArcs />

        {displayAttributions.map((attr, i) => {
          const attrLength = displayAttributions.length;
          return (
            <AttributionsGroup
              key={attr.operational_id}
              attr={attr}
              rotation={rotations[i]}
              labelsRef={labelsRef}
              artists={artists}
              highlightMembers={highlightMembers}
              tooltipPosition={i + 1 <= attrLength / 2 ? "bottom" : "top"}
            />
          );
        })}

        {linkSpecs.map((s) => {
          const d = curvePath(s.a, s.b);
          return (
            d && (
              <path
                key={`${s.className}-${s.a}-${s.b}`}
                className={s.className}
                transform={center}
                d={d}
                stroke={s.stroke}
                strokeWidth={s.strokeWidth}
                fill="none"
                opacity={
                  s.a === highlightedId || s.b === highlightedId ? 1 : 0.3
                }
                vectorEffect="non-scaling-stroke"
              />
            )
          );
        })}

        <ArrowMarkerDef />
        <AxisLegend />
      </svg>
    </div>
  );
}
