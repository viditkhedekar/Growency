/* =========================================================
   Growency: the scene

   One WebGL canvas behind the whole page. It holds the
   wordmark drawn as dots, the lattice (the logo's own
   geometry wrapped onto a sphere, or laid flat inside a glass
   medallion), the six nodes, a glow, and the cursor's trail.

   It reads window.GROWENCY every frame and never writes to
   the DOM, so script.js stays the only thing that measures
   the page. If anything in here throws, the import in
   index.html catches it and the page falls back to the flat
   marks.
   ========================================================= */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const G = window.GROWENCY;
if (!G || !G.mark) throw new Error('Growency: no mark geometry');

const canvas = document.getElementById('gl');
if (!canvas) throw new Error('Growency: no canvas');

const MARK = G.mark;
const reduced = !!G.reduced;
const mobile = !!G.mobile;

/* ------------------------------------------------ setup -- */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, powerPreference: 'high-performance' });
renderer.setClearColor(0x06060c, 1);
renderer.toneMapping = THREE.NeutralToneMapping !== undefined ? THREE.NeutralToneMapping : THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
if ('transmissionResolutionScale' in renderer) renderer.transmissionResolutionScale = mobile ? 0.4 : 0.6;

let W = window.innerWidth, H = window.innerHeight;
const PR = Math.min(window.devicePixelRatio || 1, mobile ? 1 : 1.5);
renderer.setPixelRatio(PR);
renderer.setSize(W, H, false);

const scene = new THREE.Scene();
const FOV = 35;
const camera = new THREE.PerspectiveCamera(FOV, W / H, 0.05, 120);
camera.position.set(0, 0, 6);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.05).texture;

/* the cover gradient, left to right. The lattice, nodes, dots and trail
   take its bright half; the backdrop runs the whole ramp. */
const COL_A = new THREE.Color('#2AA3FC');
const COL_B = new THREE.Color('#5250E8');
const COL_BG = new THREE.Color('#06060C');
const COVER = [
  [0.0, '#2AA3FC'], [0.2, '#3993F8'], [0.4, '#4B6DF3'], [0.5, '#5250E8'],
  [0.6, '#5028BE'], [0.7, '#3A0D86'], [0.8, '#27085C'], [1.0, '#0A0326']
];

/* =======================================================
   Geometry from the mark

   Every point of the flat lattice has three homes: on the
   sphere, on the corridor it unrolls into, and flat inside
   the medallion. The shader mixes between them.
   ======================================================= */
const RC = 0.62;   /* corridor radius, in globe units */
const LH = 3.0;    /* half the corridor's length */
const SUB = 5;     /* pieces per segment, so the lines curve */

function unit(x, y) { return [(x - 60) / 53, -(y - 60) / 53]; }
function onSphere(u, v) {
  const r = Math.hypot(u, v);
  const phi = Math.min(r, 1) * Math.PI / 2;
  const k = r > 1e-6 ? Math.sin(phi) / r : 0;
  return [u * k, v * k, Math.cos(phi)];
}
function onTube(u, v, back) {
  const r = Math.min(1, Math.hypot(u, v));
  const th = Math.atan2(v, u);
  const z = back ? -(2 - r) * LH : -r * LH;
  return [Math.cos(th) * RC, Math.sin(th) * RC, z];
}
function hueOf(u, v) { return Math.atan2(v, u) / (Math.PI * 2) + 0.5; }

const pos = [], tube = [], flat = [], back = [], hue = [];
function push(u, v, isBack) {
  const s = onSphere(u, v);
  pos.push(s[0], s[1], isBack ? -s[2] : s[2]);
  const t = onTube(u, v, isBack);
  tube.push(t[0], t[1], t[2]);
  flat.push(u, v, 0);
  back.push(isBack ? 1 : 0);
  hue.push(hueOf(u, v));
}
MARK.segs.forEach((s) => {
  const a = unit(s[0], s[1]), b = unit(s[2], s[3]);
  for (let i = 0; i < SUB; i++) {
    const t0 = i / SUB, t1 = (i + 1) / SUB;
    const u0 = a[0] + (b[0] - a[0]) * t0, v0 = a[1] + (b[1] - a[1]) * t0;
    const u1 = a[0] + (b[0] - a[0]) * t1, v1 = a[1] + (b[1] - a[1]) * t1;
    push(u0, v0, false); push(u1, v1, false);
    push(u0, v0, true); push(u1, v1, true);
  }
});
/* the logo's ring becomes the equator, and the portal at the far end */
const RING = 168;
for (let i = 0; i < RING; i++) {
  const a0 = i / RING * Math.PI * 2, a1 = (i + 1) / RING * Math.PI * 2;
  [[Math.cos(a0), Math.sin(a0)], [Math.cos(a1), Math.sin(a1)]].forEach(([u, v]) => {
    pos.push(u, v, 0);
    tube.push(u * RC * 1.25, v * RC * 1.25, -2 * LH * 0.94);
    flat.push(u, v, 0);
    back.push(0);
    hue.push(hueOf(u, v));
  });
}

