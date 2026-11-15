// The Growency mark: three separate facets converging on a right-pointing tip.
//
// Traced from the supplied logo photo and made exactly symmetric about the
// horizontal axis: a long middle triangle, plus an upper and a lower blade
// whose inner edges open into wedge-shaped gaps that narrow to slim slits at
// the tip. Everything else (orbit targets, clipping, chrome extrusion, halo,
// static fallback, nav icon, favicon) is derived from this file.
//
// Authoring space: x 0..100 (left edge → tip), y centred on the axis, y DOWN (SVG).

export type Pt = [number, number];

// Upper blade, clockwise from its top-left corner. The lower blade mirrors it.
const BLADE: Pt[] = [
  [39.5, -54.5], // top-left
  [81.4, -32.5], // shoulder where the outer edge bends toward the tip
  [99.1, -2.5], // tip (stops just short of the axis → slim gap)
  [39.5, -28.6], // bottom-left
];
const MIDDLE_HALF_H = 26.6;

const mirror = (poly: Pt[]): Pt[] => poly.map(([x, y]) => [x, -y] as Pt).reverse();

/** Final facets (top blade, middle, bottom blade), authoring space. */
export const MARK_FACETS: Pt[][] = [
  BLADE,
  [
    [0, -MIDDLE_HALF_H],
    [100, 0],
    [0, MIDDLE_HALF_H],
  ],
  mirror(BLADE),
];

/** Slope (rise/run) of the blades' outer edge; reused for the wordmark's y terminal. */
export const MARK_CUT_SLOPE = (BLADE[1][1] - BLADE[0][1]) / (BLADE[1][0] - BLADE[0][0]);

export const MARK_BOUNDS = (() => {
  const xs = MARK_FACETS.flat().map((p) => p[0]);
  const ys = MARK_FACETS.flat().map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  return { minX, maxX, minY, maxY, w: maxX - minX, h: maxY - minY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
})();

/**
 * Facets in a normalised, centred, y-UP space where the mark's height is 1.
 * This is what the 3D scene uses.
 */
export const MARK_FACETS_UNIT: Pt[][] = MARK_FACETS.map((f) =>
  f.map(([x, y]) => [(x - MARK_BOUNDS.cx) / MARK_BOUNDS.h, -(y - MARK_BOUNDS.cy) / MARK_BOUNDS.h] as Pt),
);
export const MARK_ASPECT = MARK_BOUNDS.w / MARK_BOUNDS.h;

export const markPathD = (facet: Pt[]) => 'M' + facet.map((p) => p.map((v) => v.toFixed(3)).join(' ')).join('L') + 'Z';
