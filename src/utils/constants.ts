import { scaleOrdinal } from "d3-scale";

// ── Global shared ──
export const BASE_URL = "https://catalogo.fondazionezeri.unibo.it/foto/";

export const colorScale = scaleOrdinal(
  ["accepted", "discarded"],
  ["var(--color-accepted)", "var(--color-discarded)"],
)

// ── Artist page: visualisation layout ──
export const TIER_I = 200;
export const TIER_II = 300;
export const TIER_III = 400;
export const TIER_IV = 500;

export const TIER_RADII: Record<string, number> = {
  "": 0,
  "bottega": TIER_II,
  "seguace": TIER_III, "scuola": TIER_III, "ambito": TIER_III, "cerchia": TIER_III,
  "copia da": TIER_IV, "maniera": TIER_IV, "falso": TIER_IV,
};

const VIS_MARGIN = 40;
export const VIS_VIEWBOX_WIDTH = 1000 + VIS_MARGIN * 2;
export const VIS_VIEWBOX_HEIGHT = 1000 + VIS_MARGIN * 2;
export const VIS_CX = 700;
export const VIS_CY = 500 + VIS_MARGIN;
export const VIS_NUCLEUS_RADIUS = 155;
// How far the nucleus may grow on anonymous artists' pages (nucleus-only mode): the
// nucleus is centred at VIS_CX, so this is the room left to the canvas's right margin.
export const VIS_ANON_NUCLEUS_MAX_RADIUS = 340;
// gap between an anonymous artist's nucleus and its single outer ring (wider than the
// default nucleus's 45px to the first tier ring, so the ring reads as clearly separate).
// The biggest nucleus (340) puts the ring at 410, still inside the canvas's 500 of room.
export const VIS_ANON_RING_GAP = 70;
// strip kept clear on each side of the dividing line (documented above, the rest below)
export const VIS_HALF_PLANE_GAP = 10;
// Nucleus dot sizing (see fitNucleusMultiplier): start from a standard multiplier
// and shrink it until the dots fit in the lower half-disc.
export const VIS_NUCLEUS_DOT_PADDING = 1.5; // breathing room between nucleus dots (tier dots keep 2)
export const VIS_NUCLEUS_FILL = 0.7; // share of the half-disc the padded dots may cover
export const VIS_DOT_MULTIPLIER_BASE = 4; // standard size
export const VIS_DOT_MULTIPLIER_MIN = 1.5; // floor, so dots stay visible and clickable
export const VIS_DOT_RADIUS = 5;
export const VIS_MIN_ZOOM = 0.9;
export const VIS_MAX_ZOOM = 3;
