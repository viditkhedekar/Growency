// ─────────────────────────────────────────────────────────────────────────────
// Media for the homepage hero ring and the media-filled mark.
// THIS IS THE ONE PLACE TO EDIT RING CARDS.
//
// The ring uses the real Growency spec ads (src/content/work.ts); photos can be
// mixed in with `@` slots (see PHOTOS). Slots with
// `video` play a gentle motion loop of the ad (scripts/gen-ad-loops.py); only a
// few play at once and the rest show their still.
//
// Order matters: cards 1–6 fill the mark's top blade, 7–12 the middle, 13–18
// the lower blade. Earlier cards load first. Keep 18 entries (3 facets × 6).
// Every spec ad must keep its "Not commissioned by …" note (shown as `client`).
// ─────────────────────────────────────────────────────────────────────────────
import { SPEC_ADS } from './work';

export interface Campaign {
  id: string;
  title: string;
  /** Shown after the title, e.g. in the preview caption. For spec ads: the required disclaimer. */
  client: string;
  /** Still image, also used while video loads and for reduced motion. */
  poster: string;
  /** Optional muted loop. Leave undefined for a still-only card. */
  video?: string;
  /** Describe what the image shows, not just the campaign name. */
  alt: string;
  /** Link to a case study, if one exists. */
  href?: string;
  /** True for generated stand-ins. */
  placeholder: boolean;
}

const LOOPS = `${import.meta.env.BASE_URL}media/campaigns/`;
const PHOTO_DIR = `${import.meta.env.BASE_URL}media/photos/`;

/** Optional photos to mix into the ring: file name (in public/media/photos/) → alt text. */
const PHOTOS: Record<string, string> = {};

/**
 * Slot → content. `*` = plays the ad's motion loop; `@name` = a photo from
 * PHOTOS (e.g. stock imagery). Slot k and slot k + 9 sit directly opposite each
 * other on the ring, so a repeated ad never lands beside its twin in the mark.
 */
const RING = [
  'aside', 'wispr-flow*', 'ikea', 'moonshot-bring-flowers', 'granola*', 'allbirds',
  'instinct*', 'sandwich*', 'moonshot-for-everything',
  'moonshot-good-memory*', 'wispr-flow', 'ikea', 'moonshot-bring-flowers', 'granola', 'allbirds*',
  'instinct', 'sandwich', 'moonshot-for-everything',
];

export const CAMPAIGNS: Campaign[] = RING.map((slot, i) => {
  if (slot.startsWith('@')) {
    const name = slot.slice(1);
    return {
      id: `photo-${name}`,
      title: 'Growency',
      client: 'Growency',
      poster: `${PHOTO_DIR}${name}`,
      alt: PHOTOS[name] ?? '',
      placeholder: false,
    };
  }
  const video = slot.endsWith('*');
  const id = slot.replace('*', '');
  const ad = SPEC_ADS.find((a) => a.id === id);
  if (!ad) throw new Error(`Unknown spec ad "${id}" in RING`);
  return {
    id: `${id}-${i + 1}`,
    title: ad.title,
    client: ad.note,
    poster: ad.src,
    video: video ? `${LOOPS}${id}-loop.mp4` : undefined,
    alt: ad.alt,
    placeholder: false,
  };
});
