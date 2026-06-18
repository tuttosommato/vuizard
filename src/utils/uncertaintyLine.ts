import { curveCatmullRom, line, range } from "d3";

export default function uncertaintyLine(
  [x1, y1, x2, y2]: [number, number, number, number],
  u: number,
) {
  // change the following parameters to change line appearence
  const A_MAX = 13;
  const WAVELENGTH = 12;
  const SAMPLES_PER_WL = 8;
  const MARGIN = 4;

  const aMax = A_MAX;
  const wavelength = WAVELENGTH * (0.5 + 0.5 * u); // remove computation after wavelength to have it constant
  const margin = MARGIN;
  const amp = aMax * (1 - Math.max(0, Math.min(1, u)));

  const dx = x2 - x1,
    dy = y2 - y1;
  const L = Math.hypot(dx, dy);
  if (L === 0) return `M${x1},${y1}`;

  const tx = dx / L,
    ty = dy / L;
  const nx = -ty,
    ny = tx;

  const innerStart = Math.min(margin, L / 2);
  const innerEnd = Math.max(L - margin, L / 2);
  const nSeg = Math.max(2, Math.ceil((L / wavelength) * SAMPLES_PER_WL));

  const pts = range(nSeg + 1).map((i): [number, number] => {
    const s = (i / nSeg) * L;
    const inMargin = s <= innerStart || s >= innerEnd;
    // Wave starts from phase 0 at the beginning of the perturbed zone for continuity
    const off = inMargin
      ? 0
      : amp * Math.sin((2 * Math.PI * (s - innerStart)) / wavelength);
    return [x1 + tx * s + nx * off, y1 + ty * s + ny * off];
  });
  return line().curve(curveCatmullRom.alpha(0.5))(pts) ?? "";
}

/*
By now i stick with wavyLine because it generates more stable lines, while sketchyLine can generate very different lines on each render, which can be visually disturbing

const A_MAX = 8;
const N_POINTS = 16;
const MARGIN = 8;

function gaussianClipped(sigma: number) {
    if (sigma === 0) return 0;
    let v;
    do {
        const u1 = Math.random(),
            u2 = Math.random();
        v = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * sigma;
    } while (Math.abs(v) > sigma);
    return v;
}

function sketchyLine([x1, y1, x2, y2]: [number, number, number, number], u: number, opts = { aMax: A_MAX, nPts: N_POINTS, margin: MARGIN }): string {
    const aMax = opts.aMax ?? A_MAX;
    const nPts = opts.nPts ?? N_POINTS;
    const margin = opts.margin ?? MARGIN;
    const sigma = aMax * (1 - Math.max(0, Math.min(1, u)));

    const dx = x2 - x1,
        dy = y2 - y1;
    const L = Math.hypot(dx, dy);
    if (L === 0) return `M${x1},${y1}`;

    const tx = dx / L, ty = dy / L;
    const nx = -ty, ny = tx;

    // Densifico i campioni nella zona perturbata, con campioni "ancora" ai confini margin
    const innerStart = Math.min(margin, L / 2);
    const innerEnd = Math.max(L - margin, L / 2);

    const pts = range(nPts).map((i): [number, number] => {
        const t = i / (nPts - 1);
        const s = t * L; // ascissa curvilinea
        const inMargin = s <= innerStart || s >= innerEnd;
        const off = inMargin ? 0 : gaussianClipped(sigma);
        return [x1 + tx * s + nx * off, y1 + ty * s + ny * off];
    });

    return line().curve(curveCatmullRom.alpha(0.5))(pts) ?? "";
}; */
