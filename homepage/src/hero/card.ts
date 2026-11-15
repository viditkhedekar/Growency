// One campaign card: a plane with a shader that handles cover-fit, rounded
// corners, depth "clarity", clipping to its facet of the mark, and dissolving
// into chrome behind the reflection sweep.
import * as THREE from 'three';
import { MARK_FACETS_UNIT } from '../brand/mark';
import { MAX_POLY, NOISE, SD_POLY, SWEEP } from './glsl';
import type { Tile } from './tiles';

const GEO = new THREE.PlaneGeometry(1, 1);

const vertexShader = /* glsl */ `
uniform mat4 uLogoInv;
varying vec2 vUv;
varying vec2 vMark;
void main() {
  vUv = uv;
  vec4 world = modelMatrix * vec4(position, 1.0);
  vMark = (uLogoInv * world).xy;
  gl_Position = projectionMatrix * viewMatrix * world;
}`;

const BLOB_R = 0.105; // play blob radius, in card heights

const fragmentShader = /* glsl */ `
${NOISE}
${SWEEP}
${SD_POLY}
uniform sampler2D map;
uniform float uHasMap, uTexAspect, uPlaneAspect, uRadius;
uniform float uFront, uClip, uSweep, uChrome, uOpacity;
uniform float uPlay, uHov, uTime;
uniform vec2 uPtr, uBlobC;
uniform vec3 uFallback;
varying vec2 vUv;
varying vec2 vMark;

#define BLOB_R ${BLOB_R.toFixed(4)}

vec3 sampleCard(vec2 v) {
  vec2 uv = v - 0.5;
  float r = uPlaneAspect / uTexAspect;
  if (r > 1.0) uv.y /= r; else uv.x *= r;
  uv += 0.5;
  if (!gl_FrontFacing) uv.x = 1.0 - uv.x;
  return uHasMap > 0.5 ? texture2D(map, uv).rgb : uFallback;
}

float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

// Liquid play blob: a wobbling disc that swells on hover and pulls a droplet toward the cursor.
float sdBlob(vec2 p) {
  vec2 d = p - uBlobC;
  float ang = atan(d.y, d.x);
  float wob = 0.035 * sin(ang * 3.0 + uTime * 1.7) + 0.025 * sin(ang * 5.0 - uTime * 2.3 + 1.3);
  float r = BLOB_R * (1.0 + wob * (0.6 + uHov) + 0.14 * uHov);
  float body = length(d) - r;
  vec2 toP = uPtr - uBlobC;
  float L = max(length(toP), 1e-4);
  vec2 sat = uBlobC + toP / L * min(L, BLOB_R * 1.9) * 0.9;
  float drop = length(p - sat) - BLOB_R * 0.42 * uHov + (1.0 - uHov) * 0.25;
  return smin(body, drop, 0.07);
}

// Equilateral triangle pointing right (after Inigo Quilez).
float sdTri(vec2 p, float r) {
  p = vec2(-p.y, p.x);
  const float k = 1.7320508;
  p.x = abs(p.x) - r;
  p.y = p.y + r / k;
  if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
  p.x -= clamp(p.x, -2.0 * r, 0.0);
  return -length(p) * sign(p.y);
}

void main() {
  vec3 col = sampleCard(vUv);

  // rounded card corners (in units of card height)
  vec2 q = abs(vUv - 0.5) * vec2(uPlaneAspect, 1.0);
  vec2 hb = vec2(0.5 * uPlaneAspect, 0.5) - uRadius;
  float rd = length(max(q - hb, 0.0)) - uRadius;
  float raa = max(fwidth(rd), 1e-4);
  float cardMask = 1.0 - smoothstep(-raa, raa, rd);

  // frosted liquid-glass play button (video cards, front faces only)
  if (uPlay > 0.001 && gl_FrontFacing) {
    vec2 p = (vUv - 0.5) * vec2(uPlaneAspect, 1.0);
    float bd = sdBlob(p);
    float px = max(fwidth(bd), 1e-4);
    float outside = smoothstep(-px, px, bd);
    float sh = sdBlob(p + vec2(0.0, 0.02));
    col *= 1.0 - 0.2 * uPlay * outside * (1.0 - smoothstep(-0.02, 0.06, sh));
    float inside = (1.0 - outside) * uPlay;
    if (inside > 0.0) {
      vec2 e = vec2(0.0015, 0.0);
      vec2 n = normalize(vec2(sdBlob(p + e.xy) - sdBlob(p - e.xy), sdBlob(p + e.yx) - sdBlob(p - e.yx)) + 1e-6);
      float rim = 1.0 - clamp(-bd / 0.05, 0.0, 1.0);
      vec2 toUv = vec2(1.0 / uPlaneAspect, 1.0);
      vec2 base = vUv - n * rim * rim * 0.05 * toUv; // lens bends the footage at the rim
      vec3 g = sampleCard(base) * 2.0;
      for (int i = 0; i < 8; i++) {
        float a = float(i) * 0.7853982 + 0.3;
        g += sampleCard(base + vec2(cos(a), sin(a)) * 0.02 * toUv);
      }
      g /= 10.0;
      g = mix(g, vec3(1.0), 0.3) * 1.04; // frost
      float light = dot(n, normalize(vec2(-0.55, 0.85)));
      g += rim * rim * (0.4 * max(light, 0.0) - 0.12 * max(-light, 0.0));
      g += (1.0 - smoothstep(0.0, 0.01, abs(bd))) * 0.3;
      vec2 hl = uBlobC + vec2(-0.045, 0.052) * (1.0 + 0.14 * uHov);
      g += exp(-dot(p - hl, p - hl) / 0.0005) * 0.4;
      float tri = sdTri(p - uBlobC - vec2(0.009, 0.0), 0.038 * (1.0 + 0.1 * uHov)) - 0.006;
      float triM = 1.0 - smoothstep(-px, px, tri);
      g *= 1.0 - 0.12 * (1.0 - smoothstep(0.0, 0.025, tri)) * (1.0 - triM);
      g = mix(g, vec3(1.0), triM * 0.96);
      col = mix(col, clamp(g, 0.0, 1.0), inside);
    }
  }

  // clip to this card's facet: the facet boundary closes in around the card as
  // it arrives (uClip 0 → 1), then the card's own rounded edge gives way.
  float open = 1.0 - uClip;
  float d = sdPoly(vMark) - open * open * 3.0;
  float aa = max(fwidth(d), 1e-4);
  float facetMask = 1.0 - smoothstep(-aa, aa, d);
  // Orbit cards must remain whole: facet-space bounds only become relevant
  // as they arrive at the assembled logo.
  float a = mix(cardMask, facetMask, uClip);

  // depth clarity: back of the orbit fades toward the white page
  col = mix(vec3(1.0), col, mix(0.36, 1.0, uFront));

  // reflection sweep: footage dissolves into the chrome behind it
  float s = sweepCoord(vMark) + (vnoise(vMark * 38.0) - 0.5) * 0.05 + (vnoise(vMark * 9.0) - 0.5) * 0.04;
  float keep = smoothstep(uSweep - 0.012, uSweep + 0.012, s);
  float sheen = exp(-pow((s - uSweep - 0.02) / 0.035, 2.0));
  col = mix(col, vec3(0.94, 0.95, 0.965), clamp(sheen, 0.0, 1.0) * 0.85 * uChrome);

  // Before assembly, orbit coordinates extend outside the mark. Applying
  // its reflection mask there would erase whole cards on the left.
  a *= mix(1.0, keep, uChrome) * uOpacity;
  if (a < 0.004) discard;
  gl_FragColor = vec4(col, a);
}`;

