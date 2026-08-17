import type { AttributionsBundle } from "@/types/attributions";
import BackgroundArcs from "@/components/work/attributions/debateVis/BackgroundArcs";
import AttributionsGroup from "@/components/work/attributions/debateVis/AttributionsGroup";
import {
  authoritativenessOrdering,
  labelEndPoint,
  slotRotationDeg,
  standardOrdering,
} from "@/components/work/attributions/debateVis/geometry";
import useLabelsEnd from "@/hooks/useLabelsEnd";
import { useEffect, useMemo, useRef, useState } from "react";
import { useHighlight } from "@/stores/HighlightContext";
import {
  VIEW_W,
  VIEW_H,
  center,
  outerX,
} from "@/components/work/attributions/debateVis/constants";
import VisLegend from "@/components/work/attributions/debateVis/VisLegend";
import AxisLegend from "@/components/work/attributions/debateVis/AxisLegend";
import ArrowMarkerDef from "@/components/ArrowMarkerDef";
import { attributionIdsByCompositeId } from "@/components/work/attributions/utils";
import Switch from "@/components/work/Switch";

// a drawable connection line between two attributions
type LinkSpec = {
  a: string;
  b: string;
  stroke: string;
  strokeWidth: number;
  className: string;
};

const similarity_threshold = 0.35; // minimum npmi for a similarity link to be drawn
const ROTATION_DURATION_MS = 400;

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

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

  // Base ordering
  const [activeOrdering, setActiveOrdering] = useState<"standard" | "authoritativeness">("standard");

  const orderedAttributions = useMemo(() => {
    if (activeOrdering === "standard") return standardOrdering(attributions);
    if (activeOrdering === "authoritativeness")
      return authoritativenessOrdering(attributions);
    return attributions;
  }, [activeOrdering, attributions]);

  // composite_id -> every attribution_id that has an author with that composite_id
  const attributionIdsForComposite = useMemo(
    () => attributionIdsByCompositeId(attributions),
    [attributions],
  );

  //
  // hover-driven highlighting and clustering
  //
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

  // reorders the base ordering around the hovered attribution
  // cluster members get pulled adjacent to it while everything else pushed further away
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

  //
  // Geometry: target angle/slot per attribution, keyed by id (never by array position — the render loop below stays in a stable order, so
  // "target" here means "wherever this attribution SHOULD end up", independent of where it currently is.)
  //
  const rotations = useMemo(
    () =>
      highlightedAttributions.map((_, i) =>
        slotRotationDeg(i, highlightedAttributions.length),
      ),
    [highlightedAttributions],
  );

  const targetRotationByAttributionId = useMemo(() => {
    const map = new Map<string, number>();
    highlightedAttributions.forEach((attr, i) => {
      map.set(attr.attribution_id, rotations[i]);
    });
    return map;
  }, [highlightedAttributions, rotations]);

  const slotIndexByAttributionId = useMemo(() => {
    const map = new Map<string, number>();
    highlightedAttributions.forEach((attr, i) => {
      map.set(attr.attribution_id, i);
    });
    return map;
  }, [highlightedAttributions]);

  const { labelsRef, labelsGeometry } = useLabelsEnd(
    highlightedAttributions,
    rotations,
  );

  // 
  // Connection curves (author_similarities / implicit_relations / master_relations)
  // Expanded from author-level (composite_id) relations into one LinkSpec per attribution-pair combination,
  // since the same author can appear in multiple attributions for this work
  //
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

  // 
  // Animation: tween rotations from wherever they currently are to their targets, via requestAnimationFrame, driven into React state so both the
  // attribution groups and the connection curves re-render from the same live interpolated values every frame
  //
  const [interpolatedRotations, setInterpolatedRotations] = useState<Map<string, number>>(new Map());
  const currentRotationsRef = useRef(new Map<string, number>());
  const rafId = useRef<number | null>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // First run: nothing to animate from yet — snap straight to target.
    if (!hasInitialized.current) {
      const initial = new Map(targetRotationByAttributionId);
      currentRotationsRef.current = initial;
      setInterpolatedRotations(initial);
      hasInitialized.current = true;
      return;
    }

    // Interrupt any in-flight animation — the new tween starts from wherever things currently are, never from the old target.
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }

    const startRotations = new Map(currentRotationsRef.current);
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / ROTATION_DURATION_MS, 1);
      const eased = easeInOutCubic(t);

      const next = new Map<string, number>();
      targetRotationByAttributionId.forEach((target, id) => {
        const start = startRotations.get(id) ?? target;
        next.set(id, start + (target - start) * eased);
      });

      currentRotationsRef.current = next;
      setInterpolatedRotations(next);

      if (t < 1) {
        rafId.current = requestAnimationFrame(tick);
      } else {
        rafId.current = null;
      }
    };

    rafId.current = requestAnimationFrame(tick);

    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    };
  }, [targetRotationByAttributionId]);

  //
  // render-only helpers
  //
  const curvePath = (idA: string, idB: string): string | null => {
    const rotA = interpolatedRotations.get(idA);
    const rotB = interpolatedRotations.get(idB);
    const widthA = labelsGeometry[idA]?.textWidth;
    const widthB = labelsGeometry[idB]?.textWidth;
    if (
      rotA === undefined ||
      rotB === undefined ||
      widthA === undefined ||
      widthB === undefined
    )
      return null;
    const a = labelEndPoint(rotA, widthA);
    const b = labelEndPoint(rotB, widthB);
    return `M ${a.x},${a.y} C ${outerX},${a.y} ${outerX},${b.y} ${b.x},${b.y}`;
  };

  //
  // render return
  //
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

        {/* rendered in a STABLE order (attributions, never reordered) so React
            never has to move these DOM nodes around, only their rotation prop
            changes, which is what makes the animation reliable */}
        {attributions.map((attr) => {
          const slotIndex =
            slotIndexByAttributionId.get(attr.attribution_id) ?? 0;
          const total = highlightedAttributions.length;
          return (
            <AttributionsGroup
              key={attr.attribution_id}
              attr={attr}
              rotation={
                interpolatedRotations.get(attr.attribution_id) ??
                targetRotationByAttributionId.get(attr.attribution_id) ??
                0
              }
              labelsRef={labelsRef}
              highlightMembers={highlightMembers}
              tooltipPosition={slotIndex + 1 <= total / 2 ? "bottom" : "top"}
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
      <div className="debate-vis-ordering-switch">
        <Switch
          currentState={activeOrdering}
          setNewState={setActiveOrdering}
          options={[
            { value: "standard", label: "Catalogue order" },
            { value: "authoritativeness", label: "By reason reliability" },
          ]}
        />
      </div>
    </div>
  );
}
