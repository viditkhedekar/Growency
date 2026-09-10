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
- **The ticker is sample data.** Every fragment in the hero ticker is invented: Meridian Labs, Arbor Group, Cadence, Fieldnote, Halston & Co, Northbound, and every figure attached to them. The nav readout (`ALPHA-04 ▲ 34%`) is invented too. None of it is real activity. Flagged in the markup, and the footer says so in print.
- **The logo.** `#mark` is a hand-rebuilt vector of the brand image, not the official file. Swap in the real asset and both `<use href="#mark">` instances pick it up.

## The 30–40× figure

It appears twice: stamped in the hero, and as the large numeral in the proof strip. It is the company's own stated performance position and it is **not an audited result**, so the caveat travels with it in three places:

1. Inside the stamp itself, in small type: `CLAIMED · NOT AUDITED`
2. Under the numeral, as fine print naming what the outcome actually depends on
3. In the footer boilerplate

Do not move or delete the figure without moving the caveat with it. If a real measured number ever exists, replace both together.

## Notes

- **The concept is a trading desk, not an agency site.** Heavy serif for conviction, monospace for anything that reads as machine output, near black ground, and the blue to violet gradient held back for the hero and the closing call so those two land hard.
- **Three type families, each with one job.** Fraunces at 700 and 900 for display and conviction lines. JetBrains Mono for codes, labels, term sheet fields, tickers and fine print. Plus Jakarta Sans for the wordmark and body copy. The wordmark stays sans because that is what the brand image shows.
- **No green.** The original concept called for acid green as the terminal accent. The palette here is blue and violet, so `--electric` (`#6E8BFF`) does that job instead: codes, cursors, checkmarks, hover states, the rail fill. Used sparingly and nowhere as a background.
- **Signal red** (`#D14343`) appears only on things being struck out. Two places, both deliberate.
- **The stamp lands.** It scales down from a larger rotation on load, with a slight overshoot, so it reads as pressed rather than faded in. Disabled on mobile, where it flows under the headline instead of overlapping it.
- **The redactions.** Black bars retract right to left, one every 260ms, then a red rule draws through the word underneath. The markup contains the words in plain text, so with JavaScript off or under reduced motion the list is simply readable.
- **The strike-outs** on the dark panel use the same idea in serif at display size, triggered per line as each crosses the viewport.
- **The rail** beside the six lifecycle steps fills as they pass the middle of the screen. It is sticky, one pixel wide, and hidden below 680px where the steps stack.
- **The six steps** use trade lifecycle names with a plain-English line under each, so a buyer who does not work in finance can still follow what happens.
- **The pilot is a term sheet**, on the same ivory paper stock as the memo. Field labels in mono, dashed rules, and a signature line at the bottom that is the call to action.
- `prefers-reduced-motion` stops the ticker, cancels the stamp, opens every redaction, completes every strike-out and shows all revealed content immediately.
- The page is readable with `script.js` missing. Reveals fall back to visible and redactions fall back to open rather than leaving a page of invisible or permanently hidden text.

## The archive

- `archive/2026-09-10-editorial/` is the ivory and forest editorial version: Fraunces display type, paper grain, a custom cursor, the weighted glide scroller, a six panel product walkthrough and a self-writing hero letter.
- `archive/2026-09-10-gradient/` is the blue and violet geometric sans version. Its palette carried forward into this build. Its layout and copy did not.

Each has its own README. Neither is wired into this build.