export class Card {
  readonly mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  readonly u;

  constructor(
    readonly index: number,
    public tile: Tile,
    readonly hasVideo: boolean,
  ) {
    const poly = Array.from({ length: MAX_POLY }, () => new THREE.Vector2());
    this.u = {
      map: { value: null as THREE.Texture | null },
      uHasMap: { value: 0 },
      uTexAspect: { value: 0.8 },
      uPlaneAspect: { value: 0.8 },
      uRadius: { value: 0.045 },
      uFront: { value: 1 },
      uClip: { value: 0 },
      uSweep: { value: -1 },
      uChrome: { value: 0 },
      uOpacity: { value: 1 },
      uFallback: { value: new THREE.Vector3(0.93, 0.935, 0.945) },
      uLogoInv: { value: new THREE.Matrix4() },
      uAspect: { value: 1 },
      uPoly: { value: poly },
      uPolyN: { value: 0 },
      uPlay: { value: 0 },
      uHov: { value: 0 },
      uTime: { value: 0 },
      uPtr: { value: new THREE.Vector2(0, -2) },
      uBlobC: { value: new THREE.Vector2() },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.u,
      vertexShader,
      fragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: true,
    });
    this.mesh = new THREE.Mesh(GEO, mat);
    this.mesh.matrixAutoUpdate = true;
    this.setTile(tile);
  }

  /** Point this card at a tile (and its facet's clip polygon). */
  setTile(tile: Tile) {
    this.tile = tile;
    const f = MARK_FACETS_UNIT[tile.facet];
    f.forEach(([x, y], i) => this.u.uPoly.value[i].set(x, y));
    this.u.uPolyN.value = f.length;
  }

  setTexture(tex: THREE.Texture | null, aspect: number) {
    if (this.u.map.value === tex) return;
    this.u.map.value = tex;
    this.u.uHasMap.value = tex ? 1 : 0;
    this.u.uTexAspect.value = aspect;
  }
}
