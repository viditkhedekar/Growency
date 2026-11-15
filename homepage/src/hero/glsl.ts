// Shared GLSL snippets.

export const NOISE = /* glsl */ `
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * .1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1, 0)), u.x),
             mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1, 1)), u.x), u.y);
}
`;

/** Sweep coordinate across the mark (0 at left → 1 at right, slight diagonal). p in mark units (height 1, y up). */
export const SWEEP = /* glsl */ `
uniform float uAspect;
float sweepCoord(vec2 p) {
  return (p.x / uAspect + 0.5) * 0.78 + (0.5 - p.y) * 0.22;
}
`;

export const MAX_POLY = 8;

/** Signed distance to a polygon (negative inside). After Inigo Quilez. */
export const SD_POLY = /* glsl */ `
uniform vec2 uPoly[${MAX_POLY}];
uniform int uPolyN;
float sdPoly(vec2 p) {
  float d = dot(p - uPoly[0], p - uPoly[0]);
  float s = 1.0;
  int j = uPolyN - 1;
  for (int i = 0; i < ${MAX_POLY}; i++) {
    if (i >= uPolyN) break;
    vec2 vi = uPoly[i];
    vec2 vj = uPoly[j];
    vec2 e = vj - vi;
    vec2 w = p - vi;
    vec2 b = w - e * clamp(dot(w, e) / dot(e, e), 0.0, 1.0);
    d = min(d, dot(b, b));
    bvec3 c = bvec3(p.y >= vi.y, p.y < vj.y, e.x * w.y > e.y * w.x);
    if (all(c) || all(not(c))) s *= -1.0;
    j = i;
  }
  return s * sqrt(d);
}
`;
