// Poster loading (priority order, limited concurrency) and a small pool of
// muted inline videos. Only `maxPlaying` clips play at once; everything else
// shows its poster. Videos are created lazily the first time they're wanted.
import * as THREE from 'three';
import type { Campaign } from '../content/campaigns';

export interface LoadedTexture {
  tex: THREE.Texture;
  aspect: number;
}

export class PosterLoader {
  private loader = new THREE.TextureLoader();
  private queue: number[] = [];
  private active = 0;
  private started = new Set<number>();
  readonly textures = new Map<number, LoadedTexture>();

  constructor(
    private campaigns: Campaign[],
    private anisotropy: number,
    private concurrency = 4,
  ) {}

  /** Queue posters; ids earlier in the list load first. */
  request(ids: number[]) {
    for (const id of ids) if (!this.started.has(id) && !this.queue.includes(id)) this.queue.push(id);
    this.pump();
  }

  private pump() {
    while (this.active < this.concurrency && this.queue.length) {
      const id = this.queue.shift()!;
      this.started.add(id);
      this.active++;
      this.loader.load(
        this.campaigns[id].poster,
        (tex) => {
          const img = tex.image as HTMLImageElement;
          tex.colorSpace = THREE.NoColorSpace; // shaders output raw sRGB
          tex.anisotropy = this.anisotropy;
          tex.minFilter = THREE.LinearMipmapLinearFilter;
          tex.needsUpdate = true;
          this.textures.set(id, { tex, aspect: img.naturalWidth / img.naturalHeight });
          this.active--;
          this.pump();
        },
        undefined,
        () => {
          this.active--;
          this.pump();
        },
      );
    }
  }
}

interface PooledVideo {
  el: HTMLVideoElement;
  tex: THREE.VideoTexture;
  ready: boolean;
}

export class VideoPool {
  private videos = new Map<number, PooledVideo>();
  private playing = new Set<number>();

  constructor(
    private campaigns: Campaign[],
    readonly maxPlaying = 3,
  ) {}

  /** Play exactly these ids (trimmed to maxPlaying); pause the rest. */
  setWanted(ids: number[]) {
    const want = new Set(ids.filter((i) => this.campaigns[i]?.video).slice(0, this.maxPlaying));
    for (const id of this.playing)
      if (!want.has(id)) {
        this.videos.get(id)?.el.pause();
        this.playing.delete(id);
      }
    for (const id of want) {
      if (this.playing.has(id)) continue;
      const v = this.get(id);
      this.playing.add(id);
      v.el.play().catch(() => {
        /* autoplay refused (e.g. low-power mode): poster stays */
      });
    }
  }

  pauseAll() {
    this.setWanted([]);
  }

  /** Video texture for a card if its clip is playing and has a frame. */
  textureFor(id: number): LoadedTexture | undefined {
    if (!this.playing.has(id)) return undefined;
    const v = this.videos.get(id);
    if (!v || !v.ready) return undefined;
    return { tex: v.tex, aspect: v.el.videoWidth / v.el.videoHeight || 0.8 };
  }

  private get(id: number): PooledVideo {
    let v = this.videos.get(id);
    if (v) return v;
    const el = document.createElement('video');
    el.muted = true;
    el.defaultMuted = true;
    el.playsInline = true;
    el.loop = true;
    el.preload = 'auto';
    el.crossOrigin = 'anonymous';
    el.setAttribute('muted', '');
    el.setAttribute('playsinline', '');
    el.src = this.campaigns[id].video!;
    const tex = new THREE.VideoTexture(el);
    tex.colorSpace = THREE.NoColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    v = { el, tex, ready: false };
    const pv = v;
    const markReady = () => (pv.ready = el.readyState >= 2);
    el.addEventListener('playing', markReady);
    el.addEventListener('loadeddata', markReady);
    this.videos.set(id, v);
    return v;
  }
}