const latGeo = new THREE.BufferGeometry();
latGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
latGeo.setAttribute('aTube', new THREE.Float32BufferAttribute(tube, 3));
latGeo.setAttribute('aFlat', new THREE.Float32BufferAttribute(flat, 3));
latGeo.setAttribute('aBack', new THREE.Float32BufferAttribute(back, 1));
latGeo.setAttribute('aHue', new THREE.Float32BufferAttribute(hue, 1));

const shared = {
  uTime: { value: 0 }, uMorph: { value: 0 }, uFlat: { value: 0 }, uAlpha: { value: 0 },
  uAspect: { value: W / H }, uPtr: { value: new THREE.Vector2(2, 2) }, uPtrAmt: { value: 0 },
  uColA: { value: COL_A }, uColB: { value: COL_B }
};

const MORPH_GLSL = `
  attribute vec3 aTube;
  attribute vec3 aFlat;
  uniform float uMorph;
  uniform float uFlat;
  vec3 homeOf(vec3 p) { return mix(mix(p, aTube, uMorph), aFlat, uFlat); }
`;
const PTR_GLSL = `
  uniform vec2 uPtr;
  uniform float uPtrAmt;
  uniform float uAspect;
  uniform float uTime;
  float ptrPush(inout vec4 mv) {
    vec4 clip = projectionMatrix * mv;
    vec2 ndc = clip.xy / max(abs(clip.w), 1e-4) * sign(clip.w);
    vec2 d = (ndc - uPtr) * vec2(uAspect, 1.0);
    float dist = length(d);
    float f = exp(-dist * dist * 9.0) * uPtrAmt;
    float wave = sin(dist * 22.0 - uTime * 4.0) * exp(-dist * 3.5) * uPtrAmt * 0.3;
    vec2 dir = dist > 1e-4 ? d / dist : vec2(0.0);
    mv.xy += vec2(dir.x / uAspect, dir.y) * (f * 0.1 + wave * 0.03) * max(-mv.z, 0.2);
    return f;
  }
`;

const lattice = new THREE.LineSegments(latGeo, new THREE.ShaderMaterial({
  uniforms: shared,
  transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: MORPH_GLSL + PTR_GLSL + `
    attribute float aBack;
    attribute float aHue;
    uniform float uAlpha;
    varying float vA;
    varying float vG;
    varying float vH;
    void main() {
      vec3 p = homeOf(position);
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      vec4 cv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
      float sc = max(length(modelViewMatrix[0].xyz), 1e-4);
      float depth = clamp((mv.z - cv.z) / sc * 0.5 + 0.5, 0.0, 1.0);
      float g = ptrPush(mv);
      gl_Position = projectionMatrix * mv;
      float view = -mv.z;
      float near = smoothstep(0.03, 0.6, view);
      float far = exp(-max(0.0, view - 7.0) * 0.17);
      float a = uAlpha * mix(0.1 + 0.9 * pow(depth, 1.6), 0.8, uMorph) * near * far;
      a *= 1.0 - aBack * uFlat;
      vA = clamp(a + g * 0.6 * uAlpha, 0.0, 1.0);
      vG = g;
      vH = aHue;
    }
  `,
  fragmentShader: `
    uniform vec3 uColA;
    uniform vec3 uColB;
    varying float vA;
    varying float vG;
    varying float vH;
    void main() {
      vec3 col = mix(uColA, uColB, clamp(vH, 0.0, 1.0));
      col += vG * vec3(0.5, 0.6, 1.0);
      gl_FragColor = vec4(col, vA);
    }
  `
}));
lattice.frustumCulled = false;

