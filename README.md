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
| `styles.css` | Dark tokens, type, every section, and the pinned strategy under `.fx` |
| `script.js` | `window.GROWENCY`, the scroll engine, the dotted wordmark's sampling, the section rail and the email rewrites |
| `scene.js` | The WebGL scene: the wordmark as dots, lattice, cursor trail, glass medallion |
| `privacy.html` | The privacy policy, a draft for legal review |
| `compare/*.html` | Six static comparison pages: Apollo, Clay, 11x, Artisan, Belkins and CIENCE, linked from the footer |
| `archive/` | Two previous versions of the site, each kept whole |

## The page, chapter by chapter

A marker in the bottom left names the chapter you are in. A rail lists every
section by name, lights the one you are in, fills a line with how far through
it you are, and jumps to any of them. On screens wider than 1100px it runs down
the right edge once you are past the hero. Over the hero, and everywhere on
smaller screens, it collapses to a pill in the bottom right naming the current
section, which opens the list. On phones the pill replaces the chapter marker.

1. **The fund.** GROWENCY fills most of the first screen, centred, as a field of
   dots. `script.js` fits it to the space above the headline row on every
   screen; portrait screens (phones and upright tablets) stack two letters to
   a row. The O is the Growency mark in finer, steadier dots (ring, cube
   lattice, network, and a bright star on each of the six nodes). The 30-40x
   stamp is a solid dark plate with a gradient rim, pressed across the N so
   the mark stays clear.
   The dots gather in from across the screen on load (once the loader hits 100 on a
   first visit), then keep moving: a slow drift, a wave running through the
   letters, so no dot ever sits still. Moving the cursor leaves a wind behind it, in the manner of
   OpenAI's GPT-6 Astra page: dots along the stroke are flung with it and
   wobble across it, a wider soft field bends the letters, a glow trails, and
   it all drifts back over several seconds. Faster flicks push harder. A few
   dots are brighter stars with four point flares. Scrolling away scatters
   them. The
   headline, sub-line and buttons sit in one row underneath.
   Behind the whole page is a faint web: the mark's cube lattice tiled across
   the screen. The cursor's wind bends it and the lines swell and brighten
   around the pointer. It is most alive over the hero and answers less and
   less the further down the page you go.
2. **The emails.** All five sample emails at once: five across on wide screens,
   three and two on laptops, then two and one. As the grid comes into view each
   one types the generic email, strikes it, and fades the specific lines in, a
   beat after the one before. Then they hold. Each has Replay and Copy.
3. **The strategy.** The one pinned chapter. The mark comes apart into six
   plates, one per part of the sentence beside it, with callouts. The sentence
   fills word by word as you scroll, and the plates snap back together at the
   end.
4. **The portfolio.** The mark's six dots as six angles at the end of week two:
   the cut ones crossed out, the rest carrying the budget. Static, with the
   30-40x figure underneath.
5. **The trade.** Six steps as a list beside a static desk (book, thesis,
   sizing, executions, replies, P&L). Hovering or focusing a step opens a card
   with what we do, what you get and the matching line on the desk, and lights
   that node on the globe behind the desk. On touch screens a tap opens the
   step in place.
6. **The operators.** The two photo slots are live character mosaics of the
   lattice until real photos exist. Then the refusals: six cards in a grid.
   With a mouse they start as plain statements, and running the cursor over
   one strikes it through and stamps it DECLINED, for good, and brings up a
   line on what we do instead while you hover. Touch screens get them already
   struck, with the line showing.
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
- **Fonts.** Unbounded, Onest and Red Hat Mono load from Google Fonts.
  Self-host all three with `@font-face` before launch.
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

Shown twice: the rubber stamp pressed across the wordmark on the first screen,
and the large numeral in chapter 4. It is the company's stated position rather
than an audited result, and by instruction it carries no caveat on the page.
The wordmark is stacked (GROW over ENCY), so the stamp is measured from the
letters' own boxes and pressed across the middle of the stack. It follows the
wordmark at any size.

## How it holds up

