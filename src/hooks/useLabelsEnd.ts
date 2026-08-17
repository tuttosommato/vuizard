import { useState, useRef, useMemo, useLayoutEffect } from "react";
import { labelEndPoint } from "@/components/work/attributions/debateVis/geometry";
import type { Attribution } from "@/types/attributions";

const useLabelsEnd = (attributions: Attribution[], rotations: number[]) => {
  const [labelsGeometry, setLabelsGeometry] = useState<
    Record<string, { textWidth: number }>
  >({});

  const labelsEnd = useMemo(() => {
    const result: Record<string, { x: number; y: number }> = {};
    attributions.forEach((d, i) => {
      const g = labelsGeometry[d.attribution_id];
      if (!g) return;
      result[d.attribution_id] = labelEndPoint(rotations[i], g.textWidth);
    });
    return result;
  }, [labelsGeometry, rotations, attributions]);

  const labelsRef = useRef<Map<string, SVGTextElement>>(new Map());

  useLayoutEffect(() => {
    const next: Record<string, { textWidth: number }> = {};
    for (const [id, el] of labelsRef.current.entries()) {
      next[id] = { textWidth: el.getBBox().width };
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLabelsGeometry(next);
  }, [attributions]);

  return { labelsRef, labelsEnd, labelsGeometry };;
};

export default useLabelsEnd;
