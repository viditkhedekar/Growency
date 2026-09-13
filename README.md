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
| `privacy.html` | The privacy policy, a draft for legal review |
| `compare/*.html` | Six static comparison pages: Apollo, Clay, 11x, Artisan, Belkins and CIENCE, linked from the footer |
| `archive/` | Two previous versions of the site, each kept whole |

## The page, chapter by chapter

A marker in the bottom left names the chapter you are in and how far through it
you are.

1. **The fund.** GROWENCY is cut out of a dark sheet, so the scene shows through
   the letters and the lattice turns inside the O. Scrolling pulls the other
   letters away, opens the O into a portal, and flies the camera through it.
2. **The signal.** Inside, a drift of generic subject lines comes at you. One of
   them lights up, travels, and becomes the subject line of the first email in
   a deck of five. Drag the card, use the dots or use the arrow keys to move
   between them. Each one types its generic version, strikes it, and grows the
   specific lines in underneath. Only the email on screen plays.
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
- **Sample data.** All five emails, the angle names and every number on the
  desk are invented. The footer says so, and the desk carries a "sample data"
  label. Keep both if you change the numbers.
- **The logo.** `#mark` is a hand trace of the brand image: upright cubes, with
  the six dots joined into a rising network. It is close, but it is still a
  trace. Swap in the official SVG when it exists and every `<use href="#mark">`
  picks it up. The scene, the plates, the portfolio and the mosaics all read
  their geometry from that symbol: the lattice from its first path, the network
  from `.mark__net`, and the dots from its small circles. Keep that structure,
  or check all four after a swap. The same symbol is copied into
  `privacy.html` and every page in `compare/`, so update it there too.
- **Comparison pages.** Each page in `compare/` is standalone static HTML with
  no script. Competitor details and prices come from their public pricing pages
  and third-party reporting, checked 13 September 2026, and each page names its
  sources under the table. Prices move, so recheck them before launch and every
  few months, and update the date in the note and the footer. 11x, Artisan and
  Belkins do not publish prices, so those figures are labelled as third-party
  estimates. Keep that labelling.
- **Privacy policy.** `privacy.html` is a draft written under Hong Kong's
  Personal Data (Privacy) Ordinance, covering site visitors and the people
  contacted for clients. It needs a lawyer's review before launch. Nine
  highlighted placeholders need real details: the legal company name,
  business registration number, registered address, privacy email and booking
  provider. Confirm the operational statements match how Growency works: the
  retention periods (12 months for prospects, 24 for correspondence), and that
  interested replies are passed to the client. Once fonts and three.js are
  self-hosted, delete the subsection about what the browser shares on load.

## The 30-40x figure

Shown twice: the rubber stamp pressed across the Y of the wordmark on the first
screen, and the large numeral in chapter 4. It is the company's stated position
rather than an audited result, and by instruction it carries no caveat on the
page. The stamp is measured from the Y's own box, so it follows the wordmark at
any size and rides the Y off screen when the flight starts.

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
- **The cursor.** It is a small plus, and it opens into a circle over anything
  you can act on, filling and naming the action where there is a word for it
  (`data-cursor` in the markup). Behind that, the lattice ripples away from it,
  a trail follows it, buttons pull toward it, and headline letters shift as it
  passes. The native cursor is only hidden while `.has-cursor` is set, and all
  of it is off under reduced motion, on coarse pointers, and on phones.
- **Phones** get the same flight with fewer particles, no trail, half-resolution
  bloom, and one desk panel at a time. Under 600px the pinned chapters are
  shorter, so the whole page is about a fifth less scrolling, and each pinned
  layout is sized to the small viewport so nothing sits under the browser's
  toolbars. The middle chapters draw the scene at half rate (the portal and the
  medallion keep every frame), the mosaics redraw less often, and touch screens
  get a solid fill instead of glass blur, which would be recomputed over the
  scene every frame.
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
