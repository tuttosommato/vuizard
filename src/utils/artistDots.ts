import type { WorkItem } from "@/types/works";
import { representativeAuthor } from "@/components/work/attributions/utils";
import {
  TIER_RADII,
  TIER_I,
  VIS_NUCLEUS_RADIUS,
  VIS_ANON_NUCLEUS_MAX_RADIUS,
  VIS_ANON_RING_GAP,
  VIS_HALF_PLANE_GAP,
  VIS_NUCLEUS_DOT_PADDING,
  VIS_NUCLEUS_FILL,
  VIS_DOT_MULTIPLIER_BASE,
  VIS_DOT_MULTIPLIER_MIN,
} from "@/utils/constants.ts";

// One entry per attribution naming `artistId`, i.e. one dot in the artist vis.
// Shared by the layout (ArtistVis) and the size fitting below so both classify
// dots the same way. tierRadius 0 means the nucleus.
//
// isAnonymousArtist switches the vis to its anonymous layout (see dotTierRadius):
// 99.96% of an anonymous artist's dots have no relation qualifier, i.e. sit in the
// nucleus, so the four tier rings give way to a single outer one.
export function getArtistDotSpecs(works: WorkItem[], artistId: string) {
  const specs = works.flatMap((work) => {
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

  // anonymity is stored per author inside the attribution records, not on the artist
  const isAnonymousArtist = specs.some(
    ({ attr }) =>
      attr.authors.find((a) => a.local_id === artistId)?.is_anonymous === true,
  );
  return specs.map((spec) => ({ ...spec, isAnonymousArtist }));
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
// The lower half-disc's dots: how many attributions each one's work has.
function lowerHalfCounts(specs: ArtistDotSpec[]): number[] {
  return specs
    .filter((d) => d.tierRadius === 0 && !d.isDocumented)
    .map((d) => d.nAttributions);
}

export function fitNucleusMultiplier(
  specs: ArtistDotSpec[],
  nucleusRadius: number = VIS_NUCLEUS_RADIUS,
): number {
  const ns = lowerHalfCounts(specs);
  if (ns.length === 0) return VIS_DOT_MULTIPLIER_BASE;

  const R = nucleusRadius - 2; // keep dots off the stroke
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

// Smallest nucleus radius, between today's and what the canvas allows, in which the
// lower half's dots fit at the standard size: the same budget as fitNucleusMultiplier,
// solved for the radius instead. Only the anonymous (nucleus-only) mode grows the
// nucleus; elsewhere the first tier ring starts just outside the default one.
//   fill * ((pi/2) R^2 - 2 * gap * R) = sum pi * (sqrt(n) * m + p)^2
export function fitNucleusRadius(specs: ArtistDotSpec[]): number {
  const ns = lowerHalfCounts(specs);
  if (ns.length === 0) return VIS_NUCLEUS_RADIUS;

  const p = VIS_NUCLEUS_DOT_PADDING;
  const m = VIS_DOT_MULTIPLIER_BASE;
  const g = VIS_HALF_PLANE_GAP;
  const paddedArea = ns.reduce(
    (sum, n) => sum + Math.PI * (Math.sqrt(n) * m + p) ** 2,
    0,
  );
  // (pi/2) R^2 - 2 g R - paddedArea / fill = 0
  const r =
    (2 * g + Math.sqrt(4 * g * g + (2 * Math.PI * paddedArea) / VIS_NUCLEUS_FILL)) /
    Math.PI;

  return Math.min(
    VIS_ANON_NUCLEUS_MAX_RADIUS,
    Math.max(VIS_NUCLEUS_RADIUS, Math.ceil(r + 2)), // + the 2px kept off the stroke
  );
}

// Anonymous artists get one outer ring just outside their (possibly enlarged) nucleus,
// holding every dot that has a relation qualifier. Always drawn for anonymous artists, even
// when empty (nearly always: 689 of 698), so the vis reads the same for all of them; null
// for everyone else, who keep the four tiers.
export function fitOuterRingRadius(
  specs: ArtistDotSpec[],
  nucleusRadius: number,
): number | null {
  return specs[0]?.isAnonymousArtist ? nucleusRadius + VIS_ANON_RING_GAP : null;
}

// Radius the dot is pulled to: its tier's for normal artists; for anonymous ones the
// nucleus, or the single outer ring when the dot has a relation qualifier.
export function dotTierRadius(
  spec: ArtistDotSpec,
  outerRingRadius: number | null,
): number {
  if (!spec.isAnonymousArtist) return spec.tierRadius;
  return spec.tierRadius === 0 ? 0 : (outerRingRadius ?? 0);
}
