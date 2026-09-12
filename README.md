# Growency

Static one page site. No build step. The only dependency is three.js, loaded
from a CDN through an import map. Open `index.html` in a browser, or serve the
folder:

```bash
python3 -m http.server 4341
```

## Files

| File | What it holds |
| --- | --- |
| `index.html` | All page content and copy, plus the logo mark as an inline SVG symbol |
| `styles.css` | Dark tokens, type, every section, and the pinned layouts under `.fx` |
| `script.js` | `window.GROWENCY`, the scroll engine, and every scrubbed scene |
| `scene.js` | The WebGL scene: lattice, corridor, particles, cursor trail, glass medallion |
| `archive/` | Two previous versions of the site, each kept whole |

## The page, chapter by chapter

A marker in the bottom left names the chapter you are in and how far through it
you are.

1. **The fund.** GROWENCY is cut out of a dark sheet, so the scene shows through
   the letters and the lattice turns inside the O. Scrolling pulls the other
   letters away, opens the O into a portal, and flies the camera through it.
2. **The signal.** Inside, a drift of generic subject lines comes at you. One of
   them lights up, travels, and becomes the subject line of the Dana email,
   which types itself in a glass pane.
3. **The strategy.** The mark comes apart into six plates, one per part of the
   sentence beside it, with callouts. The sentence fills word by word as you
   scroll, and the plates snap back together at the end.
4. **The portfolio.** The mark's six dots are six live angles. Weeks 0 to 2 play
   out: weak angles are cut and their capital flows along the lattice to the
   ones booking meetings. Then the 30-40x figure lands.
5. **The trade.** Six steps, pinned. The giant `ALPHA-0N` rolls over and a desk
   beside it lights one panel per step: book, thesis, sizing, executions,
   replies, P&L.
6. **The operators.** The two photo slots are live character mosaics of the
   lattice until real photos exist. Then the refusals: a fan of cards that get
   struck, stamped and flicked off the table.
7. **The terms.** Scrolling draws a signature across the term sheet and the
   button arrives where the stroke ends. The closing band condenses the lattice
   into a glass medallion of the mark.

## Before this goes live

- **Booking links.** Every "Request the pilot" button scrolls to the term sheet
  or the closing band. The closing one is `href="#"` and needs the real
  destination. Marked `TODO` in `index.html`.
- **Two image slots.** The operators section has a team photo slot (about
  2400 x 1400) and a research or workspace detail (about 1200 x 1400). Real
  photos only, no stock. Until then each renders as a character mosaic. Marked
  `TODO` in `index.html`.
- **Fonts.** Geist and Geist Mono load from Google Fonts. Self-host both with
  `@font-face` before launch.
- **three.js.** Pinned to 0.186.0 on jsDelivr in the import map. Self-host it,
  or at least keep the version pinned.
- **Sample data.** Dana, Meridian Labs, the angle names and every number on the
  desk are invented. The footer says so, and the desk carries a "sample data"
  label. Keep both if you change the numbers.
- **The logo.** `#mark` is a hand-rebuilt vector of the brand image, not the
  official file. Swap in the real asset and every `<use href="#mark">` picks it
  up. The scene, the plates and the portfolio all read their geometry from that
  same path, so check those three after a swap.

## The 30-40x figure

Shown twice: the badge on the hero pane and the large numeral in chapter 4. It
is the company's stated position rather than an audited result, and by
instruction it carries no caveat on the page.

## How it holds up

Three layers of state, so the page degrades cleanly:

- **Base.** Every rule outside `.fx` is the page in plain reading order. That is
  what you get with JavaScript off: no pinning, no hidden states, every word
  visible, and the Copy button hidden.
- **`.fx`** is added by `script.js` when motion is welcome. It pins the scenes
  and hands their choreography to the scroll engine. Under
  `prefers-reduced-motion` it is never added, so the page reads as a normal
  document with the scene sitting still behind it.
- **`.gl-on`** means the WebGL scene started. If three.js cannot load, or the
  browser has no WebGL, the page gets `.no-gl` instead and the flat marks stand
  in for the scene.

Two switches help when testing: `?nogl` skips the scene entirely and `?still`
forces the reduced motion path.

## Notes

- **No scroll listeners.** One animation frame loop reads `scrollY`, measures
  everything once, then writes. A frame where the page has not moved does
  nothing. Because every state is a function of scroll position rather than a
  fired animation, all of it plays backwards when you scroll up.
- **The scene never touches the DOM.** `script.js` measures the page and writes
  what it found to `window.GROWENCY`; `scene.js` only reads it. That keeps
  layout reads in one place.
- **The lattice.** Every point of the flat mark has three homes: on a sphere, on
  the corridor it unrolls into, and flat inside the medallion. The shader mixes
  between them, so one piece of geometry carries the whole page.
- **The cursor.** The lattice ripples away from it, a glowing trail follows it,
  buttons pull toward it, and headline letters shift as it passes. All of it is
  off under reduced motion, on coarse pointers, and on phones.
- **Phones** get the same flight with fewer particles, no trail, half-resolution
  bloom, and one desk panel at a time.
- **The loader** counts to 100 while the scene compiles, then the particles snap
  into the lattice. Once per session, skippable with a click, key, scroll or
  touch, and never under reduced motion.
- **Theme.** Dark only, by instruction. One accent (electric blue) with violet
  as its partner in the brand gradient.
- **Type.** Geist for every word. Geist Mono only for data: the chapter marker,
  the lifecycle codes, the desk, the counter.
- **Radius.** Anything you can press is a pill, and so is the nav. Every surface
  is 14px. Stamps are 4px.

## The archive

- `archive/2026-09-10-editorial/`: the ivory and forest editorial version.
- `archive/2026-09-10-gradient/`: the first blue and violet geometric sans version.
- The globe and letter version that this one replaced lives in git history, at
  commit `db88ec3`.
