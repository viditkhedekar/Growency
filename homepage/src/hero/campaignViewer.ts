import gsap from 'gsap';
import type { Campaign } from '../content/campaigns';

export interface CardBounds { left: number; top: number; width: number; height: number; rotation: number }

/** A modal FLIP transition from a projected orbit card to a real media player. */
export class CampaignViewer {
  readonly dialog = document.createElement('dialog');
  active = false;
  private card = document.createElement('div');
  private media = document.createElement('div');
  private closeButton = document.createElement('button');
  private caption = document.createElement('p');
  private source?: () => CardBounds;
  private release?: () => void;
  private previousFocus: HTMLElement | null = null;
  private closing = false;
  private timeline?: gsap.core.Timeline;

  constructor() {
    this.dialog.className = 'campaign-viewer';
    this.dialog.setAttribute('aria-label', 'Campaign preview');
    this.dialog.setAttribute('data-lenis-prevent', '');
    this.card.className = 'campaign-viewer__card';
    this.media.className = 'campaign-viewer__media';
    this.closeButton.className = 'campaign-viewer__close';
    this.closeButton.type = 'button';
    this.closeButton.textContent = 'Close ×';
    this.caption.className = 'campaign-viewer__caption';
    this.card.append(this.media);
    this.dialog.append(this.card, this.closeButton, this.caption);
    document.body.append(this.dialog);
    this.closeButton.addEventListener('click', this.close);
    this.dialog.addEventListener('click', e => { if (e.target === this.dialog) this.close(); });
    this.dialog.addEventListener('cancel', e => { e.preventDefault(); this.close(); });
    window.addEventListener('resize', () => {
      if (!this.active || this.closing) return;
      this.timeline?.kill();
      gsap.set(this.card, { ...this.destination(), rotation: 0, scale: 1 });
      gsap.set([this.closeButton, this.caption], { opacity: 1 });
    });
    document.addEventListener('visibilitychange', () => {
      const video = this.media.querySelector('video');
      if (document.hidden) video?.pause();
    });
  }

  private destination() {
    const width = Math.max(120, Math.min(560, innerWidth - 40, (innerHeight - 170) * .8));
    const height = width * 1.25;
    return { left: (innerWidth - width) / 2, top: (innerHeight - height) / 2 - 8, width, height };
  }

  open(campaign: Campaign, source: () => CardBounds, release: () => void) {
    if (this.active) return;
    this.active = true;
    this.closing = false;
    this.source = source;
    this.release = release;
    this.previousFocus = document.activeElement as HTMLElement;
    const image = document.createElement('img');
    image.draggable = false;
    image.src = campaign.poster;
    image.alt = campaign.alt;
    this.media.replaceChildren(image);
    if (campaign.video) {
      const video = document.createElement('video');
      video.src = campaign.video;
      video.poster = campaign.poster;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.controls = true;
      video.setAttribute('aria-label', campaign.title);
      video.addEventListener('error', () => video.remove(), { once: true });
      this.media.append(video);
      // Start after the card lands, so controls don't obscure the lift.
    }
    this.caption.textContent = `${campaign.title} · ${campaign.client}${campaign.placeholder ? ' · Placeholder' : ''}`;
    document.documentElement.classList.add('has-campaign-viewer');
    document.dispatchEvent(new CustomEvent('campaign-viewer-change', { detail: { open: true } }));
    this.dialog.showModal();
    gsap.set(this.dialog, { '--viewer-dim': 0 });
    gsap.set(this.card, { ...source(), scale: 1, opacity: 1 });
    gsap.set([this.closeButton, this.caption], { opacity: 0 });
    this.closeButton.focus({ preventScroll: true });
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.timeline = gsap.timeline()
      .to(this.dialog, { '--viewer-dim': 1, duration: reduced ? 0 : .5 }, 0)
      .to(this.card, { scale: 1.08, rotation: 0, duration: reduced ? 0 : .18, ease: 'power2.out' }, 0)
      .to(this.card, { ...this.destination(), scale: 1, rotation: 0, duration: reduced ? 0 : .62, ease: 'power3.inOut' }, reduced ? 0 : .1)
      .to([this.closeButton, this.caption], { opacity: 1, duration: .2 }, '-=.15')
      .call(() => { void this.media.querySelector('video')?.play().catch(() => {}); });
  }

  close = () => {
    if (!this.active || this.closing) return;
    this.closing = true;
    this.timeline?.kill();
    this.media.querySelector('video')?.pause();
    const destination = this.source!();
    this.timeline = gsap.timeline({ onComplete: () => {
      this.dialog.close();
      const video = this.media.querySelector('video');
      video?.removeAttribute('src');
      video?.load();
      this.media.replaceChildren();
      this.active = false;
      this.closing = false;
      document.documentElement.classList.remove('has-campaign-viewer');
      document.dispatchEvent(new CustomEvent('campaign-viewer-change', { detail: { open: false } }));
      this.release?.();
      this.previousFocus?.focus({ preventScroll: true });
    } })
      .to([this.closeButton, this.caption], { opacity: 0, duration: .12 }, 0)
      .to(this.dialog, { '--viewer-dim': 0, duration: .55 }, 0)
      .to(this.card, { ...destination, scale: 1, duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : .6, ease: 'power3.inOut' }, 0);
  };

  destroy() {
    this.timeline?.kill();
    this.media.querySelector('video')?.pause();
    if (this.active) {
      document.documentElement.classList.remove('has-campaign-viewer');
      document.dispatchEvent(new CustomEvent('campaign-viewer-change', { detail: { open: false } }));
    }
    this.dialog.remove();
  }
}
