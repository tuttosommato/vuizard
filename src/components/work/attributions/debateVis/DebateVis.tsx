import type { AttributionsBundle } from "@/types/attributions";
import BackgroundArcs from "@/components/work/attributions/debateVis/BackgroundArcs";
import AttributionsGroup from "@/components/work/attributions/debateVis/AttributionsGroup";
import { authoritativenessOrdering, slotRotationDeg, standardOrdering } from "./geometry";
import useLabelsEnd from "@/hooks/useLabelsEnd";
import { useMemo, useState } from "react";
import { useHighlight } from "@/stores/HighlightContext";
import { VIEW_W, VIEW_H, center, outerX } from "./constants";
import VisLegend from "./VisLegend";
import AxisLegend from "./AxisLegend";
import ArrowMarkerDef from "@/components/ArrowMarkerDef";
import { attributionIdsByCompositeId } from "@/components/work/attributions/utils";

// a drawable connection line between two attributions
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
    author_similarities, // author-to-author similarity scores (npmi), keyed by composite_id
    implicit_relations, // [composite_id, composite_id][] — same-artist link (directly involved in the connected attributions)
    master_relations, // [composite_id, composite_id][] — same-artist link between the artist itself and one anonymous related to the artist
  } = currentAttributions;


  const [activeOrdering, setActiveOrdering] = useState<"standard" | "authoritativeness">("standard");
  const orderedAttributions = useMemo(() => {
    if(activeOrdering === "standard") return standardOrdering(attributions);
    if(activeOrdering === "authoritativeness") return authoritativenessOrdering(attributions);
    return attributions;
  }, [activeOrdering, attributions]);



  // composite_id -> every attribution_id that has an author with that composite_id.
  // computed once, from the full (unreordered) attribution list
  const attributionIdsForComposite = useMemo(
    () => attributionIdsByCompositeId(attributions),
    [attributions],
  );

  const highlightedId = useHighlight().highlightedId;

  const highlightMembers = useMemo(() => {
    if (!highlightedId) return null;
    const cluster = new Set<string>();

    const addRelated = (compositeA: string, compositeB: string) => {
      const aIds = attributionIdsForComposite[compositeA] ?? [];
      const bIds = attributionIdsForComposite[compositeB] ?? [];
      // if the hovered attribution is one of compositeA's attributions,
      // every attribution belonging to compositeB is "related" (and vice versa).
      if (aIds.includes(highlightedId)) bIds.forEach((id) => cluster.add(id));
      if (bIds.includes(highlightedId)) aIds.forEach((id) => cluster.add(id));
    };

    author_similarities.forEach((s) => {
      if (s.npmi > similarity_threshold) addRelated(s.a, s.b);
    });
    implicit_relations.forEach(([a, b]) => addRelated(a, b));
    master_relations.forEach(([a, b]) => addRelated(a, b));
    return cluster;
  }, [
    highlightedId,
    author_similarities,
    implicit_relations,
    master_relations,
    attributionIdsForComposite,
  ]);

  const clusterMembers = useMemo(() => {
    if (!highlightedId) return null;
    const cluster = new Set<string>();
    cluster.add(highlightedId);

    const addRelated = (compositeA: string, compositeB: string) => {
      const aIds = attributionIdsForComposite[compositeA] ?? [];
      const bIds = attributionIdsForComposite[compositeB] ?? [];
      if (aIds.includes(highlightedId)) bIds.forEach((id) => cluster.add(id));
      if (bIds.includes(highlightedId)) aIds.forEach((id) => cluster.add(id));
    };

    implicit_relations.forEach(([a, b]) => addRelated(a, b));
    master_relations.forEach(([a, b]) => addRelated(a, b));

    return cluster;
  }, [
    highlightedId,
    implicit_relations,
    master_relations,
    attributionIdsForComposite,
  ]);

  const highlightedAttributions = useMemo(() => {
    if (!highlightedId) return orderedAttributions;
    const anchorIdx = orderedAttributions.findIndex(
      (a) => a.attribution_id === highlightedId,
    );
    const above = orderedAttributions.slice(0, anchorIdx);
    const below = orderedAttributions.slice(anchorIdx + 1);
    return [
      ...above.filter((a) => !clusterMembers?.has(a.attribution_id)),
      ...above.filter((a) => clusterMembers?.has(a.attribution_id)),
      orderedAttributions[anchorIdx],
      ...below.filter((a) => clusterMembers?.has(a.attribution_id)),
      ...below.filter((a) => !clusterMembers?.has(a.attribution_id)),
    ];
  }, [orderedAttributions, highlightedId, clusterMembers]);

  // derived geometry
  const rotations = highlightedAttributions.map((_, i) =>
    slotRotationDeg(i, highlightedAttributions.length),
  );

  const { labelsRef, labelsEnd } = useLabelsEnd(highlightedAttributions, rotations);

  // render-only helpers
  const curvePath = (idA: string, idB: string): string | null => {
    const a = labelsEnd[idA];
    const b = labelsEnd[idB];
    if (!a || !b) return null;
    return `M ${a.x},${a.y} C ${outerX},${a.y} ${outerX},${b.y} ${b.x},${b.y}`;
  };

  const linkSpecs: LinkSpec[] = useMemo(() => {
    const specs: LinkSpec[] = [];

    const expand = (
      compositeA: string,
      compositeB: string,
      stroke: string,
      strokeWidth: number,
      className: string,
    ) => {
      const aIds = attributionIdsForComposite[compositeA] ?? [];
      const bIds = attributionIdsForComposite[compositeB] ?? [];
      aIds.forEach((a) =>
        bIds.forEach((b) =>
          specs.push({ a, b, stroke, strokeWidth, className }),
        ),
      );
    };

    author_similarities.forEach((l) => {
      if (l.npmi > similarity_threshold) {
        expand(
          l.a,
          l.b,
          "var(--color-text)",
          l.npmi * 5,
          "similarity artist-connection",
        );
      }
    });
    implicit_relations.forEach(([a, b]) =>
      expand(a, b, "var(--color-link-1)", 1, "same-artist artist-connection"),
    );
    master_relations.forEach(([a, b]) =>
      expand(
        a,
        b,
        "var(--color-link-2)",
        1,
        "master-relations artist-connection",
      ),
    );

    return specs;
  }, [
    author_similarities,
    implicit_relations,
    master_relations,
    attributionIdsForComposite,
  ]);

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

        {highlightedAttributions.map((attr, i) => {
          const attrLength = highlightedAttributions.length;
          return (
            <AttributionsGroup
              key={attr.attribution_id}
              attr={attr}
              rotation={rotations[i]}
              labelsRef={labelsRef}
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
      <div>
        <button onClick={() => setActiveOrdering("standard")}>standard</button><button onClick={() => setActiveOrdering("authoritativeness")}>authoritativeness</button>
      </div>
    </div>
  );
}
