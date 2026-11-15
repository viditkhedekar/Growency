// The middle facet opens onto the dark background of the slideshow.
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
uniform float uOpen;
uniform vec2 uFocus;
varying vec2 vMark;
void main() {
  // iris opening from the zoom focus
  float r = uOpen * 1.25;
  float d = length(vMark - uFocus);
  float aa = max(fwidth(d), 1e-4) * 1.5;
  float iris = 1.0 - smoothstep(r - aa, r + aa, d);
  if (iris <= 0.0) discard;

  vec3 col = vec3(20.0, 20.0, 22.0) / 255.0;

  // bright lip on the opening edge while it widens
  float lip = smoothstep(0.035, 0.0, r - d) * (1.0 - smoothstep(0.85, 1.0, uOpen));
  col = mix(col, vec3(1.0), lip * 0.55);
  gl_FragColor = vec4(col, iris);
}`;

export class Portal {
  readonly mesh: THREE.Mesh<THREE.ShapeGeometry, THREE.ShaderMaterial>;
  readonly u = {
    uOpen: { value: 0 },
    uFocus: { value: new THREE.Vector2(-0.22, 0) },
  };

  constructor() {
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

  update(open: number) {
    this.u.uOpen.value = open;
    this.mesh.visible = open > 0.001;
  }
}
