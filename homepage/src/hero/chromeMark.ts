// The solid Growency mark: three extruded, bevelled facets. It is revealed
// behind a reflection sweep and stays metallic through the final zoom.
// A soft silver-grey halo blooms on hover / focus / tap.
import * as THREE from 'three';
import { MARK_ASPECT, MARK_FACETS_UNIT } from '../brand/mark';
import { NOISE, SWEEP } from './glsl';

/**
 * Colour the chrome surface settles to as the camera pushes into it. White
 * matches the page, so the zoom passes through the mark into what follows.
 */
export const ZOOM_FILL = '#ffffff';

const DEPTH = 0.075; // in mark heights
const BEVEL_T = 0.016;
const BEVEL_S = 0.0105;

export class ChromeMark {
  readonly group = new THREE.Group(); // depth-scaled container
  readonly root = new THREE.Group(); // added to the logo group
  readonly u = {
    uSweep: { value: -1 },
    uGlint: { value: -1 },
    uWhite: { value: 0 },
    uHover: { value: 0 },
    uFill: { value: 0 },
    uFillCol: { value: new THREE.Color(ZOOM_FILL) },
    uAspect: { value: MARK_ASPECT },
  };
  private halo: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  private material: THREE.MeshPhysicalMaterial;
  private envRT: THREE.WebGLRenderTarget;

  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene) {
    const pmrem = new THREE.PMREMGenerator(renderer);
    this.envRT = pmrem.fromScene(studioEnvironment(), 0.02);
    scene.environment = this.envRT.texture;
    pmrem.dispose();

    this.material = new THREE.MeshPhysicalMaterial({
      color: 0xf4f5f7,
      metalness: 1,
      roughness: 0.055,
      envMapIntensity: 1.15,
    });
    this.material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, this.u);
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vMarkPos;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvMarkPos = position;');
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
          varying vec3 vMarkPos;
          uniform float uSweep, uGlint, uWhite, uHover, uFill;
          uniform vec3 uFillCol;
          ${NOISE}
          ${SWEEP}`,
        )
        .replace(
          '#include <clipping_planes_fragment>',
          `#include <clipping_planes_fragment>
          vec2 mp = vMarkPos.xy;
          float sC = sweepCoord(mp) + (vnoise(mp * 38.0) - 0.5) * 0.05 + (vnoise(mp * 9.0) - 0.5) * 0.04;
          if (sC > uSweep + 0.012) discard;`,
        )
        .replace(
          '#include <dithering_fragment>',
          `#include <dithering_fragment>
          // silver reflection riding just behind the reveal edge, then a late glint
          float chromeAmt = 1.0 - uWhite;
          float sClean = sweepCoord(mp);
          float band = exp(-pow((sClean - (uSweep - 0.05)) / 0.04, 2.0));
          float glint = exp(-pow((sClean - uGlint) / 0.045, 2.0));
          gl_FragColor.rgb += (band * 0.55 + glint * 0.35) * chromeAmt;
          // white-on-white: flat face, faint bevel edge; hover sharpens the edge
          float facing = clamp(normal.z, 0.0, 1.0);
          float edge = 1.0 - smoothstep(0.80, 0.995, facing);
          float edgeShade = mix(0.07, 0.26, uHover);
          vec3 whiteCol = vec3(1.0) - edge * edgeShade * vec3(1.0, 0.99, 0.975);
          gl_FragColor.rgb = mix(gl_FragColor.rgb, whiteCol, uWhite);
          // final zoom: the surface flattens to one constant colour (no stretched reflections)
          gl_FragColor.rgb = mix(gl_FragColor.rgb, linearToOutputTexel(vec4(uFillCol, 1.0)).rgb, uFill);`,
        );
    };

    for (const facet of MARK_FACETS_UNIT) {
      const shape = new THREE.Shape(facet.map(([x, y]) => new THREE.Vector2(x, y)));
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: DEPTH,
        bevelEnabled: true,
        bevelThickness: BEVEL_T,
        bevelSize: BEVEL_S,
        bevelOffset: -BEVEL_S,
        bevelSegments: 4,
      });
      geo.translate(0, 0, -(DEPTH + BEVEL_T));
      this.group.add(new THREE.Mesh(geo, this.material));
    }

    this.halo = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: haloTexture(), transparent: true, depthWrite: false, opacity: 0, toneMapped: false }),
    );
    this.halo.position.z = -(DEPTH + BEVEL_T * 2) - 0.02;
    this.halo.renderOrder = -1;

    this.root.add(this.halo, this.group);
    this.root.visible = false;
  }

  /**
   * @param sweep reveal edge position (−0.2 hidden … 1.2 fully revealed)
   * @param depth 0..1 extrusion depth
   * @param white 0..1 chrome → flat white
   * @param hover 0..1 halo bloom
   */
  /** 0..1: how far the surface has flattened to ZOOM_FILL during the final zoom. */
  setFill(amount: number) {
    this.u.uFill.value = amount;
  }

  update(sweep: number, glint: number, depth: number, white: number, hover: number) {
    this.u.uSweep.value = sweep;
    this.u.uGlint.value = glint;
    this.u.uWhite.value = white;
    this.u.uHover.value = hover;
    this.root.visible = sweep > -0.15;
    this.group.scale.z = Math.max(0.02, depth);
    const h = hover * 0.35;
    this.material.roughness = 0.055 - hover * 0.02;
    this.halo.visible = h > 0.001;
    this.halo.material.opacity = h;
    const s = 1 + 0.06 * h;
    this.halo.scale.set(HALO_W * s, HALO_H * s, 1);
  }

  dispose() {
    this.envRT.dispose();
  }
}

// Halo: the facet silhouettes, heavily blurred, in silver-grey. Drawn with a
// shadow offset trick so it works where canvas `filter` isn't supported.
const HALO_PAD = 0.45; // extra size around the mark, in mark heights
const HALO_W = MARK_ASPECT + HALO_PAD * 2;
const HALO_H = 1 + HALO_PAD * 2;
function haloTexture() {
  const px = 512;
  const W = Math.round(px * HALO_W);
  const H = Math.round(px * HALO_H);
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  const off = W * 3;
  const draw = (blur: number, color: string) => {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = blur;
    ctx.shadowOffsetX = off;
    ctx.translate(W / 2 - off, H / 2);
    ctx.scale(px, -px);
    for (const f of MARK_FACETS_UNIT) {
      ctx.beginPath();
      f.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  };
  draw(px * 0.22, 'rgba(150,155,164,0.55)'); // wide soft falloff
  draw(px * 0.07, 'rgba(160,165,173,0.75)'); // tighter core right behind the facets
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Studio environment for chrome on a white page: bright sky, a crisp dark
 * horizon band (the classic chrome contrast line), a soft grey floor, and two
 * softboxes for highlights on the bevels.
 */
function studioEnvironment() {
  const env = new THREE.Scene();
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(50, 64, 32),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      vertexShader: /* glsl */ `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: /* glsl */ `
        varying vec3 vDir;
        void main(){
          float y = vDir.y;
          vec3 skyCol = mix(vec3(0.86, 0.875, 0.9), vec3(1.0), smoothstep(0.04, 0.55, y));
          vec3 floorCol = mix(vec3(0.42, 0.44, 0.48), vec3(0.78, 0.8, 0.83), smoothstep(-0.05, -0.6, y));
          vec3 col = y > 0.0 ? skyCol : floorCol;
          // dark horizon band, slightly above the equator
          float band = exp(-pow((y - 0.01) / 0.06, 2.0));
          col = mix(col, vec3(0.14, 0.15, 0.17), band * 0.95);
          float band2 = exp(-pow((y + 0.24) / 0.05, 2.0));
          col = mix(col, vec3(0.3, 0.31, 0.34), band2 * 0.7);
          // gentle side-to-side variation so tilting reads
          col *= 0.9 + 0.1 * (vDir.x * 0.5 + 0.5);
          gl_FragColor = vec4(col, 1.0);
        }`,
    }),
  );
  env.add(sky);
  const box = (w: number, h: number, pos: [number, number, number], intensity: number) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(intensity, intensity, intensity), side: THREE.DoubleSide }));
    m.position.set(...pos);
    m.lookAt(0, 0, 0);
    env.add(m);
  };
  box(18, 6, [-14, 16, 18], 3.2);
  box(8, 22, [22, 4, 8], 2.4);
  return env;
}
