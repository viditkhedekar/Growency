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

export const CAMPAIGNS: Campaign[] = SPEC_ADS.map(({ id, title, note, src, alt }) => ({
  id,
  title,
  client: note,
  poster: src,
  alt,
  placeholder: false,
}));
