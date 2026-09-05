import { scaleLinear } from "d3-scale"

// Internal coordinate space. svg's viewBox maps this to the rendered container
export const VIEW_W = 1000
export const VIEW_H = 1000

// Visual constants
export const curveGap = 10
export const labelsFontSize = 14   // viewBox units (will be overridden by CSS for pixel size)

// Radial geometry
const size = Math.min(VIEW_W, VIEW_H)
export const centerX = VIEW_W / 8
export const centerY = VIEW_H / 2
export const min = size / 25
export const max = min * 12 + 1
export const increment = min
export const radius = min / 3
export const rankScale = scaleLinear().domain([0, 11]).range([max, min])
export const outerX = rankScale(0) * 2
export const center = `translate(${centerX}, ${centerY})`