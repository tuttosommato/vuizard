import type { Attribution } from "@/types/attributions";
import { labelsFontSize } from "@/components/work/attributions/debateVis/constants";
import { rankScale, curveGap } from "@/components/work/attributions/debateVis/constants";

// Visual half-height for most sans-serif fonts at labelsFontSize, used to vertically center label text against the line it sits on in the vis
const offsetAmplitude = labelsFontSize * 0.35;

export function verticalCenterOffset(rotDeg: number) {
  return offsetAmplitude * Math.sin((rotDeg * Math.PI) / 180);
}

export function labelEndPoint(rotDeg: number, textWidth: number) {
  const rotRad = (rotDeg * Math.PI) / 180;
  return {
    x: rankScale(-0.2) * Math.cos(rotRad) + textWidth + curveGap,
    y: rankScale(-0.2) * Math.sin(rotRad) + verticalCenterOffset(rotDeg),
  };
}

// Divides the semicircle (180deg) evenly across 'total' slots and returns the rotation dor the slot at index 'slot'
export function slotRotationDeg(slot: number, total: number) {
  return 90 - (180 * (total - slot)) / (total + 1);
}
// In SVG a semicircle spans from -90deg (top) to 90deg (bottom) so that we have a 180deg range centered on 0deg
// We walk up from the bottom by (total - slot) slot-widths
// the formula should output a value in the range [-90deg, 90deg], that's why it begins with 90 -

export function standardOrdering(attributions: Attribution[]): Attribution[] {
  return attributions;
}

export function authoritativenessOrdering(attributions: Attribution[]): Attribution[] {
    return attributions
    .map((d, originalIndex) => ({
      d,
      originalIndex,
      maxRank: Math.max(...d.reasons.map((r) => r.rank)),
      numReasons: d.reasons.length
    }))
    .sort(
      (a, b) =>
        b.maxRank - a.maxRank || // higher authoritativeness
        b.numReasons - a.numReasons || // more reasons
        a.originalIndex - b.originalIndex // standard order
    )
    .map((x) => x.d);
}