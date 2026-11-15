// Scroll choreography for the hero. `p` is pinned-scroll progress 0..1.
// All phase boundaries live here so timing can be tuned in one place.

/** How long the hero stays pinned, in viewport heights of scrolling. */
export const PIN_LENGTH_VH = 14;

export const T = {
  // 1. Plain black wordmark erodes completely before the tagline appears.
  typeStart: 0.02,
  typeEnd: 0.20,
  taglineStart: 0.22,
  taglineEnd: 0.34,
  clickStart: 0.395,
  clickEnd: 0.42,
  erodeStart: 0.425,
  erodeEnd: 0.50,
  // 2/3. Orbit accelerates, tilts and opens once the type starts clearing…
  orbitStart: 0.40,
  orbitEnd: 0.54,
  // …and the cards fly out into the mark's three facets.
  flyStart: 0.45,
  flyEnd: 0.68,
  // 3b. Briefly hold the assembled video-filled mark.
  chromeStart: 0.70,
  // 4. Slow, front-facing chrome reveal.
  chromeEnd: 0.88,
  // One turn, a separate settle interval, then a rotation-free zoom.
  turnEnd: 0.915,
  settleEnd: 0.928,
  zoomStart: 0.93,
  zoomEnd: 0.995,
};

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
export const smooth = (t: number) => t * t * (3 - 2 * t);
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeIn = (t: number) => t * t * t;
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export interface Phases {
  /** Wordmark disintegration 0..1 */
  type: number;
  /** Orbit acceleration / tilt / opening 0..1 */
  orbit: number;
  /** Cards flying into the facets 0..1 (per-card stagger applied downstream) */
  fly: number;
  /** Chrome reveal 0..1 */
  chrome: number;
  /** Final push into the chrome surface 0..1 */
  zoom: number;
}

export function phases(p: number): Phases {
  return {
    type: seg(p, T.typeStart, T.typeEnd),
    orbit: seg(p, T.orbitStart, T.orbitEnd),
    fly: seg(p, T.flyStart, T.flyEnd),
    chrome: seg(p, T.chromeStart, T.chromeEnd),
    zoom: seg(p, T.zoomStart, T.zoomEnd),
  };
}