/* the six nodes, one per step of the lifecycle */
const nodeGeo = new THREE.BufferGeometry();
{
  const np = [], nt = [], nf = [], ng = [];
  MARK.nodes.forEach((n) => {
    const [u, v] = unit(n[0], n[1]);
    const s = onSphere(u, v), t = onTube(u, v, false);
    np.push(s[0], s[1], s[2]); nt.push(t[0], t[1], t[2]); nf.push(u, v, 0); ng.push(1);
  });
  nodeGeo.setAttribute('position', new THREE.Float32BufferAttribute(np, 3));
  nodeGeo.setAttribute('aTube', new THREE.Float32BufferAttribute(nt, 3));
  nodeGeo.setAttribute('aFlat', new THREE.Float32BufferAttribute(nf, 3));
  nodeGeo.setAttribute('aGlow', new THREE.Float32BufferAttribute(ng, 1));
}
const nodeUniforms = Object.assign({ uSize: { value: 150 * PR } }, shared);
const nodes = new THREE.Points(nodeGeo, new THREE.ShaderMaterial({
  uniforms: nodeUniforms,
  transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: MORPH_GLSL + `
    attribute float aGlow;
    uniform float uAlpha;
    uniform float uSize;
    varying float vA;
    void main() {
      vec3 p = homeOf(position);
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mv;
      float view = max(-mv.z, 0.08);
      float sc = max(length(modelViewMatrix[0].xyz), 1e-4);
      gl_PointSize = uSize * sc * (0.5 + aGlow) / view;
      vA = uAlpha * (0.25 + 0.75 * aGlow) * smoothstep(0.05, 0.8, view);
    }
  `,
  fragmentShader: `
    uniform vec3 uColA;
    varying float vA;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      float a = smoothstep(0.5, 0.0, d);
      gl_FragColor = vec4(mix(uColA, vec3(1.0), a * 0.6), a * a * vA);
    }
  `
}));
nodes.frustumCulled = false;

const globe = new THREE.Group();
globe.add(lattice); globe.add(nodes);
scene.add(globe);

/* ------------------------------------------ the wordmark as dots --
   script.js samples the GROWENCY letters into points, in CSS pixels from the
   hero's corner. Each dot starts somewhere across the screen and gathers to
   its place, then keeps moving around it: a slow drift, a wave running
   through the letters, a push away from the pointer, and a scatter as the
   hero scrolls off. Drawn straight in screen space, with no camera. */
