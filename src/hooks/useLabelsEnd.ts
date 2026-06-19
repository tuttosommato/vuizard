import { useState, useRef, useMemo, useLayoutEffect } from "react";
import {
  curveGap,
  rankScale,
} from "@/components/work/attributions/debateVis/constants";
import { verticalCenterOffset } from "@/components/work/attributions/debateVis/geometry";
import type { Attribution } from "@/types/attributions";

const useLabelsEnd = (attributions: Attribution[], rotations: number[]) => {
  const [labelsGeometry, setLabelsGeometry] = useState<
    Record<string, { textWidth: number }>
  >({});

  const labelsEnd = useMemo(() => {
    const result: Record<string, { x: number; y: number }> = {};
    attributions.forEach((d, i) => {
      const g = labelsGeometry[d.operational_id];
      if (!g) return;
      const rotDeg = rotations[i];
      const rotRad = (rotDeg * Math.PI) / 180;
      result[d.operational_id] = {
        x: rankScale(-0.2) * Math.cos(rotRad) + g.textWidth + curveGap,
        y: rankScale(-0.2) * Math.sin(rotRad) + verticalCenterOffset(rotDeg),
      };
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

  return { labelsRef, labelsEnd };
};

export default useLabelsEnd;
