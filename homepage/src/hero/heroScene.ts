// Orchestrates the hero: ring of campaign cards (with a tagline inside the
// orbit), wordmark disintegration, assembly into the mark, chrome reveal, and
// the metallic rotation and immersive final zoom.
import * as THREE from 'three';
import gsap from 'gsap';
import { MARK_ASPECT, MARK_FACETS_UNIT } from '../brand/mark';
import type { Campaign } from '../content/campaigns';
import { Card } from './card';
import { CampaignViewer, type CardBounds } from './campaignViewer';
import { ChromeMark } from './chromeMark';
import { PosterLoader, VideoPool } from './media';
import { RingText } from './ringText';
import { Portal } from './portal';
import { assignTiles, type Tile } from './tiles';
import { clamp01, easeInOut, easeOut, lerp, T, phases, seg, smooth, type Phases } from './timeline';
import { WordmarkFx } from './wordmarkFx';

const FOV = 30;
const CAM_Z = 20;
const BASE_DRIFT = 0.1; // rad/s at rest
const TAU = Math.PI * 2;
const INTRO_MS = 2600; // carousel arrival + tagline reveal on load

interface Els {
  hero: HTMLElement;
  stage: HTMLElement;
  canvas: HTMLCanvasElement;
  wordmark: HTMLElement;
  markHit: HTMLButtonElement;
  hint: HTMLElement | null;
}

interface Layout {
  w: number;
  h: number;
  small: boolean;
  visW: number;
  visH: number;
  ringCenter: THREE.Vector3;
  ringR: number;
  cardW: number;
  cardH: number;
  frontMin: number;
  frontMax: number;
  tilt0: number;
  logoCenter: THREE.Vector3;
  logoH: number;
}

/** Per-card state for the reactive play blob. */
interface BlobState {
  hov: number;
  ptr: THREE.Vector2;
}

const _m = new THREE.Matrix4();
const _m2 = new THREE.Matrix4();
const _p0 = new THREE.Vector3();
const _p1 = new THREE.Vector3();
const _s0 = new THREE.Vector3();
const _s1 = new THREE.Vector3();
const _q0 = new THREE.Quaternion();
const _q1 = new THREE.Quaternion();
const _e = new THREE.Euler();
const _v = new THREE.Vector3();
const _c = new THREE.Vector3();
const _v2 = new THREE.Vector2();
const ONE = new THREE.Vector3(1, 1, 1);

export class HeroScene {
  private viewer = new CampaignViewer();
  private cardPress: { index: number; x: number; y: number; pointerId: number } | null = null;
  private keyboardCard = 0;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
  private ui = new THREE.Scene();
  private uiCam = new THREE.OrthographicCamera(0, 1, 0, -1, -10, 10);
  private logo = new THREE.Group();
  private cards: Card[];
  private tiles: Tile[];
  /** Order in which cards leave the ring (their angular order), frozen once the flight starts. */
  private leaveRank: number[] = [];
  private blobs: BlobState[];
  private chrome: ChromeMark;
  private portal!: Portal;
  private tagline = new RingText();
  private word = new WordmarkFx();
  private posters: PosterLoader;
  private videos: VideoPool;
  private L!: Layout;

  private target = 0; // scroll progress from ScrollTrigger
  private p = 0; // smoothed progress actually rendered
  private spin = 0;
  private spinVel = 0;
  private dragging = false;
  private lastX = 0;
  private lastY = 0;
  private lastT = 0;
  private hover = { v: 0 };
  private hoverLocked = false;
  private visible = true;
  private raf = 0;
  private prevTime = 0;
  private videoTick = 0;
  private startTime = performance.now();
  private time = 0;

  // pointer for the play blobs
  private raycaster = new THREE.Raycaster();
  private ndc = new THREE.Vector2();
  private pointerIn = false;

  // grab-and-rotate for the finished mark
  private markActive = false;
  /** 1 while the whole mark is on screen, easing to 0 as the zoom starts cropping it. */
  private markFit = 1;
  private markBox = { x0: 0, y0: 0, x1: 0, y1: 0 };
  private logoDragging = false;
  private logoMoved = 0;
  private rotX = 0;
  private rotY = 0;
  private rotVelX = 0;
  private rotVelY = 0;
  private grab = { v: 0 };

