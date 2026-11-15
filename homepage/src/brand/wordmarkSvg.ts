import { WORDMARK_LETTERS, WORDMARK_VIEWBOX } from './wordmark.generated.ts';

/** The wordmark as an inline SVG string (decorative; the h1 carries the text). */
export function wordmarkSvg(className = 'wordmark-svg') {
  const [x, y, w, h] = WORDMARK_VIEWBOX;
  const paths = WORDMARK_LETTERS.map((l) => `<path d="${l.d}"/>`).join('');
  return `<svg class="${className}" viewBox="${x} ${y} ${w} ${h}" aria-hidden="true" focusable="false" fill="currentColor">${paths}</svg>`;
}
