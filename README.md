# Growency

Static one page site. No build step, no dependencies. Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 4331
```

## Files

| File | What it holds |
| --- | --- |
| `index.html` | All page content and copy, plus the logo mark as an inline SVG symbol |
| `styles.css` | Palette, the three type families, every section |
| `script.js` | Nav state, reveals, the redactions, the strike-outs, the figure, the rail |
| `archive/` | Two previous versions of the site, each kept whole |

## Before this goes live

- **Booking links.** The nav and hero buttons scroll to the term sheet and the closing section. The closing "Request the Pilot" is `href="#"` and needs the real destination. Marked with a `TODO` in `index.html`.
- **The ticker is sample data.** Every fragment in the hero ticker is invented: Meridian Labs, Arbor Group, Cadence, Fieldnote, Halston & Co, Northbound, and every figure attached to them. The nav readout (`ALPHA-04 ▲ 34%`) is invented too, and so are Dana and Meridian Labs in the hero letter. None of it is real activity. Flagged in the markup, and the footer says so in print.
- **The logo.** `#mark` is a hand-rebuilt vector of the brand image, not the official file. Swap in the real asset and both `<use href="#mark">` instances pick it up.

## The 30–40× figure

It appears twice: stamped on the hero letter, and as the large numeral in the proof strip. It is the company's own stated performance position rather than an audited result, and it now carries no caveat anywhere on the page, by explicit instruction. If that ever needs to change, the two places to edit are `.stamp` in the hero and `.proof` further down.

## Notes

- **The concept is a trading desk, not an agency site.** Heavy serif for conviction, monospace for anything that reads as machine output, near black ground, and the blue to violet gradient held back for the hero and the closing call so those two land hard.
- **Three type families, each with one job.** Fraunces at 700 and 900 for display and conviction lines. JetBrains Mono for codes, labels, term sheet fields, tickers and fine print. Plus Jakarta Sans for the wordmark and body copy. The wordmark stays sans because that is what the brand image shows.
- **No green.** The original concept called for acid green as the terminal accent. The palette here is blue and violet, so `--electric` (`#6E8BFF`) does that job instead: codes, cursors, checkmarks, hover states, the rail fill. Used sparingly and nowhere as a background.
- **Signal red** (`#D14343`) appears only on things being struck out. Two places, both deliberate.
- **The intro.** A full screen canvas assembly of the mark: particles scatter, converge on the lattice vertices, the lines draw between them from the centre outward, then the ring closes and the whole thing lifts. The geometry is parsed at runtime straight off the `#mark` path, so the animation and the logo can never drift apart. Note that the path carries negative coordinates, because the lattice runs past the circle and the SVG clips it; the parser keeps only the segments that fall inside the ring. It is skippable with a click, a key, a scroll or a touch, plays once per session (`sessionStorage`), never runs under reduced motion, and has a hard timeout so a stalled frame loop cannot leave the page locked behind an overlay. The overlay is `display:none` until the script opts in, so with JavaScript off it never appears at all.
- **The hero letter.** A composer panel rather than paper, since the memo and the term sheet already own the ivory stock. The generic template types itself in, the weak lines are struck through in the same red used on the positions we will not take, and the specifics grow in underneath. The specific version is what sits in the markup, so with JavaScript off or under reduced motion the finished letter is what shows. One cycle is about nine seconds and it pauses when off screen or when the tab is hidden.
- **The stamp lands.** It scales down from a larger rotation on load, with a slight overshoot, so it reads as pressed rather than faded in. It sits on the top-right corner of the letter, and the letter header reserves space so nothing runs underneath it. On mobile it drops into the flow above the letter instead.
- **The redactions.** Black bars retract right to left, one every 260ms, then a red rule draws through the word underneath. The markup contains the words in plain text, so with JavaScript off or under reduced motion the list is simply readable.
- **The strike-outs** on the dark panel use the same idea in serif at display size, triggered per line as each crosses the viewport.
- **The rail** beside the six lifecycle steps fills as they pass the middle of the screen. It is sticky, one pixel wide, and hidden below 680px where the steps stack.
- **The six steps** use trade lifecycle names with a plain-English line under each, so a buyer who does not work in finance can still follow what happens.
- **The pilot is a term sheet**, on the same ivory paper stock as the memo. Field labels in mono, dashed rules, and a signature line at the bottom that is the call to action.
- `prefers-reduced-motion` skips the intro entirely, stops the ticker, cancels the stamp, shows the letter finished, opens every redaction, completes every strike-out and shows all revealed content immediately.
- The page is readable with `script.js` missing. The intro overlay never renders, reveals fall back to visible, redactions fall back to open and the letter sits in its finished state, rather than leaving a page of invisible or permanently hidden text.

## The archive

- `archive/2026-09-10-editorial/` is the ivory and forest editorial version: Fraunces display type, paper grain, a custom cursor, the weighted glide scroller, a six panel product walkthrough and a self-writing hero letter.
- `archive/2026-09-10-gradient/` is the blue and violet geometric sans version. Its palette carried forward into this build. Its layout and copy did not.

Each has its own README. Neither is wired into this build.
