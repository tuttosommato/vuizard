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
  "copia da": TIER_IV, "maniera": TIER_IV,
};

const VIS_MARGIN = 40;
export const VIS_VIEWBOX_WIDTH = 1000 + VIS_MARGIN * 2;
export const VIS_VIEWBOX_HEIGHT = 1000 + VIS_MARGIN * 2;
export const VIS_CX = 700;
export const VIS_CY = 500 + VIS_MARGIN;
export const VIS_NUCLEUS_RADIUS = 155;
export const VIS_DOT_RADIUS = 5;
export const VIS_MIN_ZOOM = 0.9;
export const VIS_MAX_ZOOM = 3;
