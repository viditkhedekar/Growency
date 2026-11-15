// The "window" in the middle facet of the mark. As the final zoom pushes into
// the chrome, the facet opens (an iris from the zoom focus) onto the spec-ad
// reel. The reel is sampled in SCREEN space with cover-fit, so when the facet
// fills the viewport the frame is pixel-identical to the full-bleed reel that
// opens the next section, and the hand-off is seamless.
import * as THREE from 'three';
import { MARK_FACETS_UNIT, type Pt } from '../brand/mark';

const MIDDLE = 1; // index of the middle facet
const RIM = 0.016; // chrome rim left around the window, in mark heights

function insetConvex(poly: Pt[], d: number): Pt[] {
  let area = 0;
  poly.forEach(([x1, y1], i) => {
    const [x2, y2] = poly[(i + 1) % poly.length];
    area += x1 * y2 - x2 * y1;
  });
  const s = area > 0 ? 1 : -1;
  const lines = poly.map((a, i) => {
    const b = poly[(i + 1) % poly.length];
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const len = Math.hypot(dx, dy);
    return { p: [a[0] + (-dy / len) * s * d, a[1] + (dx / len) * s * d] as Pt, v: [dx, dy] as Pt };
  });
  return poly.map((_, i) => {
    const l1 = lines[(i - 1 + poly.length) % poly.length], l2 = lines[i];
    const det = l1.v[0] * l2.v[1] - l1.v[1] * l2.v[0];
    const t = ((l2.p[0] - l1.p[0]) * l2.v[1] - (l2.p[1] - l1.p[1]) * l2.v[0]) / det;
    return [l1.p[0] + l1.v[0] * t, l1.p[1] + l1.v[1] * t] as Pt;
  });
}

const vertexShader = /* glsl */ `
varying vec2 vMark;
void main() {
  vMark = position.xy;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const fragmentShader = /* glsl */ `
uniform sampler2D map;
uniform float uHasMap, uTexAspect, uOpen;
uniform vec2 uRes, uFocus;
varying vec2 vMark;
void main() {
  // iris opening from the zoom focus
  float r = uOpen * 1.25;
  float d = length(vMark - uFocus);
  float aa = max(fwidth(d), 1e-4) * 1.5;
  float iris = 1.0 - smoothstep(r - aa, r + aa, d);
  if (iris <= 0.0) discard;

  // screen-space cover-fit, so the full-screen state matches the DOM reel exactly
  vec2 uv = gl_FragCoord.xy / uRes;
  float sa = uRes.x / uRes.y;
  vec2 c = uv - 0.5;
  if (sa > uTexAspect) c.y *= uTexAspect / sa; else c.x *= sa / uTexAspect;
  vec3 col = uHasMap > 0.5 ? texture2D(map, c + 0.5).rgb : vec3(0.067, 0.067, 0.078);

  // bright lip on the opening edge while it widens
  float lip = smoothstep(0.035, 0.0, r - d) * (1.0 - smoothstep(0.85, 1.0, uOpen));
  col = mix(col, vec3(1.0), lip * 0.55);
  gl_FragColor = vec4(col, iris);
}`;

export class Portal {
  readonly mesh: THREE.Mesh<THREE.ShapeGeometry, THREE.ShaderMaterial>;
  readonly u = {
    map: { value: null as THREE.Texture | null },
    uHasMap: { value: 0 },
    uTexAspect: { value: 16 / 9 },
    uOpen: { value: 0 },
    uRes: { value: new THREE.Vector2(1, 1) },
    uFocus: { value: new THREE.Vector2(-0.22, 0) },
  };
  private tex?: THREE.VideoTexture;

  constructor(private video: HTMLVideoElement | null) {
    const pts = insetConvex(MARK_FACETS_UNIT[MIDDLE], RIM);
    const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
    this.mesh = new THREE.Mesh(
      new THREE.ShapeGeometry(shape),
      new THREE.ShaderMaterial({ uniforms: this.u, vertexShader, fragmentShader, transparent: true, toneMapped: false }),
    );
    this.mesh.position.z = 0.0015; // just in front of the chrome cap
    this.mesh.renderOrder = 5;
    this.mesh.visible = false;
  }

  /** Focus point (mark units) the iris grows from — the zoom target. */
  setFocus(x: number, y: number) {
    this.u.uFocus.value.set(x, y);
  }

  setResolution(w: number, h: number) {
    this.u.uRes.value.set(w, h);
  }

  update(open: number) {
    this.u.uOpen.value = open;
    this.mesh.visible = open > 0.001;
    const v = this.video;
    if (!v) return;
    v.dataset.portal = open > 0.001 ? 'open' : '';
    if (open > 0.001) {
      if (!this.tex) {
        v.preload = 'auto';
        this.tex = new THREE.VideoTexture(v);
        this.tex.colorSpace = THREE.NoColorSpace;
        this.tex.minFilter = THREE.LinearFilter;
        this.tex.generateMipmaps = false;
      }
      if (v.paused) void v.play().catch(() => {});
      if (v.readyState >= 2) {
        this.u.map.value = this.tex;
        this.u.uHasMap.value = 1;
        this.u.uTexAspect.value = v.videoWidth / v.videoHeight || 16 / 9;
      }
    }
  }
}
