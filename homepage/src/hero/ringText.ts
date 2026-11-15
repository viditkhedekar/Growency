// Fixed-weight tagline with a scroll-controlled liquid-silver light reveal.
// It waits for the wordmark to clear, holds for reading, then makes a short
// mechanical snap before its edges dissolve into silver fragments.
import * as THREE from 'three';
import { TEXT_METAL } from './textMetal';

export const TAGLINE = ['The only growth agency', 'you’ll ever need.'];

const SS = 2; // supersample
const FONT_PX = 120;
const SPREAD = 18 * SS; // SDF range in texture px

const vertexShader = /* glsl */ `
uniform float uReveal, uClick;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec3 p = position;
  p.xy *= 1.0 - uClick * 0.025;
  p.x += (uv.y > 0.5 ? -1.0 : 1.0) * uClick * 0.006;
  p.y -= (1.0 - uReveal) * 0.025;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;

const fragmentShader = /* glsl */ `
uniform sampler2D map;
uniform float uReveal, uOpacity, uErode;
uniform vec2 uTexel;
${TEXT_METAL}
float grain(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
varying vec2 vUv;
void main() {
  float sd = (texture2D(map, vUv).r - 0.5) * 2.0; // -1..1 of SPREAD, + inside

  // Fixed 500-weight silhouette, independent of time and pointer position.
  float edge = sd;
  float aa = max(fwidth(edge), 1e-4) * 0.75;
  float ink = smoothstep(-aa, aa, edge);

  // No ink at rest: the reflection itself reveals the letters on scroll.
  float front = mix(-0.18, 1.22, uReveal);
  float coord = vUv.x + (1.0 - vUv.y) * 0.06;
  float m = 1.0 - smoothstep(front - 0.02, front + 0.025, coord);

  // Left-to-right, edge-first erosion, with fine silver grit at the boundary.
  float letter = floor(vUv.x * 26.0) / 26.0;
  float noise = grain(floor(vUv * vec2(780.0, 180.0)));
  float threshold = 0.08 + letter * 0.46 + clamp(sd, 0.0, 1.0) * 0.30 + noise * 0.12;
  float keep = smoothstep(uErode - 0.015, uErode + 0.015, threshold);
  float a = ink * m * uOpacity * keep;
  if (a < 0.003) discard;
  vec2 gradient = vec2(
    texture2D(map, vUv + vec2(uTexel.x, 0.0)).r - texture2D(map, vUv - vec2(uTexel.x, 0.0)).r,
    texture2D(map, vUv + vec2(0.0, uTexel.y)).r - texture2D(map, vUv - vec2(0.0, uTexel.y)).r
  );
  gl_FragColor = vec4(liquidMetal(vec2(vUv.x, 1.0 - vUv.y), uReveal, sd, gradient), a);
}`;

export class RingText {
  readonly mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private u = {
    map: { value: null as THREE.Texture | null },
    uReveal: { value: 0 },
    uClick: { value: 0 },
    uTexel: { value: new THREE.Vector2() },
    uErode: { value: 0 },
    uOpacity: { value: 1 },

  };
  private dust?: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;
  private aspect = 3;

  constructor() {
    this.mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.ShaderMaterial({ uniforms: this.u, vertexShader, fragmentShader, transparent: true, depthTest: false, depthWrite: false }),
    );
    this.mesh.renderOrder = 20;
    this.draw();
  }

  /** Rasterise the tagline (weight 500) and convert it to a signed-distance field. */
  draw() {
    const pad = SPREAD + 8;
    const lineH = FONT_PX * 1.12 * SS;
    const probe = document.createElement('canvas').getContext('2d')!;
    const font = `500 ${FONT_PX * SS}px Geist, ui-sans-serif, system-ui, sans-serif`;
    probe.font = font;
    probe.letterSpacing = `${-0.03 * FONT_PX * SS}px`;
    const widths = TAGLINE.map((l) => probe.measureText(l).width);
    const W = Math.ceil(Math.max(...widths) + pad * 2);
    const H = Math.ceil(lineH * TAGLINE.length + pad * 2);

    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d', { willReadFrequently: true })!;
    ctx.font = font;
    ctx.letterSpacing = probe.letterSpacing;
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#000';
    TAGLINE.forEach((l, i) => ctx.fillText(l, (W - widths[i]) / 2, pad + lineH * i + FONT_PX * SS * 0.92));
    const src = ctx.getImageData(0, 0, W, H).data;

    // Two-pass chamfer distance, inside and outside, combined into a signed field.
    const N = W * H;
    const inside = new Uint8Array(N);
    for (let i = 0; i < N; i++) inside[i] = src[i * 4 + 3] > 127 ? 1 : 0;
    const dOut = chamfer(inside, W, H, 1); // distance to ink, for outside pixels
    const dIn = chamfer(inside, W, H, 0); // distance to background, for inside pixels
    const out = new Uint8Array(N);
    for (let i = 0; i < N; i++) {
      const sd = inside[i] ? dIn[i] / 3 - 0.5 : -(dOut[i] / 3 - 0.5);
      out[i] = Math.max(0, Math.min(255, Math.round((sd / SPREAD) * 127.5 + 127.5)));
    }
    // Sample the same distance field for fragments, so they lift directly
    // from each letter as its erosion threshold passes, in either direction.
    if (this.dust) {
      this.mesh.remove(this.dust);
      this.dust.geometry.dispose();
      this.dust.material.dispose();
    }
    const positions: number[] = [];
    const thresholds: number[] = [];
    const seeds: number[] = [];
    for (let y = 0; y < H; y += 5) {
      for (let x = 0; x < W; x += 5) {
        const i = y * W + x;
        if (!inside[i]) continue;
        const rand = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
        const n = rand - Math.floor(rand);
        const sd = Math.max(0, (out[i] / 255 - 0.5) * 2);
        positions.push(x / W - 0.5, 0.5 - y / H, 0.002);
        thresholds.push(0.08 + Math.floor(x / W * 26) / 26 * 0.46 + sd * 0.30 + n * 0.12);
        seeds.push(n);
      }
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    dustGeo.setAttribute('aThreshold', new THREE.Float32BufferAttribute(thresholds, 1));
    dustGeo.setAttribute('aSeed', new THREE.Float32BufferAttribute(seeds, 1));
    this.dust = new THREE.Points(dustGeo, new THREE.ShaderMaterial({
      uniforms: { ...this.u, uDpr: { value: Math.min(devicePixelRatio, 2) } },
      transparent: true, depthTest: false, depthWrite: false,
      vertexShader: /* glsl */ `
        attribute float aThreshold, aSeed;
        uniform float uErode, uDpr;
        varying float vAlpha, vSeed;
        void main() {
          float age = (uErode - aThreshold) / 0.22;
          vAlpha = step(0.0, age) * (1.0 - smoothstep(0.0, 1.0, age));
          vSeed = aSeed;
          vec3 p = position;
          float drift = clamp(age, 0.0, 1.0);
          p.x += (aSeed - 0.35) * drift * 0.09;
          p.y += (0.12 + aSeed * 0.16) * drift;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = (0.8 + aSeed) * uDpr;
        }`,
      fragmentShader: /* glsl */ `
        uniform float uOpacity;
        varying float vAlpha, vSeed;
        void main() {
          float a = vAlpha * uOpacity * (1.0 - smoothstep(0.15, 0.5, length(gl_PointCoord - 0.5)));
          if (a < 0.003) discard;
          gl_FragColor = vec4(mix(vec3(0.19, 0.22, 0.27), vec3(0.77, 0.81, 0.86), vSeed), a);
        }`,
    }));
    this.dust.frustumCulled = false;
    this.dust.renderOrder = 21;
    this.mesh.add(this.dust);
    // Rows flipped so texture v=1 is the top of the text.
    const flipped = new Uint8Array(N);
    for (let y = 0; y < H; y++) flipped.set(out.subarray(y * W, y * W + W), (H - 1 - y) * W);
    const tex = new THREE.DataTexture(flipped, W, H, THREE.RedFormat, THREE.UnsignedByteType);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    tex.unpackAlignment = 1;
    tex.needsUpdate = true;
    this.u.map.value?.dispose();
    this.u.map.value = tex;
    this.aspect = W / H;
    this.u.uTexel.value.set(1 / W, 1 / H);
  }

  /** Place at the ring centre, `width` world units wide, facing the camera. */
  place(center: THREE.Vector3, width: number) {
    this.mesh.position.copy(center);
    this.mesh.scale.set(width, width / this.aspect, 1);
  }

  update(reveal: number, opacity: number, erode: number, click: number) {
    this.u.uReveal.value = reveal;
    this.u.uOpacity.value = opacity;
    this.u.uErode.value = erode;
    this.u.uClick.value = click;
    this.mesh.visible = opacity > 0.002 && reveal > 0.001;
  }
}

/**
 * Chamfer (3-4) distance transform. Returns, for every pixel whose mask value
 * differs from `target`, the distance (×3) to the nearest pixel equal to `target`.
 */
function chamfer(mask: Uint8Array, W: number, H: number, target: 0 | 1) {
  const BIG = 1e6;
  const d = new Float32Array(W * H);
  for (let i = 0; i < d.length; i++) d[i] = mask[i] === target ? 0 : BIG;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (!d[i]) continue;
      let v = d[i];
      if (x > 0) v = Math.min(v, d[i - 1] + 3);
      if (y > 0) {
        v = Math.min(v, d[i - W] + 3);
        if (x > 0) v = Math.min(v, d[i - W - 1] + 4);
        if (x < W - 1) v = Math.min(v, d[i - W + 1] + 4);
      }
      d[i] = v;
    }
  for (let y = H - 1; y >= 0; y--)
    for (let x = W - 1; x >= 0; x--) {
      const i = y * W + x;
      if (!d[i]) continue;
      let v = d[i];
      if (x < W - 1) v = Math.min(v, d[i + 1] + 3);
      if (y < H - 1) {
        v = Math.min(v, d[i + W] + 3);
        if (x < W - 1) v = Math.min(v, d[i + W + 1] + 4);
        if (x > 0) v = Math.min(v, d[i + W - 1] + 4);
      }
      d[i] = v;
    }
  return d;
}