const COL_C = new THREE.Color('#5A3FD8');
const dots = (() => {
  const g = new THREE.BufferGeometry();
  const m = new THREE.ShaderMaterial({
    uniforms: {
      uTime: shared.uTime, uRes: { value: new THREE.Vector2(W, H) }, uOrigin: { value: new THREE.Vector2() },
      uForm: { value: 0 }, uOut: { value: 0 }, uAlpha: { value: 0 }, uSize: { value: 2.4 * PR },
      uPtr: { value: new THREE.Vector2(-9999, -9999) }, uPtrAmt: { value: 0 },
      uColA: { value: COL_A }, uColB: { value: COL_B }, uColC: { value: COL_C }
    },
    transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute vec3 aFrom;
      uniform vec2 uRes;
      uniform vec2 uOrigin;
      uniform float uTime;
      uniform float uForm;
      uniform float uOut;
      uniform float uAlpha;
      uniform float uSize;
      uniform vec2 uPtr;
      uniform float uPtrAmt;
      varying float vA;
      varying float vT;
      varying float vHot;
      void main() {
        /* position.xy is the dot's home in the letters, position.z where it
           sits along the gradient; aFrom.xy is where it starts, as a share of
           the screen, and aFrom.z its seed */
        float s = aFrom.z;
        float t = uTime;
        vec2 home = uOrigin + position.xy;
        vec2 drift = vec2(sin(t * 0.7 + s * 40.0 + position.y * 0.02),
                          cos(t * 0.6 + s * 31.0 + position.x * 0.02)) * (0.6 + 1.4 * s);
        drift.y += sin(position.x * 0.011 + position.y * 0.004 - t * 1.1) * 2.2;

        float f = smoothstep(s * 0.5, s * 0.5 + 0.5, uForm);
        f = f * f * (3.0 - 2.0 * f);
        vec2 p = mix(aFrom.xy * uRes, home + drift, f);

        vec2 dir = normalize(vec2(fract(s * 91.7) - 0.5, fract(s * 53.3) - 0.5) + 1e-4);
        p += (dir * (160.0 + 380.0 * s) + vec2(0.0, -220.0 * s)) * uOut * uOut;

        vec2 d = p - uPtr;
        float dist = length(d);
        float push = exp(-dist * dist / 9000.0) * uPtrAmt;
        p += (dist > 0.001 ? d / dist : vec2(0.0)) * push * 34.0;

        gl_Position = vec4(p.x / uRes.x * 2.0 - 1.0, 1.0 - p.y / uRes.y * 2.0, 0.0, 1.0);
        gl_PointSize = uSize * (0.75 + 0.5 * s) * (1.0 + push * 0.6);
        float twinkle = 0.78 + 0.22 * sin(t * (1.0 + s * 2.0) + s * 60.0);
        vA = uAlpha * mix(0.3, 1.0, f) * twinkle * (1.0 - uOut);
        vT = position.z;
        vHot = push;
      }
    `,
    fragmentShader: `
      uniform vec3 uColA;
      uniform vec3 uColB;
      uniform vec3 uColC;
      varying float vA;
      varying float vT;
      varying float vHot;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.3, d);
        vec3 col = vT < 0.5 ? mix(uColA, uColB, vT * 2.0) : mix(uColB, uColC, (vT - 0.5) * 2.0);
        col = mix(col, vec3(1.0), 0.22 + vHot * 0.5);
        gl_FragColor = vec4(col, a * vA);
      }
    `
  });
  const p = new THREE.Points(g, m);
  p.frustumCulled = false;
  p.renderOrder = 10;
  p.visible = false;
  scene.add(p);
  return { points: p, geo: g, mat: m, ver: -1 };
})();

/* rebuilt whenever script.js resamples the letters, on load and on resize */
function syncDots() {
  const hero = G.hero;
  if (!hero || !hero.pts || hero.ver === dots.ver) return;
  dots.ver = hero.ver;
  const n = hero.n;
  const from = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    from[i * 3] = -0.15 + Math.random() * 1.3;
    from[i * 3 + 1] = -0.2 + Math.random() * 1.4;
    from[i * 3 + 2] = Math.random();
  }
  dots.geo.dispose();
  dots.geo.setAttribute('position', new THREE.BufferAttribute(hero.pts, 3));
  dots.geo.setAttribute('aFrom', new THREE.BufferAttribute(from, 3));
  dots.mat.uniforms.uSize.value = clamp((hero.gap || 4) * 0.5, 1.5, 3) * PR;
}

/* ----------------------------------------------- backdrop --
   The cover, alive. A band of the gradient runs across the screen with its
   royal-blue stretch on the chapter's focus: sky blue to one side, purple fading
   to near-black on the other. Slow waves bend the band so it never sits
   still, and it is brightest near the focus, a dim wash everywhere else. */
const backdrop = (() => {
  const stops = COVER.map(([, hex]) => { const c = new THREE.Color(hex); return new THREE.Vector3(c.r, c.g, c.b); });
  const at = COVER.map(([t]) => t);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: {
      uTime: shared.uTime, uRes: { value: new THREE.Vector2(W, H) }, uI: { value: 0.6 },
      uC: { value: new THREE.Vector2(0.5, 0.5) },
      uStops: { value: stops }, uAt: { value: at },
      uBg: { value: COL_BG }
    },
    depthTest: false, depthWrite: false,
    vertexShader: `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = vec4(position.xy, 0.99999, 1.0); }
    `,
    fragmentShader: `
      uniform vec2 uRes;
      uniform float uTime;
      uniform float uI;
      uniform vec2 uC;
      uniform vec3 uStops[8];
      uniform float uAt[8];
      uniform vec3 uBg;
      varying vec2 vUv;
      float blob(vec2 p, vec2 c, float r) { vec2 d = p - c; return exp(-dot(d, d) / (r * r)); }
      vec3 cover(float t) {
        t = clamp(t, 0.0, 1.0);
        vec3 col = uStops[0];
        for (int i = 1; i < 8; i++) {
          col = mix(col, uStops[i], smoothstep(uAt[i - 1], uAt[i], t));
        }
        return col;
      }
      void main() {
        float ar = uRes.x / max(uRes.y, 1.0);
        vec2 p = vec2(vUv.x * ar, vUv.y);
        vec2 c = vec2(uC.x * ar, uC.y);
        vec2 drift = 0.07 * vec2(sin(uTime * 0.13), cos(uTime * 0.11));

        /* where along the cover this pixel sits: across the band, bent by waves */
        vec2 d = p - c - drift;
        float t = 0.4 + dot(d, vec2(0.94, -0.34)) * 0.58;
        t += 0.07 * sin(p.y * 2.6 + uTime * 0.19) + 0.05 * sin(p.x * 1.9 - uTime * 0.15);

        float near = blob(p, c + drift, 0.62);
        float wide = blob(p, c + vec2(0.35, -0.12) - drift, 1.25);
        float glow = blob(p, c + vec2(-0.42, 0.18) + drift * 1.4, 0.5);
        vec3 col = uBg;
        col += cover(t) * (near * 0.62 + wide * 0.3) * uI;
        col += cover(0.05) * glow * 0.16 * uI;
        gl_FragColor = vec4(col, 1.0);
      }
    `
  }));
  m.frustumCulled = false;
  m.renderOrder = -10;
  scene.add(m);
  return m;
})();

/* -------------------------------------------------- trail -- */
const TN = mobile ? 0 : 34;
const trail = (() => {
  if (!TN || reduced) return null;
  const g = new THREE.BufferGeometry();
  const p = new Float32Array(TN * 2 * 3), t = new Float32Array(TN * 2), side = new Float32Array(TN * 2);
  const idx = [];
  for (let i = 0; i < TN; i++) {
    t[i * 2] = t[i * 2 + 1] = i / (TN - 1);
    side[i * 2] = -1; side[i * 2 + 1] = 1;
    if (i < TN - 1) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
  }
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  g.setAttribute('aT', new THREE.BufferAttribute(t, 1));
  g.setAttribute('aSide', new THREE.BufferAttribute(side, 1));
  g.setIndex(idx);
  const m = new THREE.Mesh(g, new THREE.ShaderMaterial({
    uniforms: { uA: { value: COL_A }, uB: { value: COL_B }, uAmt: { value: 0 } },
    transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute float aT;
      attribute float aSide;
      varying float vT;
      varying float vS;
      void main() { vT = aT; vS = aSide; gl_Position = vec4(position.xy, 0.0, 1.0); }
    `,
    fragmentShader: `
      uniform vec3 uA;
      uniform vec3 uB;
      uniform float uAmt;
      varying float vT;
      varying float vS;
      void main() {
        float edge = smoothstep(0.0, 0.55, 1.0 - abs(vS));
        float a = pow(1.0 - vT, 2.0) * edge * uAmt;
        gl_FragColor = vec4(mix(uA, uB, vT) * a, a);
      }
    `
  }));
  m.frustumCulled = false;
  m.renderOrder = 20;
  scene.add(m);
  return { mesh: m, geo: g, pts: new Array(TN).fill(null).map(() => ({ x: 2, y: 2 })) };
})();

