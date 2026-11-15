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

const originalFiles = new Set([
  'allbirds.webp', 'aside-invoice-matching.png', 'granola-brand.jpg', 'ikea.webp',
  'instinct-tennis.jpg', 'moonshot-bring-flowers.jpg', 'moonshot-for-everything.jpg',
  'moonshot-good-memory.jpg', 'sandwich.webp', 'wispr-flow-brand.jpg',
]);
const extraAds = Object.keys(import.meta.glob('../../../assets/spec-ads/*.{png,jpg,webp}'))
  .map(path => path.split('/').at(-1)!)
  .filter(file => !originalFiles.has(file))
  .sort()
  .map(file => {
    const title = file.replace(/-Meta-Ad|\.[^.]+$/g, '').replaceAll('-', ' ');
    return { id: file, title, client: 'Growency spec work · Not commissioned', poster: '/assets/spec-ads/' + file, alt: title + ' sample Meta ad', placeholder: false };
  });

export const CAMPAIGNS: Campaign[] = [
  ...SPEC_ADS.map(ad => ({ id: ad.id, title: ad.title, client: ad.note, poster: ad.src, alt: ad.alt, placeholder: false })),
  ...extraAds,
];
