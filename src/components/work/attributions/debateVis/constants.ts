import { scaleLinear } from "d3-scale";

export const height = 800;
export const width = 1000;
export const center = `translate(${width / 4}, ${height / 2})`;
export const curveGap = 10;
export const labelsFontSize = 14;

// Bounds for the rank scale (the concentric rings attributions sit on)
export const min = height / 25;
export const max = min * 11 + 1;
export const radius = min / 2.5;

// Maps an attribution's rank (0-10)
export const rankScale = scaleLinear().domain([0, 10]).range([max, min]);

// Control-point x-coordinate used when drawing curved connection lines
export const outerX = rankScale(0) * 2.25;