  constructor(
    private els: Els,
    private campaigns: Campaign[],
  ) {
    this.renderer = new THREE.WebGLRenderer({ canvas: els.canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setClearColor(0xffffff, 1);
    this.renderer.autoClear = false;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.camera.position.set(0, 0, CAM_Z);

    this.tiles = assignTiles(campaigns);
    this.cards = campaigns.map((c, i) => new Card(i, this.tiles[i], !!c.video));
    this.leaveRank = this.cards.map((_, i) => i);
    this.blobs = this.cards.map(() => ({ hov: 0, ptr: new THREE.Vector2(0, -1) }));
    for (const c of this.cards) this.scene.add(c.mesh);
    this.scene.add(this.tagline.mesh);

    this.chrome = new ChromeMark(this.renderer, this.scene);
    this.logo.add(this.chrome.root);
    // Window in the middle facet that the final zoom flies through.
    this.portal = new Portal(document.querySelector<HTMLVideoElement>('[data-reel-video]'));
    this.logo.add(this.portal.mesh);
    this.scene.add(this.logo);
    this.ui.add(this.word.group);

    this.posters = new PosterLoader(campaigns, Math.min(8, this.renderer.capabilities.getMaxAnisotropy()));
    this.videos = new VideoPool(campaigns, 3);

    this.resize();
    // Load the cards at the front of the ring first, then the rest.
    const order = this.cards
      .map((c) => ({ i: c.index, f: Math.cos(this.angleOf(c.index)) }))
      .sort((a, b) => b.f - a.f)
      .map((o) => o.i);
    this.posters.request(order);

    this.bindInput();
    new ResizeObserver(() => this.resize()).observe(els.stage);
    new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting;
      if (!this.visible) this.videos.pauseAll();
    }).observe(els.hero);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.videos.pauseAll();
    });

    els.hero.classList.add('is-gl');
    this.prevTime = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  setProgress(p: number) {
    this.target = p;
  }

  /** Jump straight to the current scroll progress and skip the intro (review tooling). */
  snap() {
    this.p = this.target;
    this.startTime = -1e6;
  }

  // ── Layout ─────────────────────────────────────────────
  private resize = () => {
    const { stage, wordmark } = this.els;
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.portal?.setResolution(w * dpr, h * dpr);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.uiCam.right = w;
    this.uiCam.bottom = -h;
    this.uiCam.updateProjectionMatrix();

    const visH = 2 * CAM_Z * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    const visW = visH * (w / h);
    const pxToW = visH / h;
    const small = w < 700;

    const sr = stage.getBoundingClientRect();
    const svg = wordmark.querySelector('svg')!;
    const wr = svg.getBoundingClientRect();
    const rect = { x: wr.left - sr.left, y: wr.top - sr.top, w: wr.width, h: wr.height };
    this.word.layout(rect, dpr, small);

    // Ring sits in the space under the wordmark.
    const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 64;
    const zoneTop = rect.y + rect.h + (small ? 12 : 8);
    const zoneBottom = h - (small ? 64 : 56);
    const zoneH = Math.max(120, zoneBottom - zoneTop);
    const cardRatio = small ? 0.27 : 0.245; // card width relative to radius (lower = more space between cards)
    const frontMax = small ? 1.16 : 1.22;
    const tilt0 = small ? 0.42 : 0.3; // how much of the ring's face we see
    // Fit by width (ring diameter + a front card) and by height (tilted ellipse + card).
    const rByW = (visW * (small ? 1.12 : 0.9)) / (2 + cardRatio * 0.7); // phones: ring spills past the edges
    const rByH = (zoneH * pxToW) / (2 * Math.sin(tilt0) + cardRatio * 1.25 * frontMax + 0.24);
    const ringR = Math.min(rByW, rByH, 7.8);
    const cardW = ringR * cardRatio;
    const zoneMid = (zoneTop + zoneBottom) / 2;
    const ringCenter = new THREE.Vector3(0, (h / 2 - zoneMid) * pxToW + ringR * 0.19, 0);

    // The assembled mark: as large as the viewport allows under the nav.
    const logoH = Math.min(visH * (small ? 0.46 : 0.62), (visW * (small ? 0.8 : 0.7)) / MARK_ASPECT);
    const logoMidPx = (navH + h) / 2;
    const logoCenter = new THREE.Vector3(0, (h / 2 - logoMidPx) * pxToW, 0);

    this.L = { w, h, small, visW, visH, ringCenter, ringR, cardW, cardH: cardW * 1.25, frontMin: small ? 0.7 : 0.74, frontMax, tilt0, logoCenter, logoH };

    // Keep the tagline in the clear centre of the raised orbit. It renders
    // above the cards as a final safeguard during the opening transition.
    this.tagline.place(
      _c.copy(ringCenter),
      Math.min(ringR * (small ? 1.25 : 1.12), visW * 0.86),
    );

    // Fragments drift toward the top of the orbit.
    const top = this.worldToPx(_v.set(ringCenter.x, ringCenter.y + ringR * Math.sin(tilt0), -ringR * Math.cos(tilt0)));
    this.word.setTarget(top.x, top.y);
  };

  private worldToPx(v: THREE.Vector3) {
    const p = v.clone().project(this.camera);
    return { x: (p.x * 0.5 + 0.5) * this.L.w, y: (-p.y * 0.5 + 0.5) * this.L.h };
  }

  // ── Input ──────────────────────────────────────────────
  private bindInput() {
    const { stage, markHit, hero, canvas } = this.els;
    canvas.tabIndex = 0;
    canvas.setAttribute('aria-label', 'Campaign carousel. Use left and right arrow keys to choose a campaign, then Enter to preview. Drag to spin.');
    canvas.addEventListener('keydown', e => {
      if (phases(this.p).fly > 0.02 || this.viewer.active) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        this.keyboardCard = (this.keyboardCard + (e.key === 'ArrowRight' ? 1 : -1) + this.cards.length) % this.cards.length;
        this.spin = -this.keyboardCard / this.cards.length * TAU;
        this.spinVel = 0;
        canvas.setAttribute('aria-label', `${this.campaigns[this.keyboardCard].title}. Press Enter to preview; arrow keys choose another campaign.`);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.openCampaign(this.keyboardCard);
      }
    });
    const setNdc = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      this.ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    };

    stage.addEventListener('pointerdown', (e) => {
      if (e.button > 0 || this.viewer.active) return;
      this.cardPress = null;
      setNdc(e);
      this.pointerIn = true;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.lastT = performance.now();
      // Finished mark: grab to rotate.
      if (this.markActive && e.target === markHit) {
        e.preventDefault();
        markHit.setPointerCapture(e.pointerId);
        this.logoDragging = true;
        this.logoMoved = 0;
        this.rotVelX = this.rotVelY = 0;
        hero.classList.add('is-dragging');
        gsap.to(this.grab, { v: 1, duration: 0.45, ease: 'power2.out', overwrite: true });
        return;
      }
      // Ring: drag to spin.
      if (phases(this.p).fly > 0.02) return;
      if ((e.target as HTMLElement).closest('a,button')) return;
      this.raycaster.setFromCamera(this.ndc, this.camera);
      const hit = this.raycaster.intersectObjects(this.cards.map(c => c.mesh), false)[0];
      const card = hit && this.cards.find(c => c.mesh === hit.object);
      if (card) this.cardPress = { index: card.index, x: e.clientX, y: e.clientY, pointerId: e.pointerId };
      this.dragging = true;
      this.spinVel = 0;
      hero.classList.add('is-dragging');
    });
    stage.addEventListener('pointermove', (e) => {
      setNdc(e);
      this.pointerIn = true;
    });
    stage.addEventListener('pointerleave', () => (this.pointerIn = false));

    window.addEventListener('pointermove', (e) => {
      if (this.cardPress && Math.hypot(e.clientX - this.cardPress.x, e.clientY - this.cardPress.y) > 9) this.cardPress = null;
      if (!this.dragging && !this.logoDragging) return;
      const now = performance.now();
      const dx = e.clientX - this.lastX;
      const dy = e.clientY - this.lastY;
      const dt = Math.max(1, now - this.lastT) / 1000;
      if (this.dragging) {
        const k = (TAU / Math.max(600, this.L.w)) * 0.9;
        this.spin += dx * k;
        this.spinVel = lerp(this.spinVel, (dx * k) / dt, 0.4);
      } else {
        const k = (TAU / Math.max(500, this.L.w)) * 1.3;
        this.logoMoved += Math.abs(dx) + Math.abs(dy);
        this.rotY += dx * k;
        this.rotX = THREE.MathUtils.clamp(this.rotX + dy * k, -1.1, 1.1);
        this.rotVelY = lerp(this.rotVelY, (dx * k) / dt, 0.4);
        this.rotVelX = lerp(this.rotVelX, (dy * k) / dt, 0.4);
      }
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.lastT = now;
    });
    const end = (event: PointerEvent) => {
      const pressed = this.cardPress;
      this.cardPress = null;
      const held = performance.now() - this.lastT > 90; // released after holding still
      if (this.dragging) {
        this.dragging = false;
        if (held) this.spinVel = 0;
        this.spinVel = THREE.MathUtils.clamp(this.spinVel, -6, 6);
      }
      if (this.logoDragging) {
        this.logoDragging = false;
        if (held) this.rotVelX = this.rotVelY = 0;
        this.rotVelY = THREE.MathUtils.clamp(this.rotVelY, -14, 14);
        this.rotVelX = THREE.MathUtils.clamp(this.rotVelX, -8, 8);
        gsap.to(this.grab, { v: 0, duration: 1.1, delay: 0.5, ease: 'power2.inOut', overwrite: true });
      }
      hero.classList.remove('is-dragging');
      if (pressed && event.type === 'pointerup' && event.pointerId === pressed.pointerId && Math.hypot(event.clientX - pressed.x, event.clientY - pressed.y) <= 9 && phases(this.p).fly < .02) {
        this.spinVel = 0;
        canvas.focus({ preventScroll: true });
        this.openCampaign(pressed.index);
      }
    };
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);

    const to = (v: number) => gsap.to(this.hover, { v, duration: v ? 0.7 : 0.9, ease: v ? 'power2.out' : 'power2.inOut', overwrite: true });
    markHit.addEventListener('pointerenter', (e) => e.pointerType !== 'touch' && !this.hoverLocked && to(1));
    markHit.addEventListener('pointerleave', (e) => e.pointerType !== 'touch' && !this.hoverLocked && !this.logoDragging && to(0));
    markHit.addEventListener('focus', () => to(1));
    markHit.addEventListener('blur', () => {
      this.hoverLocked = false;
      markHit.setAttribute('aria-pressed', 'false');
      to(0);
    });
    // Tap (touch) or click/Enter toggles and holds the highlight — unless it was a drag.
    markHit.addEventListener('click', () => {
      if (this.logoMoved > 6) return;
      this.hoverLocked = !this.hoverLocked;
      markHit.setAttribute('aria-pressed', String(this.hoverLocked));
      to(this.hoverLocked ? 1 : 0);
    });
    // Arrow keys spin the mark for keyboard users.
    markHit.addEventListener('keydown', (e) => {
      const kick: Record<string, [number, number]> = { ArrowLeft: [0, -5], ArrowRight: [0, 5], ArrowUp: [-3, 0], ArrowDown: [3, 0] };
      const k = kick[e.key];
      if (!k) return;
      e.preventDefault();
      this.rotVelX += k[0];
      this.rotVelY += k[1];
    });
  }

  private cardBounds(card: Card): CardBounds {
    card.mesh.updateMatrixWorld(true);
    const corners = [[-.5, .5], [.5, .5], [.5, -.5], [-.5, -.5]].map(([x, y]) =>
      this.worldToPx(card.mesh.localToWorld(new THREE.Vector3(x, y, 0))));
    const rect = this.els.stage.getBoundingClientRect();
    const xs = corners.map(p => p.x), ys = corners.map(p => p.y);
    return {
      left: rect.left + Math.min(...xs), top: rect.top + Math.min(...ys),
      width: Math.max(12, Math.max(...xs) - Math.min(...xs)), height: Math.max(12, Math.max(...ys) - Math.min(...ys)),
      rotation: Math.atan2(corners[1].y - corners[0].y, corners[1].x - corners[0].x) * 180 / Math.PI,
    };
  }

  private openCampaign(index: number) {
    if (this.viewer.active || phases(this.p).fly > .02) return;
    const card = this.cards[index];
    this.dragging = false;
    this.spinVel = 0;
    this.videos.pauseAll();
    const openedAt = performance.now();
    card.mesh.visible = false;
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
    this.renderer.render(this.ui, this.uiCam);
    this.viewer.open(this.campaigns[index], () => this.cardBounds(card), () => {
      this.startTime += performance.now() - openedAt;
      card.mesh.visible = true;
      this.videoTick = 0;
    });
  }

  private angleOf(i: number) {
    return (i / this.cards.length) * TAU + this.spin;
  }

  // ── Frame ──────────────────────────────────────────────
  private frame = (now: number) => {
    this.raf = requestAnimationFrame(this.frame);
    const dt = Math.min(0.05, (now - this.prevTime) / 1000);
    this.prevTime = now;
    if (!this.visible || this.viewer.active) return;
    this.time += dt;

    // Ease rendered progress toward scroll progress (works in both directions).
    const k = 1 - Math.exp(-dt * 9);
    this.p += (this.target - this.p) * k;
    if (Math.abs(this.target - this.p) < 1e-4) this.p = this.target;
    const ph = phases(this.p);
    const intro = clamp01((now - this.startTime) / INTRO_MS);

    // Ring spin: slow drift + drag inertia (scroll acceleration is added in updateCards).
    if (!this.dragging) {
      this.spin += (BASE_DRIFT + this.spinVel) * dt;
      this.spinVel *= Math.exp(-dt * 2.2);
    }
    // Mark rotation: inertia, then a soft spring back to facing front.
    if (!this.logoDragging) {
      const turn = Math.round(this.rotY / TAU) * TAU;
      this.rotVelY += (-(this.rotY - turn) * 7 - this.rotVelY * 2.4) * dt;
      this.rotVelX += (-this.rotX * 9 - this.rotVelX * 3.4) * dt;
      this.rotY += this.rotVelY * dt;
      this.rotX += this.rotVelX * dt;
    }

    this.updateLogo(ph);
    this.updateCards(ph, intro, dt);
    const reveal = seg(this.p, T.taglineStart, T.taglineEnd);
    const click = smooth(seg(this.p, T.clickStart, T.clickStart + 0.008))
      * (1 - smooth(seg(this.p, T.clickStart + 0.008, T.clickEnd)));
    this.tagline.update(reveal, 1 - smooth(seg(this.p, 0.49, 0.515)), seg(this.p, T.erodeStart, T.erodeEnd), click);
    this.word.update(ph.type);
    this.updateUi(ph);

    if (now - this.videoTick > 250) {
      this.videoTick = now;
      this.updateVideos(ph);
    }

    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
    this.renderer.render(this.ui, this.uiCam);
  };

  private updateLogo(ph: Phases) {
    const { logoCenter, logoH } = this.L;
    const c = ph.chrome;
    const zoom = easeInOut(ph.zoom);
    // Keep the media-filled mark facing forward throughout the reveal.
    // Only the studio reflection travels; the cards never turn edge-on.
    const scale = logoH * Math.exp(zoom * Math.log(75));
    const turn = smooth(seg(this.p, T.chromeEnd, T.turnEnd));
    const settle = smooth(seg(this.p, T.turnEnd, T.settleEnd));
    // Settle along the shortest arc BEFORE scaling. Multiplying a multi-turn
    // drag angle by zoom progress would unwind it through the entire close-up.
    const restTilt = Math.sin(turn * Math.PI) * 0.12;
    // The visitor's rotation is free while the whole mark is on screen
    // (markFit = 1, from last frame's measurement). As the zoom starts to crop
    // it, the rotation unwinds along the shortest arc so the push-in faces front.
    const fit = this.markFit;
    const dragY = Math.atan2(Math.sin(this.rotY), Math.cos(this.rotY));
    const inputY = fit < 1 ? dragY : this.rotY;
    this.logo.rotation.set(restTilt * (1 - settle) + this.rotX * fit, TAU * turn + inputY * fit, 0);
    if (fit <= 0.001 && (this.rotX || this.rotY || this.logoDragging)) {
      this.rotX = this.rotY = this.rotVelX = this.rotVelY = 0;
      this.logoDragging = false;
    }
    this.logo.scale.setScalar(scale);
    // Aim at the interior of the middle facet, avoiding the gaps between blades.
    const focus = new THREE.Vector3(-0.22, 0, 0).applyEuler(this.logo.rotation);
    this.logo.position.copy(logoCenter).multiplyScalar(1 - zoom);
    this.logo.position.addScaledVector(focus, -scale * zoom);
    this.logo.updateMatrixWorld(true);
    this.measureMark(scale);

    const sweep = lerp(-0.2, 1.2, smooth(c));
    const glint = lerp(-0.4, 1.5, smooth(seg(c, 0.30, 1)));
    const depth = easeOut(seg(c, 0.05, 0.65));
    this.chrome.update(sweep, glint, depth, 0, this.hover.v);
    // As the push-in magnifies the reflections into blurry bands, flatten the
    // surface to one constant colour so the zoom lands cleanly.
    this.chrome.setFill(smooth(seg(ph.zoom, 0.28, 0.72)));
    // The middle facet opens into a window onto the spec-ad reel, which fills
    // the screen as the zoom completes; then the hero hands over to the DOM
    // reel underneath (identical frame), and the canvas steps aside.
    this.portal.setFocus(-0.22, 0);
    this.portal.update(smooth(seg(ph.zoom, 0.04, 0.5)));
    this.els.hero.classList.toggle('is-through', this.p >= T.zoomEnd - 0.0015);
  }

  private updateCards(ph: Phases, intro: number, dt: number) {
    const L = this.L;
    const N = this.cards.length;
    const o = easeInOut(ph.orbit);
    const tilt = lerp(L.tilt0, Math.max(0.62, L.tilt0 + 0.2), o);
    const radius = L.ringR * lerp(1, 1.1, o);
    const boost = Math.pow(ph.orbit, 2) * 2.4 + easeOut(ph.fly) * 0.5; // accelerate (reversible: driven by scroll)
    const center = _c.copy(L.ringCenter).lerp(L.logoCenter, o * 0.85);
    const ringM = _m.compose(center, _q0.setFromEuler(_e.set(tilt, 0, -0.07 * (1 - o))), ONE);
    const logoM = this.logo.matrixWorld;
    const logoInv = _m2.copy(logoM).invert();
    const sweep = this.chrome.u.uSweep.value;

    // Which video card (if any) is under the pointer → play blob reacts.
    let hit: { i: number; uv: THREE.Vector2 } | null = null;
    if (this.pointerIn && ph.fly < 0.05 && intro > 0.6) {
      this.raycaster.setFromCamera(this.ndc, this.camera);
      const hits = this.raycaster.intersectObjects(this.cards.filter((c) => c.hasVideo).map((c) => c.mesh), false);
      const h = hits[0];
      if (h?.uv) {
        const card = this.cards.find((c) => c.mesh === h.object)!;
        if (card.u.uFront.value > 0.55) hit = { i: card.index, uv: h.uv };
      }
    }
    let blobHot = false;
    if (ph.fly <= 0) this.matchTiles(boost, tilt);

    for (const card of this.cards) {
      const i = card.index;
      // Arrival: cards are dealt around the orbit, sweeping in from wide and above.
      const ie = easeOut(clamp01((intro - (i / N) * 0.42) / 0.58));
      const a = (i / N) * TAU + this.spin + boost - (1 - ie) * 1.6;
      const front = (Math.cos(a) + 1) / 2;
      const fs = lerp(L.frontMin, lerp(L.frontMax, 1, o), smooth(front)) * lerp(0.6, 1, ie);
      const r = radius * lerp(1.9, 1, ie);

      // Orbit pose
      _p0.set(Math.sin(a) * r, (1 - ie) * L.ringR * 0.7, Math.cos(a) * r).applyMatrix4(ringM);
      _q0.setFromEuler(_e.set(tilt, 0, -0.07 * (1 - o))).multiply(_q1.setFromEuler(_e.set(-tilt * 0.55, a, 0)));
      _s0.set(L.cardW * fs, L.cardH * fs, 1);

      // Cards leave in one wave around the ring, in angular order.
      const delay = (this.leaveRank[i] / (N - 1)) * 0.26;
      const mt = clamp01((ph.fly - delay) / 0.74);
      const m = easeInOut(mt);

      let front2 = front;
      if (mt > 0) {
        const t = card.tile;
        const z = 0.004 + (i % 6) * 0.0012;
        _p1.set(t.cx, t.cy, z).applyMatrix4(logoM);
        // The logo matrix includes scale; use its unit quaternion so footage
        // stays aligned with the chrome facets while the reveal is dragged.
        _q1.copy(this.logo.quaternion);
        _s1.set(t.w * L.logoH * 1.015, t.h * L.logoH * 1.015, 1);
        _p0.lerp(_p1, m);
        _p0.z += Math.sin(Math.PI * m) * L.ringR * 0.12; // shallow lift toward the viewer
        _q0.slerp(_q1, easeOut(Math.min(1, mt * 1.7))); // face front early, then glide
        _s0.lerp(_s1, m);
        front2 = lerp(front, 1, easeOut(Math.min(1, mt * 2)));
      }
      card.mesh.position.copy(_p0);
      card.mesh.quaternion.copy(_q0);
      card.mesh.scale.copy(_s0);

      const u = card.u;
      const aspect = _s0.x / _s0.y;
      u.uFront.value = front2;
      u.uPlaneAspect.value = aspect;
      u.uClip.value = smooth(seg(m, 0.72, 1));
      u.uRadius.value = 0.045 * (1 - smooth(seg(m, 0.8, 1)));
      u.uLogoInv.value.copy(logoInv);
      u.uSweep.value = sweep;
      u.uChrome.value = ph.chrome > 0 ? 1 : 0;
      u.uAspect.value = MARK_ASPECT;
      u.uOpacity.value = smooth(ie);
      u.uTime.value = this.time;
      card.mesh.visible = sweep < 1.19 && ie > 0.001;

      // Play blob: visible in orbit, melts away as cards leave for the mark.
      if (card.hasVideo) {
        u.uPlay.value = (1 - smooth(seg(ph.fly, 0, 0.22))) * smooth(seg(ie, 0.5, 1));
        const b = this.blobs[i];
        let hovT = 0;
        if (hit?.i === i) {
          const px = (hit.uv.x - 0.5) * aspect;
          const py = hit.uv.y - 0.5;
          b.ptr.lerp(_v2.set(px, py), 1 - Math.exp(-dt * 14));
          const dist = Math.hypot(px, py);
          hovT = 1 - smooth(clamp01((dist - 0.1) / 0.32));
        }
        b.hov += (hovT - b.hov) * (1 - Math.exp(-dt * (hovT > b.hov ? 9 : 4)));
        if (b.hov > 0.5) blobHot = true;
        u.uHov.value = b.hov;
        u.uPtr.value.copy(b.ptr);
        const len = b.ptr.length();
        u.uBlobC.value.copy(b.ptr).multiplyScalar(len > 1e-4 ? (Math.min(len, 0.3) / len) * 0.2 * b.hov : 0);
      }

      const tex = this.videos.textureFor(i) ?? this.posters.textures.get(i);
      if (tex) card.setTexture(tex.tex, tex.aspect);
    }
    this.els.hero.classList.toggle('is-blob', blobHot && !this.dragging);
  }

  /**
   * Give each card the tile nearest its place on the ring, so cards fly
   * straight in without crossing. Cards are sorted by their on-screen angle
   * around the ring, tiles by their angle around the mark, and the cyclic
   * offset with the least total turning wins. Within a facet, video cards then
   * take the most visible tiles.
   */
  private matchTiles(boost: number, tilt: number) {
    const N = this.cards.length;
    const st = Math.sin(tilt);
    const cardAng = this.cards.map((c) => {
      const a = (c.index / N) * TAU + this.spin + boost;
      return { c, th: Math.atan2(-Math.cos(a) * st, Math.sin(a)) };
    }).sort((x, y) => x.th - y.th);
    const tileAng = this.tiles.map((t) => ({ t, th: Math.atan2(t.cy, t.cx) })).sort((x, y) => x.th - y.th);
    const diff = (a: number, b: number) => {
      const d = Math.abs(a - b) % TAU;
      return d > Math.PI ? TAU - d : d;
    };
    let best = 0;
    let bestCost = Infinity;
    for (let k = 0; k < N; k++) {
      let cost = 0;
      for (let j = 0; j < N; j++) cost += diff(cardAng[j].th, tileAng[(j + k) % N].th) ** 2;
      if (cost < bestCost) {
        bestCost = cost;
        best = k;
      }
    }
    const assigned = new Map<Card, Tile>();
    cardAng.forEach((o, j) => {
      assigned.set(o.c, tileAng[(j + best) % N].t);
      this.leaveRank[o.c.index] = j;
    });
    // Within each facet, videos take the most visible tiles.
    for (let f = 0; f < MARK_FACETS_UNIT.length; f++) {
      const cs = this.cards.filter((c) => assigned.get(c)!.facet === f);
      const ts = cs.map((c) => assigned.get(c)!).sort((a, b) => b.coverage - a.coverage);
      const order = [...cs].sort((a, b) => Number(b.hasVideo) - Number(a.hasVideo) || this.leaveRank[a.index] - this.leaveRank[b.index]);
      order.forEach((c, k) => assigned.set(c, ts[k]));
    }
    for (const c of this.cards) {
      const t = assigned.get(c)!;
      if (c.tile !== t) c.setTile(t);
    }
  }

  private updateVideos(ph: Phases) {
    if (!this.visible || document.hidden) return this.videos.pauseAll();
    if (ph.chrome > 0.45) return this.videos.pauseAll();
    if (ph.fly < 0.5) {
      // In orbit: the clips nearest the front.
      const ids = this.cards
        .filter((c) => c.hasVideo)
        .map((c) => ({ i: c.index, f: Math.cos(this.angleOf(c.index) + Math.pow(ph.orbit, 2) * 2.4 + easeOut(ph.fly) * 0.5) }))
        .filter((o) => o.f > 0.35)
        .sort((a, b) => b.f - a.f)
        .map((o) => o.i);
      this.videos.setWanted(ids);
    } else {
      // In the mark: the best-placed clip in each facet.
      const ids: number[] = [];
      for (let f = 0; f < MARK_FACETS_UNIT.length; f++) {
        const best = this.cards.filter((c) => c.hasVideo && c.tile.facet === f).sort((a, b) => b.tile.coverage - a.tile.coverage)[0];
        if (best) ids.push(best.index);
      }
      this.videos.setWanted(ids);
    }
    // Start fetching any posters not yet requested (offscreen ones last).
    this.posters.request(this.cards.map((c) => c.index));
  }

  /** Screen box of the (unrotated) mark, and how fully it fits in the viewport. */
  private measureMark(scale: number) {
    const hw = (MARK_ASPECT / 2) * scale;
    const hh = scale / 2;
    const c = this.logo.position;
    const a = this.worldToPx(_v.set(c.x - hw, c.y + hh, 0));
    const b = this.worldToPx(_v.set(c.x + hw, c.y - hh, 0));
    this.markBox = { x0: a.x, y0: a.y, x1: b.x, y1: b.y };
    const { w, h } = this.L;
    const overflow = Math.max(0, -a.x, b.x - w, -a.y, b.y - h);
    this.markFit = 1 - smooth(clamp01(overflow / (0.12 * h)));
  }

  private updateUi(ph: Phases) {
    const { hint, markHit } = this.els;
    if (hint) {
      const finished = ph.chrome > 0 && this.markFit >= 0.999;
      hint.style.opacity = String(finished ? 1 : 1 - seg(this.p, 0.005, 0.05));
      const dragHint = hint.querySelector<HTMLElement>('.hero__hint-drag');
      if (dragHint) dragHint.textContent = finished ? 'Drag to rotate · Arrow keys to spin' : 'Drag to explore';
    }
    // Grab and rotate whenever the chrome mark is fully on screen; stop once
    // the zoom starts cropping it.
    const active = ph.chrome > 0 && this.markFit >= 0.999;
    this.markActive = active;
    if (active !== markHit.classList.contains('is-active')) {
      markHit.classList.toggle('is-active', active);
      markHit.tabIndex = active ? 0 : -1;
      if (!active) {
        this.logoDragging = false;
        this.els.hero.classList.remove('is-dragging');
        if (this.hover.v > 0) {
          this.hoverLocked = false;
          gsap.to(this.hover, { v: 0, duration: 0.4, overwrite: true });
        }
      }
    }
    if (active) {
      // Hit target covers the mark's unrotated on-screen box (stable while it spins).
      const { x0, y0, x1, y1 } = this.markBox;
      Object.assign(markHit.style, { left: `${x0}px`, top: `${y0}px`, width: `${x1 - x0}px`, height: `${y1 - y0}px` });
    }
  }

  destroy() {
    this.viewer.destroy();
    cancelAnimationFrame(this.raf);
    this.videos.pauseAll();
    this.word.dispose();
    this.chrome.dispose();
    this.renderer.dispose();
  }
}