Three layers of state, so the page degrades cleanly:

- **Base.** Every rule outside `.fx` is the page in plain reading order. That is
  what you get with JavaScript off: no pinning, no hidden states, every word
  visible, and the Copy button hidden.
- **`.fx`** is added by `script.js` when motion is welcome. It pins the strategy,
  draws the wordmark as dots and plays the email rewrites. Under
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
- **The lattice.** Every point of the flat mark has homes on a sphere and flat
  inside the medallion. The shader mixes between them, so one piece of geometry
  carries the whole page. (It still carries a corridor shape from an earlier
  version of the hero, unused for now.)
- **The dotted wordmark.** `script.js` draws the GROWENCY letters offscreen at
  `.word`'s own layout and samples them on a jittered grid, about 10,500 dots
  on desktop and 4,200 on phones, whatever the type size. `scene.js` draws them
  in screen space, so they line up with the hero exactly and resample on
  resize. Until the samples exist the gradient type shows instead.
- **The cursor.** It is a small plus, and it opens into a circle over anything
  you can act on, filling and naming the action where there is a word for it
  (`data-cursor` in the markup). Behind that, the lattice ripples away from it,
  a trail follows it, buttons pull toward it, and headline letters shift as it
  passes. The native cursor is only hidden while `.has-cursor` is set, and all
  of it is off under reduced motion, on coarse pointers, and on phones.
- **Phones** get fewer dots, no trail and half-resolution bloom. Under 600px the wordmark stacks two
  letters to a row (GR, OW, EN, CY) instead of four, sized to the height left after the
  headline and buttons, with the stamp pressed across the middle of the stack;
  the dot sampler reads each glyph's own row. The pinned strategy is shorter
  and sized to the small viewport so nothing sits under the browser's
  toolbars. The middle chapters draw the scene at half rate (the dotted
  wordmark and the medallion keep every frame), the mosaics redraw less often, and touch screens
  get a solid fill instead of glass blur, which would be recomputed over the
  scene every frame.
- **The loader** counts to 100 while the scene compiles, then the dots start
  gathering into the wordmark and the loader lifts part way through. Once per session, skippable with a click, key, scroll or
  touch, and never under reduced motion.
- **Theme.** Dark only, by instruction. The brand is the gradient from
  `growency_cover.jpeg`: sky blue through royal blue, indigo and purple, fading
  to near-black. It runs through the whole site: headline type, buttons, labels,
  bars, card edges, and the scene's backdrop, which drifts behind every chapter.
  In `styles.css`, `--grad` is the full ramp (headlines, wide surfaces),
  `--grad-ui` stops at purple for details too small to carry the dark tail, and
  `--accent` is the sky blue for lines too thin for a gradient.
- **Type.** The brand fonts (Unbounded, Onest, Red Hat Mono) stay on the nav,
  buttons, kickers, rail, chapter marker and the GROWENCY wordmark. Every
  section's headings and copy speak in their own type, set under "Section
  voices" in `styles.css`: Instrument Serif for the fund (a prospectus),
  Newsreader and IBM Plex for the emails (the template types in Plex Mono),
  Special Elite and Courier Prime for the strategy (a declassified memo),
  Archivo Narrow and Big Shoulders for the portfolio (a ticker board), Space
  Grotesk and Space Mono for the trade (a quant desk), Fraunces for the
  operators, Anton and Black Ops One for the refusals (a protest poster),
  Cormorant and EB Garamond for the terms (a signed contract), Bricolage
  Grotesque for the questions, and Syne for the close. That is 18 extra
  families from Google Fonts, so self-hosting and subsetting them matters
  before launch.
- **Radius.** Anything you can press is a pill, and so is the nav. Every surface
  is 14px. Stamps are square, so their gradient border can run all the way
  round.

## The archive

- `archive/2026-09-10-editorial/`: the ivory and forest editorial version.
- `archive/2026-09-10-gradient/`: the first blue and violet geometric sans version.
- The globe and letter version that this one replaced lives in git history, at
  commit `db88ec3`.
