import { scaleOrdinal } from "d3-scale";

export const BASE_URL = "https://catalogo.fondazionezeri.unibo.it/foto/";

// Color
export const colorScale = scaleOrdinal(
  ["accepted", "discarded"],
  ["var(--color-accepted)", "var(--color-discarded)"],
)