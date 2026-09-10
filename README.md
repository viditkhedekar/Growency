# Growency

Static one page site. No build step, no dependencies. Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 4327
```

## Files

| File | What it holds |
| --- | --- |
| `index.html` | All page content and copy, plus the logo mark as an inline SVG symbol |
| `styles.css` | Palette, type, layout, the gradient panels |
| `script.js` | Nav state, scroll reveals, the pointer glow on the six cards |
| `archive/` | The previous version of the site, kept whole |

## Before this goes live

- **Booking links.** Three buttons say "Book a call". The nav and the pilot section scroll to the closing section; that closing button is `href="#"` and needs the real destination. Marked with a `TODO` in `index.html`.
- **The logo.** `#mark` in `index.html` is a hand-rebuilt vector of the brand image, not the official file. It is a rhombille lattice clipped to a circle, drawn in `currentColor` so it inherits whatever colour sits around it. Swap in the real asset when there is one and the four `<use href="#mark">` instances pick it up.
- **The font.** Plus Jakarta Sans stands in for the geometric sans in the brand image. Changing `--sans` at the top of `styles.css` re-sets the whole page.

## Notes

- **No proof on this page by choice.** There are no statistics, client logos or testimonials anywhere, so nothing invented can go live by accident. The 30 to 40 times conversion figure from the company profile is deliberately not on the page. It is a performance claim about an early-stage business and it needs a source before it is published. The footer carries the honest version: results vary with your offer, market, funnel, domain reputation and sales follow-through.
- **The gradient is spent twice.** Only the hero and the closing call use it. Everything between them sits on `--void`, a near black. A long page of saturated gradient becomes unreadable, and holding it back makes the two places it does appear land harder. It is one token, `--grad`, if you want it elsewhere.
- **The mark is drawn, not drawn on.** A small script generated the lattice geometry: flat-top hexagons on a triangular grid, each with three spokes to alternating vertices, which is what produces the tumbling-cube read. Six vertices carry filled nodes. The whole thing is clipped to a circle slightly inside the outer ring so no line touches the edge.
- **Grain.** A fixed noise overlay at 5% sits above everything. Without it the gradient panels read as flat CSS.
- **The seven Alpha technique cards** never divide evenly into a grid, so the last one spans the full row rather than leaving holes. That rule is `.tech__item:last-child` and it works at any column count.
- **The six revenue cards** have a violet glow that follows the pointer, driven by `--mx` and `--my` set in `script.js`. It is off on coarse pointers and under reduced motion.
- **Copy comes from the company profile**, rewritten for the page rather than pasted. Alpha strategies, the two-week pilot, the tooling (Clay, Apollo, Origami), the six revenue points and both fit lists all trace back to it.
- `prefers-reduced-motion` shows every revealed element immediately and disables the pointer glow and all transitions.
- The page is readable with `script.js` missing. Reveals fall back to visible rather than leaving a page of invisible text.

## The archive

`archive/2026-09-10-editorial/` holds the previous site whole: the ivory and forest editorial version with Fraunces display type, the weighted glide scroller, the six panel product walkthrough and the self-writing hero letter. It has its own README explaining how each piece worked. Nothing in it is wired into this build.
