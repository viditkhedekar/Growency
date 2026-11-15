// Scroll-driven disintegration of the "growency" wordmark.
//
// The wordmark is rasterised once per layout into a mask texture. Every pixel
// gets an erosion threshold: letters start in order from the left, and within
// a letter pixels near the edge go first (distance transform). The solid quad
// hides pixels whose threshold has passed; a cloud of tiny GPU points, sampled
// from the same pixels, appears at that moment and drifts toward the orbit
// before fading. Everything is a pure function of progress, so scrolling back
// rebuilds the type exactly.
import * as THREE from 'three';
import { WORDMARK_LETTERS, WORDMARK_VIEWBOX } from '../brand/wordmark.generated';

const INK = [17 / 255, 17 / 255, 20 / 255];

/** Erosion tuning, in units of the type phase (0..1). */
const ONSET_SPREAD = 0.46; // last letter starts this much later than the first
const ERODE_SPAN = 0.3; // time for a letter to erode from edge to core
const LIFE = 0.2; // how long a fragment lives
const JITTER = 0.1;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export class WordmarkFx {
  readonly group = new THREE.Group();
  private quad?: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private points?: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;
  private maskTex?: THREE.DataTexture;
  private uniforms = {
    uP: { value: 0 },
    uLife: { value: LIFE },
    uDpr: { value: 1 },
    uTarget: { value: new THREE.Vector2() },
    uDrift: { value: 120 },
    uScatter: { value: 26 },
    uSize: { value: 2 },
    uInk: { value: new THREE.Vector3(...INK) },
  };

  layout(rect: Rect, dpr: number, isSmall: boolean) {
    this.dispose();
    const vb = WORDMARK_VIEWBOX;
    const texScale = Math.min(dpr, 2600 / rect.w);
    const W = Math.max(8, Math.ceil(rect.w * texScale));
    const H = Math.max(8, Math.ceil(rect.h * texScale));
    // Wordmark SVG uses preserveAspectRatio "xMidYMid meet" in a box of rect size.
    const unit = Math.min(rect.w / vb[2], rect.h / vb[3]);
    const offX = (rect.w - vb[2] * unit) / 2;
    const offY = (rect.h - vb[3] * unit) / 2;

    const cvs = document.createElement('canvas');
    cvs.width = W;
    cvs.height = H;
    const ctx = cvs.getContext('2d', { willReadFrequently: true })!;
    const s = unit * texScale;
    ctx.setTransform(s, 0, 0, s, (offX - vb[0] * unit) * texScale, (offY - vb[1] * unit) * texScale);
    ctx.fillStyle = '#000';
    for (const l of WORDMARK_LETTERS) ctx.fill(new Path2D(l.d));
    const alpha = ctx.getImageData(0, 0, W, H).data;

    // Letter boundaries (texture px): midpoint between neighbouring glyph boxes.
    const toPx = (u: number) => ((u - vb[0]) * unit + offX) * texScale;
    const n = WORDMARK_LETTERS.length;
    const bounds: number[] = [];
    for (let i = 0; i < n - 1; i++) bounds.push((toPx(WORDMARK_LETTERS[i].bbox[2]) + toPx(WORDMARK_LETTERS[i + 1].bbox[0])) / 2);
    const letterOf = new Uint8Array(W);
    for (let x = 0, li = 0; x < W; x++) {
      while (li < n - 1 && x > bounds[li]) li++;
      letterOf[x] = li;
    }

    // Inside distance transform (two-pass chamfer 3-4), in texture px.
    const N = W * H;
    const dist = new Float32Array(N);
    const BIG = 1e6;
    for (let i = 0; i < N; i++) dist[i] = alpha[i * 4 + 3] > 127 ? BIG : 0;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (!dist[i]) continue;
        let d = dist[i];
        if (x > 0) d = Math.min(d, dist[i - 1] + 3);
        if (y > 0) {
          d = Math.min(d, dist[i - W] + 3);
          if (x > 0) d = Math.min(d, dist[i - W - 1] + 4);
          if (x < W - 1) d = Math.min(d, dist[i - W + 1] + 4);
        } else d = Math.min(d, 3);
        if (x === 0) d = Math.min(d, 3);
        dist[i] = d;
      }
    for (let y = H - 1; y >= 0; y--)
      for (let x = W - 1; x >= 0; x--) {
        const i = y * W + x;
        if (!dist[i]) continue;
        let d = dist[i];
        if (x < W - 1) d = Math.min(d, dist[i + 1] + 3);
        if (y < H - 1) {
          d = Math.min(d, dist[i + W] + 3);
          if (x < W - 1) d = Math.min(d, dist[i + W + 1] + 4);
          if (x > 0) d = Math.min(d, dist[i + W - 1] + 4);
        }
        dist[i] = d;
      }
    const maxDepth = new Float32Array(n).fill(1);
    for (let i = 0; i < N; i++) {
      const l = letterOf[i % W];
      if (dist[i] > maxDepth[l]) maxDepth[l] = dist[i];
    }
    const letterX0 = new Float32Array(n).fill(W);
    const letterX1 = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      letterX0[i] = toPx(WORDMARK_LETTERS[i].bbox[0]);
      letterX1[i] = toPx(WORDMARK_LETTERS[i].bbox[2]);
    }

    // Threshold field.
    const grain = 18 * texScale; // noise cell size in tex px
    const noise = (x: number, y: number) => valueNoise(x / grain, y / grain) * 0.65 + valueNoise(x / (grain * 0.33), y / (grain * 0.33)) * 0.35;
    const thr = new Float32Array(N);
    const maxT = 1 - LIFE - 0.005;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        const l = letterOf[x];
        const onset = (l / (n - 1)) * ONSET_SPREAD;
        const xf = (x - letterX0[l]) / Math.max(1, letterX1[l] - letterX0[l]);
        const depth = dist[i] / maxDepth[l];
        let t = onset + ERODE_SPAN * Math.pow(depth, 0.85) * 0.82 + 0.06 * xf + JITTER * (noise(x, y) - 0.5);
        if (alpha[i * 4 + 3] === 0) t = onset; // outside: never later than the edge
        thr[i] = Math.min(maxT, Math.max(0.002, t));
      }

    const data = new Uint16Array(N * 2);
    for (let i = 0; i < N; i++) {
      data[i * 2] = THREE.DataUtils.toHalfFloat(alpha[i * 4 + 3] / 255);
      data[i * 2 + 1] = THREE.DataUtils.toHalfFloat(thr[i]);
    }
    const tex = new THREE.DataTexture(data, W, H, THREE.RGFormat, THREE.HalfFloatType);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    tex.needsUpdate = true;
    this.maskTex = tex;

    // Solid type quad.
    const quadMat = new THREE.ShaderMaterial({
      uniforms: { ...this.uniforms, uMask: { value: tex } },
      transparent: true,
      depthTest: false,
      depthWrite: false,
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() { vUv = vec2(uv.x, 1.0 - uv.y); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D uMask; uniform float uP; uniform vec3 uInk;
        varying vec2 vUv;
        void main() {
          vec2 m = texture2D(uMask, vUv).rg;
          float keep = smoothstep(uP - 0.0035, uP + 0.0035, m.g);
          float a = m.r * keep;
          if (a < 0.003) discard;
          gl_FragColor = vec4(uInk, a);
        }`,
    });
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(rect.w, rect.h), quadMat);
    this.quad.position.set(rect.x + rect.w / 2, -(rect.y + rect.h / 2), 0);
    this.group.add(this.quad);

    // Fragments, sampled on a jittered grid over the glyph pixels.
    const spacing = isSmall ? 1.6 : 2.1; // css px between fragments
    const step = spacing * texScale;
    const pos: number[] = [];
    const tAttr: number[] = [];
    const rnd: number[] = [];
    let seed = 1;
    const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    for (let gy = 0; gy < H; gy += step)
      for (let gx = 0; gx < W; gx += step) {
        const x = Math.min(W - 1, Math.floor(gx + rand() * step));
        const y = Math.min(H - 1, Math.floor(gy + rand() * step));
        const i = y * W + x;
        if (alpha[i * 4 + 3] < 110) continue;
        pos.push(rect.x + x / texScale, -(rect.y + y / texScale), 0);
        tAttr.push(thr[i]);
        rnd.push(rand(), rand(), rand());
      }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('aT', new THREE.Float32BufferAttribute(tAttr, 1));
    geo.setAttribute('aRand', new THREE.Float32BufferAttribute(rnd, 3));
    this.uniforms.uSize.value = spacing * 1.15;
    this.uniforms.uDpr.value = dpr;
    this.uniforms.uDrift.value = Math.min(160, rect.h * 0.9 + 40);
    this.uniforms.uScatter.value = Math.max(10, rect.h * 0.16);
    const ptsMat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      vertexShader: /* glsl */ `
        attribute float aT; attribute vec3 aRand;
        uniform float uP, uLife, uDpr, uDrift, uScatter, uSize; uniform vec2 uTarget;
        varying float vA;
        void main() {
          float age = (uP - aT) / uLife;
          if (age <= 0.0 || age >= 1.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; vA = 0.0; return; }
          vec3 p = position;
          vec2 dir = uTarget - p.xy;
          dir /= max(length(dir), 1.0);
          float e = 1.0 - (1.0 - age) * (1.0 - age);
          // brief lift off the edge, then a slight pull toward the orbit
          vec2 lift = vec2((aRand.y - 0.5) * 2.0, (aRand.z - 0.3)) * uScatter * e;
          p.xy += lift + dir * uDrift * (0.3 + aRand.x) * pow(age, 1.4);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = uSize * uDpr * (0.55 + 0.75 * aRand.x) * (1.0 - 0.55 * age);
          vA = pow(1.0 - age, 1.6) * (0.55 + 0.45 * aRand.z);
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uInk; varying float vA;
        void main() { if (vA <= 0.0) discard; gl_FragColor = vec4(uInk, vA); }`,
    });
    this.points = new THREE.Points(geo, ptsMat);
    this.points.frustumCulled = false;
    this.group.add(this.points);
  }

  /** Point (stage css px, y down) that fragments drift toward. */
  setTarget(x: number, y: number) {
    this.uniforms.uTarget.value.set(x, -y);
  }

  update(typeProgress: number) {
    this.uniforms.uP.value = typeProgress;
    this.group.visible = typeProgress < 0.999;
  }

  dispose() {
    for (const o of [this.quad, this.points]) {
      if (!o) continue;
      this.group.remove(o);
      o.geometry.dispose();
      o.material.dispose();
    }
    this.maskTex?.dispose();
    this.quad = this.points = undefined;
  }
}

function hash(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function valueNoise(x: number, y: number) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
