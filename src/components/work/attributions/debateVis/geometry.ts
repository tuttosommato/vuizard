import { labelsFontSize } from "./constants";

// Visual half-height for most sans-serif fonts at labelsFontSize, used to vertically center label text against the line it sits on in the vis
const offsetAmplitude = labelsFontSize * 0.35;

export function verticalCenterOffset(rotDeg: number) {
  return offsetAmplitude * Math.sin((rotDeg * Math.PI) / 180);
}

// Divides the semicircle (180deg) evenly across 'total' slots and returns the rotation dor the slot at index 'slot'
export function slotRotationDeg(slot: number, total: number) {
  return 90 - (180 * (total - slot)) / (total + 1);
}
// In SVG a semicircle spans from -90deg (top) to 90deg (bottom) so that we have a 180deg range centered on 0deg
// We walk up from the bottom by (total - slot) slot-widths
// the formula should output a value in the range [-90deg, 90deg], that's why it begins with 90 -