/* ---------------------------------------------- medallion -- */
const medallion = (() => {
  const group = new THREE.Group();
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: 0.06, transmission: 1, thickness: 0.85,
    ior: 1.48, clearcoat: 1, clearcoatRoughness: 0.06, iridescence: 0.45, iridescenceIOR: 1.32,
    attenuationColor: new THREE.Color('#6C8CF5'), attenuationDistance: 2.4,
    envMapIntensity: 1.15, transparent: true, opacity: 0
  });
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.12, 1.12, 0.22, 128, 1).rotateX(Math.PI / 2), glass);
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(1.12, 0.035, 18, 150),
    new THREE.MeshPhysicalMaterial({ color: 0xb8d6ff, metalness: 1, roughness: 0.16, envMapIntensity: 1.5, transparent: true, opacity: 0 })
  );
  group.add(disc); group.add(rim);
  group.visible = false;
  scene.add(group);
  return { group, glass, rim: rim.material };
})();

/* ------------------------------------------------ passes -- */
const composer = new EffectComposer(renderer);
composer.setPixelRatio(PR);
composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(W * (mobile ? 0.5 : 1), H * (mobile ? 0.5 : 1)), 0.85, 0.6, 0.14);
composer.addPass(bloom);
composer.addPass(new OutputPass());
const finish = new ShaderPass({
  uniforms: {
    tDiffuse: { value: null }, uTime: { value: 0 },
    uRes: { value: new THREE.Vector2(W, H) }, uPtr: { value: new THREE.Vector2(0.5, 0.5) }, uLens: { value: 0 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uLens;
    uniform vec2 uRes;
    uniform vec2 uPtr;
    varying vec2 vUv;
    void main() {
      vec2 uv = vUv;
      vec2 d = uv - uPtr;
      d.x *= uRes.x / max(uRes.y, 1.0);
      float lens = uLens * exp(-dot(d, d) * 34.0);
      uv -= (uv - uPtr) * lens * 0.1;
      vec3 c = texture2D(tDiffuse, uv).rgb;
      vec2 q = vUv - 0.5;
      c *= 1.0 - dot(q, q) * 0.5;
      float g = fract(sin(dot(vUv * uRes + uTime * 40.0, vec2(12.9898, 78.233))) * 43758.5453);
      c += (g - 0.5) * 0.03;
      gl_FragColor = vec4(c, 1.0);
    }
  `
});
composer.addPass(finish);

/* =======================================================
   State. Everything the scene can be is a handful of
   numbers; the film writes them from scroll position, the
   later chapters from their own presets, and the frame eases
   whatever it currently is toward them.
   ======================================================= */
const REF_Z = 6;
function worldPerPx(z) { return 2 * Math.tan(FOV * Math.PI / 360) * z / H; }

const S = {
  gx: 0, gy: 0, gs: 1, alpha: 0, morph: 0, flat: 0, camZ: REF_Z, roll: 0,
  dots: 0, bg: 0.55, bgx: 0.5, bgy: 0.45, bloom: 0.8, glass: 0, ptr: 0
};
const T = Object.assign({}, S);
const nodeGlow = new Float32Array(6).fill(1);
const nodeTarget = new Float32Array(6).fill(1);

/* bg is how much of the cover shows behind each chapter: rich, never so
   bright that the copy over it has to fight */
const PRESETS = {
  film: { alpha: 0, bg: 0.5, bgx: 0.5, bgy: 0.58, bloom: 0.22, glass: 0 },
  mail: { alpha: 0, bg: 0.5, bgx: 0.62, bgy: 0.5, bloom: 0.5, glass: 0 },
  strat: { alpha: 0, bg: 0.5, bgx: 0.74, bgy: 0.45, bloom: 0.55, glass: 0 },
  port: { alpha: 0, bg: 0.48, bgx: 0.3, bgy: 0.5, bloom: 0.55, glass: 0 },
  life: { alpha: 0.55, bg: 0.5, bgx: 0.26, bgy: 0.45, bloom: 0.6, glass: 0 },
  ops: { alpha: 0, bg: 0.44, bgx: 0.5, bgy: 0.4, bloom: 0.5, glass: 0 },
  wont: { alpha: 0, bg: 0.42, bgx: 0.5, bgy: 0.5, bloom: 0.5, glass: 0 },
  pilot: { alpha: 0, bg: 0.46, bgx: 0.35, bgy: 0.45, bloom: 0.5, glass: 0 },
  final: { alpha: 1, bg: 0.66, bgx: 0.74, bgy: 0.5, bloom: 0.8, glass: 1 }
};

function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function seg(p, a, b) { return clamp((p - a) / (b - a), 0, 1); }
function inOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
function lerp(a, b, t) { return a + (b - a) * t; }

function placeFromScreen(x, y, r, into) {
  const wpp = worldPerPx(REF_Z);
  into.gx = (x - W / 2) * wpp;
  into.gy = -(y - H / 2) * wpp;
  into.gs = Math.max(0.05, r * wpp);
}

function sceneTarget(name) {
  const s = PRESETS[name] || PRESETS.ops;
  T.morph = 0; T.flat = name === 'final' ? 1 : 0; T.camZ = REF_Z; T.roll = 0;
  T.alpha = s.alpha; T.bloom = s.bloom; T.glass = s.glass;
  T.bg = s.bg; T.bgx = s.bgx; T.bgy = s.bgy;

  const a = G.anchor;
  if (a && s.alpha > 0) placeFromScreen(a.x, a.y, a.r * (name === 'final' ? 0.68 : 0.9), T);
  else if (a) { T.bgx = clamp(a.x / W, 0, 1); T.bgy = clamp(1 - a.y / H, 0, 1); }

  for (let i = 0; i < 6; i++) {
    /* a step open beside the globe lights its node and dims the rest */
    nodeTarget[i] = name === 'life' && G.node >= 0 ? (i === G.node ? 1 : 0.18) : 1;
  }
}

/* ------------------------------------- the dots gathering --
   Once the loader reaches 100, or straight away when it does not run, the
   dots start gathering. The loader lifts part way through. */
function formState(now) {
  const L = G.loader, hero = G.hero;
  if (!hero || !hero.n) return 0;
  if (!hero.formAt && (!L.active || L.phase === 'form')) hero.formAt = now;
  if (!hero.formAt) return 0;
  const t = reduced ? 1 : clamp((now - hero.formAt) / (L.skip ? 900 : 2200), 0, 1);
  if (L.active && t > 0.55) L.formed = true;
  return t;
}

/* ------------------------------------------------- frames -- */
let time = 0, last = performance.now(), ready = false;

function step(dt, now) {
  syncDots();
  const form = formState(now);
  const name = G.scene.name;

  if (G.loader.active) {
    placeFromScreen(W / 2, H / 2, Math.min(W, H) * 0.2, T);
    T.morph = 0; T.flat = 0; T.camZ = REF_Z; T.glass = 0; T.roll = 0; T.alpha = 0;
    T.bg = 0.42; T.bgx = 0.5; T.bgy = 0.5; T.bloom = 0.6;
    for (let i = 0; i < 6; i++) nodeTarget[i] = 1;
  } else if (name === 'film' && !G.fx) {
    /* reduced motion: the lattice simply sits behind the hero */
    placeFromScreen(W * 0.5, H * 0.42, Math.min(W, H) * 0.26, T);
    T.morph = 0; T.flat = 0; T.camZ = REF_Z; T.alpha = 0.8;
    T.bg = 0.6; T.bgx = 0.5; T.bgy = 0.55; T.bloom = 0.7; T.glass = 0; T.roll = 0;
    for (let i = 0; i < 6; i++) nodeTarget[i] = 1;
  } else {
    sceneTarget(name);
  }

  const fast = 1 - Math.exp(-dt * 6);
  const slow = 1 - Math.exp(-dt * 3.4);
  S.gx = lerp(S.gx, T.gx, fast); S.gy = lerp(S.gy, T.gy, fast); S.gs = lerp(S.gs, T.gs, fast);
  S.camZ = lerp(S.camZ, T.camZ, fast); S.morph = lerp(S.morph, T.morph, fast);
  S.roll = lerp(S.roll, T.roll, fast);
  S.flat = lerp(S.flat, T.flat, slow); S.alpha = lerp(S.alpha, T.alpha, slow);
  S.glass = lerp(S.glass, T.glass, slow);
  S.dots = lerp(S.dots, G.hero && G.hero.n ? 1 : 0, slow);
  S.bg = lerp(S.bg, T.bg, slow); S.bgx = lerp(S.bgx, T.bgx, slow); S.bgy = lerp(S.bgy, T.bgy, slow);
  S.bloom = lerp(S.bloom, T.bloom, slow);

  const P = G.pointer;
  const wantPtr = (P.on && G.fine && !reduced) ? 1 : 0;
  S.ptr = lerp(S.ptr, wantPtr, 1 - Math.exp(-dt * 5));

  /* the globe, and the medallion that closes around it */
  globe.position.set(S.gx, S.gy, 0);
  globe.scale.setScalar(S.gs);
  const spin = reduced ? 0.6 : time * 0.16;
  const tiltX = reduced ? -0.22 : -0.22 + (P.on ? P.ny * 0.16 : 0);
  const tiltY = P.on && !reduced ? P.nx * 0.3 : 0;
  globe.rotation.set(
    tiltX * (1 - S.morph),
    lerp(spin + tiltY, Math.sin(time * 0.35) * 0.3 + tiltY, S.flat) * (1 - S.morph),
    S.roll
  );
  medallion.group.position.copy(globe.position);
  medallion.group.rotation.copy(globe.rotation);
  medallion.group.scale.setScalar(S.gs * (0.92 + 0.08 * S.glass));
  medallion.group.visible = S.glass > 0.02;
  medallion.glass.opacity = S.glass;
  medallion.rim.opacity = S.glass;

  camera.position.set(0, 0, S.camZ);
  camera.updateMatrixWorld();

  shared.uTime.value = time;
  shared.uMorph.value = S.morph;
  shared.uFlat.value = S.flat;
  shared.uAlpha.value = S.alpha;
  shared.uAspect.value = W / H;
  shared.uPtrAmt.value = S.ptr * (1 - S.glass * 0.7);
  shared.uPtr.value.set(P.on ? P.nx : 2, P.on ? P.ny : 2);

  const ng = nodeGeo.attributes.aGlow;
  let changed = false;
  for (let i = 0; i < 6; i++) {
    const v = lerp(ng.array[i], nodeTarget[i], slow);
    if (Math.abs(v - ng.array[i]) > 0.0005) { ng.array[i] = v; changed = true; }
  }
  if (changed) ng.needsUpdate = true;

  const hero = G.hero, du = dots.mat.uniforms;
  dots.points.visible = !!(hero && hero.n) && hero.out < 0.999 && S.dots > 0.002;
  if (dots.points.visible) {
    du.uOrigin.value.set(hero.left, hero.top);
    du.uForm.value = form;
    du.uOut.value = hero.out;
    du.uAlpha.value = S.dots * 0.9;
    du.uPtrAmt.value = S.ptr;
    du.uPtr.value.set(P.on ? P.x : -9999, P.on ? P.y : -9999);
  }

  backdrop.material.uniforms.uI.value = S.bg;
  backdrop.material.uniforms.uC.value.set(S.bgx, S.bgy);
  bloom.strength = S.bloom;

  finish.uniforms.uTime.value = time;
  finish.uniforms.uLens.value = S.ptr * 0.5;
  finish.uniforms.uPtr.value.set(P.on ? P.x / W : 0.5, P.on ? 1 - P.y / H : 0.5);

  if (trail) updateTrail(dt);
}

function updateTrail(dt) {
  const P = G.pointer;
  const pts = trail.pts;
  const head = pts[0];
  if (P.on) {
    if (head.x > 1.5) { for (let i = 0; i < pts.length; i++) { pts[i].x = P.nx; pts[i].y = P.ny; } }
    head.x = lerp(head.x, P.nx, 0.42); head.y = lerp(head.y, P.ny, 0.42);
    for (let i = 1; i < pts.length; i++) {
      pts[i].x = lerp(pts[i].x, pts[i - 1].x, 0.4);
      pts[i].y = lerp(pts[i].y, pts[i - 1].y, 0.4);
    }
  }
  const amt = trail.mesh.material.uniforms.uAmt;
  amt.value = lerp(amt.value, P.on ? 0.34 : 0, 1 - Math.exp(-dt * 6));
  if (amt.value < 0.004) { trail.mesh.visible = false; return; }
  trail.mesh.visible = true;

  const ar = W / H;
  const arr = trail.geo.attributes.position.array;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let dx = (b.x - a.x) * ar, dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len; dy /= len;
    const w = 0.02 * Math.pow(1 - i / pts.length, 0.8);
    const nx = -dy * w / ar, ny = dx * w;
    arr[i * 6] = pts[i].x - nx; arr[i * 6 + 1] = pts[i].y - ny; arr[i * 6 + 2] = 0;
    arr[i * 6 + 3] = pts[i].x + nx; arr[i * 6 + 4] = pts[i].y + ny; arr[i * 6 + 5] = 0;
  }
  trail.geo.attributes.position.needsUpdate = true;
}

function resize() {
  W = window.innerWidth; H = window.innerHeight;
  renderer.setSize(W, H, false);
  composer.setSize(W, H);
  bloom.resolution.set(W * (mobile ? 0.5 : 1), H * (mobile ? 0.5 : 1));
  camera.aspect = W / H;
  camera.updateProjectionMatrix();
  backdrop.material.uniforms.uRes.value.set(W, H);
  dots.mat.uniforms.uRes.value.set(W, H);
  finish.uniforms.uRes.value.set(W, H);
  shared.uAspect.value = W / H;
}
window.addEventListener('resize', resize, { passive: true });

/* On phones the middle chapters only hold a quiet backdrop, so they draw
   every other frame. The dotted wordmark and the medallion keep every frame. */
let halve = false;
function tick(now) {
  const quiet = G.scene.name !== 'film' && G.scene.name !== 'final';
  if (mobile && ready && !G.loader.active && quiet && (halve = !halve)) {
    requestAnimationFrame(tick);
    return;
  }
  const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
  last = now;
  if (!reduced) time += dt;
  step(dt, now);
  composer.render();
  if (!ready) { ready = true; G.sceneReady(); }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
