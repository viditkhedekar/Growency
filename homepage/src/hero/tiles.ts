// Assigns every campaign card a tile inside one of the mark's three facets.
// Shared by the WebGL hero (assembly targets) and the static fallback.
import { MARK_FACETS_UNIT, type Pt } from '../brand/mark';

export interface Tile {
  facet: number;
  /** Tile centre / size in mark units (height 1, centred, y up). */
  cx: number;
  cy: number;
  w: number;
  h: number;
  /** Fraction of the tile that lies inside its facet (0..1). */
  coverage: number;
}

const CARD_ASPECT = 4 / 5;

function inside(poly: Pt[], x: number, y: number) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

function bbox(poly: Pt[]) {
  const xs = poly.map((p) => p[0]);
  const ys = poly.map((p) => p[1]);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
}

/** Tiles for one facet: a grid over its bounding box whose cells are as close to 4:5 as possible. */
function facetTiles(facet: number, count: number): Tile[] {
  const poly = MARK_FACETS_UNIT[facet];
  const b = bbox(poly);
  const bw = b.x1 - b.x0;
  const bh = b.y1 - b.y0;
  let best = { cols: 1, rows: count, err: Infinity };
  for (let cols = 1; cols <= count; cols++) {
    if (count % cols) continue;
    const rows = count / cols;
    const err = Math.abs(Math.log(bw / cols / (bh / rows) / CARD_ASPECT));
    if (err < best.err) best = { cols, rows, err };
  }
  const tw = bw / best.cols;
  const th = bh / best.rows;
  const tiles: Tile[] = [];
  for (let r = 0; r < best.rows; r++)
    for (let c = 0; c < best.cols; c++) {
      const cx = b.x0 + tw * (c + 0.5);
      const cy = b.y1 - th * (r + 0.5);
      let hit = 0;
      const S = 12;
      for (let i = 0; i < S; i++)
        for (let j = 0; j < S; j++)
          if (inside(poly, cx + tw * ((i + 0.5) / S - 0.5), cy + th * ((j + 0.5) / S - 0.5))) hit++;
      tiles.push({ facet, cx, cy, w: tw, h: th, coverage: hit / (S * S) });
    }
  return tiles;
}

/**
 * Card i belongs to facet floor(i / perFacet). Within a facet, the cards with
 * video (and then earlier cards) take the tiles with the most visible area.
 */
export function assignTiles(cards: { video?: string }[]): Tile[] {
  const facets = MARK_FACETS_UNIT.length;
  const per = Math.ceil(cards.length / facets);
  const out: Tile[] = new Array(cards.length);
  for (let f = 0; f < facets; f++) {
    const ids = cards.map((_, i) => i).filter((i) => Math.floor(i / per) === f);
    const tiles = facetTiles(f, ids.length).sort((a, b) => b.coverage - a.coverage);
    const ranked = [...ids].sort((a, b) => Number(!!cards[b].video) - Number(!!cards[a].video) || a - b);
    ranked.forEach((id, k) => (out[id] = tiles[k]));
  }
  return out;
}
