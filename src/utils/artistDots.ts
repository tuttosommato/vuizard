import type { WorkItem } from "@/types/works";
import { representativeAuthor } from "@/components/work/attributions/utils";
import {
  TIER_RADII,
  TIER_I,
  VIS_NUCLEUS_RADIUS,
  VIS_HALF_PLANE_GAP,
  VIS_NUCLEUS_DOT_PADDING,
  VIS_NUCLEUS_FILL,
  VIS_DOT_MULTIPLIER_BASE,
  VIS_DOT_MULTIPLIER_MIN,
} from "@/utils/constants.ts";

// One entry per attribution naming `artistId`, i.e. one dot in the artist vis.
// Shared by the layout (ArtistVis) and the size fitting below so both classify
// dots the same way. tierRadius 0 means the nucleus.
export function getArtistDotSpecs(works: WorkItem[], artistId: string) {
  return works.flatMap((work) => {
    const attributions = work.attributions?.attributions ?? [];
    const nAttributions = attributions.length;
    return attributions
      .filter((attr) => attr.authors.map((a) => a.local_id).includes(artistId))
      .map((attr) => {
        const relation = representativeAuthor(attr).r_qualifier;
        return {
          work,
          attr,
          nAttributions,
          isDocumented: attr.reasons.some((reason) => reason.rank === 11),
          tierRadius: TIER_RADII[relation] ?? TIER_I,
        };
      });
  });
}

export type ArtistDotSpec = ReturnType<typeof getArtistDotSpecs>[number];

// Largest multiplier (dot radius = sqrt(nAttributions) * multiplier), capped at the
// standard size, for which the nucleus dots still fit in the nucleus.
//
// Only the lower half-disc is checked: documented dots go above the dividing line,
// everything else below, and the upper half is rarely populated. The padded dots
// (radius + padding) may cover VIS_NUCLEUS_FILL of the usable half-disc, which gives
//   sum pi * (sqrt(n) * m + p)^2 = fill * area
// a quadratic in m, solved in closed form: no simulation needed.
export function fitNucleusMultiplier(specs: ArtistDotSpec[]): number {
  const ns = specs
    .filter((d) => d.tierRadius === 0 && !d.isDocumented)
    .map((d) => d.nAttributions);
  if (ns.length === 0) return VIS_DOT_MULTIPLIER_BASE;

  const R = VIS_NUCLEUS_RADIUS - 2; // keep dots off the stroke
  // half-disc minus the strip kept clear next to the dividing line
  const halfArea = (Math.PI * R * R) / 2 - VIS_HALF_PLANE_GAP * 2 * R;
  const p = VIS_NUCLEUS_DOT_PADDING;
  const s1 = ns.reduce((sum, n) => sum + Math.sqrt(n), 0);
  const s2 = ns.reduce((sum, n) => sum + n, 0);
  const c = ns.length * p * p - (VIS_NUCLEUS_FILL * halfArea) / Math.PI;
  // negative only when the padding alone can't fit: clamp, the floor below applies
  const discriminant = Math.max(0, p * p * s1 * s1 - s2 * c);
  const fit = (-p * s1 + Math.sqrt(discriminant)) / s2;

  return Math.min(
    VIS_DOT_MULTIPLIER_BASE,
    Math.max(VIS_DOT_MULTIPLIER_MIN, fit),
  );
}
