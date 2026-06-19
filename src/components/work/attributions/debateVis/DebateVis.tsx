import type { AttributionsBundle } from "@/types/attributions";
import BackgroundArcs from "@/components/work/attributions/debateVis/BackgroundArcs";
import AttributionsGroup from "@/components/work/attributions/debateVis/AttributionsGroup";
import { slotRotationDeg } from "./geometry";
import useAuthors from "@/hooks/useAuthors";
import useLabelsEnd from "@/hooks/useLabelsEnd";
import { useMemo } from "react";
import { VIEW_W, VIEW_H, center, outerX } from "./constants";

type LinkSpec = {
  a: string;
  b: string;
  stroke: string;
  strokeWidth: number;
  className: string;
};

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

  const authors = useAuthors(attributions);

  // derived geometry
  const rotations = attributions.map((_, i) =>
    slotRotationDeg(i, attributions.length),
  );

  const { labelsRef, labelsEnd } = useLabelsEnd(attributions, rotations);

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
        strokeWidth: l.npmi > 0.34 ? l.npmi * 5 : 0,
        className: "similarity author-connection",
      })),
      ...implicit_relations.map(([a, b]) => ({
        a,
        b,
        stroke: "red",
        strokeWidth: 1,
        className: "same-author author-connection",
      })),
      ...master_relations.map(([a, b]) => ({
        a,
        b,
        stroke: "yellow",
        strokeWidth: 1,
        className: "master-relations author-connection",
      })),
    ],
    [author_similarities, implicit_relations, master_relations],
  );

  return (
    <div className="debate-vis-cnt">
      {/* Avoid rendering if width is not available yet */}
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="xMidYMid meet"
        width="100%"
        height="100%"
      >
        <BackgroundArcs />

        {attributions.map((attr, i) => (
          <AttributionsGroup
            key={attr.operational_id}
            attr={attr}
            rotation={rotations[i]}
            labelsRef={labelsRef}
            authors={authors}
          />
        ))}

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
                opacity={0.2}
                vectorEffect="non-scaling-stroke"
              />
            )
          );
        })}
      </svg>
    </div>
  );
}
