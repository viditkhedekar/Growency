// Static hero mark for reduced motion / no WebGL: the Growency mark with each
// facet filled by its campaign posters, using the same tile layout as the
// animated version.
import { MARK_BOUNDS, MARK_FACETS, markPathD } from '../brand/mark';
import type { Campaign } from '../content/campaigns';
import { assignTiles } from './tiles';

const NS = 'http://www.w3.org/2000/svg';

export function buildStaticMark(svg: SVGSVGElement, campaigns: Campaign[]) {
  const pad = 2;
  const b = MARK_BOUNDS;
  svg.setAttribute('viewBox', `${b.minX - pad} ${b.minY - pad} ${b.w + pad * 2} ${b.h + pad * 2}`);
  const H = b.h;
  const defs = document.createElementNS(NS, 'defs');
  svg.append(defs);
  MARK_FACETS.forEach((f, i) => {
    const cp = document.createElementNS(NS, 'clipPath');
    cp.id = `static-facet-${i}`;
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', markPathD(f));
    cp.append(path);
    defs.append(cp);
  });
  const groups = MARK_FACETS.map((_, i) => {
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('clip-path', `url(#static-facet-${i})`);
    svg.append(g);
    return g;
  });
  assignTiles(campaigns).forEach((t, i) => {
    const img = document.createElementNS(NS, 'image');
    const w = t.w * H * 1.01;
    const h = t.h * H * 1.01;
    const x = t.cx * H + b.cx - w / 2;
    const y = -t.cy * H + b.cy - h / 2;
    img.setAttribute('href', campaigns[i].poster);
    img.setAttribute('x', String(x));
    img.setAttribute('y', String(y));
    img.setAttribute('width', String(w));
    img.setAttribute('height', String(h));
    img.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    groups[t.facet].append(img);
  });
}

/** Small solid mark for the nav icon / favicon. */
export function fillMarkIcon(svg: SVGSVGElement) {
  const b = MARK_BOUNDS;
  svg.setAttribute('viewBox', `${b.minX} ${b.minY} ${b.w} ${b.h}`);
  svg.innerHTML = MARK_FACETS.map((f) => `<path d="${markPathD(f)}"/>`).join('');
}
