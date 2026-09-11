# Growency

Static one page site. No build step, no dependencies. Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 4341
```

## Files

| File | What it holds |
| --- | --- |
| `index.html` | All page content and copy, plus the logo mark as an inline SVG symbol |
| `styles.css` | Light and dark tokens, type, every section |
| `script.js` | Intro, hero globe, the self-writing letter and its Copy button, reveals, redactions, strike-outs, the counter, the lifecycle codes |
| `archive/` | Three previous versions of the site, each kept whole |

## Before this goes live

- **Booking links.** Every "Request the pilot" button scrolls to the term sheet or the closing band. The closing one is `href="#"` and needs the real destination. Marked `TODO` in `index.html`.
- **Two image slots.** The operators section has two placeholder frames: a team photo (about 2400 x 1400) and a research or workspace detail (about 1200 x 1400). Real photos only, no stock. Each is marked `TODO` in `index.html`.
- **Fonts.** Plus Jakarta Sans and JetBrains Mono load from Google Fonts. Self-host both with `@font-face` before launch.
- **Sample data.** Dana, Meridian Labs and the email in the hero letter are invented. The footer says so.
- **The logo.** `#mark` is a hand-rebuilt vector of the brand image, not the official file. Swap in the real asset and every `<use href="#mark">` picks it up. The intro and the hero globe read their geometry from the same path, so check both still work after a swap.

## The 30-40x figure

Shown twice: the badge on the hero letter and the large numeral in the proof section. It is the company's stated position rather than an audited result, and by instruction it carries no caveat on the page. The two places to edit are `.badge` in the hero and `.proof`.

## How this version was shaped

Four references from Eleken's "50 best website design examples" (numbers 18, 19, 27 and 28), filtered through the taste skill at `~/.claude/skills/design-taste-frontend/`:

- **Fabric (18):** a live generative wireframe behind the headline. Here it is the logo's own lattice wrapped onto a slowly turning sphere.
- **Hydra (19):** one confident brand colour. Its humour was left out on purpose, since the brief was "more professional".
- **Fluent (27):** show the product working. The hero letter is a real component with a real Copy button, not a picture of one.
- **Umbrel (28):** a short bold tagline with a gradient on one word, and a frosted glass panel in a split screen.

## Notes

- **Theme.** Follows the visitor's light or dark setting via `prefers-color-scheme`. Every colour is a token at the top of `styles.css`, redefined once for dark. The closing band is the one fixed colour block, the brand gradient, in both modes.
- **One accent.** Electric blue (`--accent`) for codes, ticks, carets, focus and hover. The blue to violet gradient appears only on the word "Marketing" and the closing band. Strike-outs are neutral grey, not red.
- **Type.** Plus Jakarta Sans for every headline and all body copy (it also sets the wordmark). JetBrains Mono only for data: the numeral, the lifecycle codes, the term sheet labels. No serif.
- **Radius rule.** Anything you can press is a pill. Every surface is 14px.
- **The hero globe.** Each point of the flat mark is mapped onto a hemisphere, mirrored for the back, and the logo's ring becomes the equator. Segments are split in four so they curve. It turns slowly, tilts toward the pointer, dims with depth, and stops drawing whenever the hero is off screen or the tab is hidden. Under reduced motion it draws one still frame.
- **The intro.** A full screen assembly of the mark that plays once per session, is skippable with a click, key, scroll or touch, never runs under reduced motion, and is `display:none` until the script opts in.
- **The letter.** Types a generic template, strikes the weak lines, grows the specific ones in underneath, holds, and loops. Copy puts the finished email on the clipboard, with a fallback for browsers without the Clipboard API. The finished version is what sits in the markup.
- **No scroll listeners.** The nav background, reveals, redactions, strike-outs, the counter and the lifecycle codes are all driven by `IntersectionObserver`.
- **Works without JavaScript.** Hidden reveal states and redaction bars only exist once `<html>` has the `js` class, which a one-line script in the head adds. With scripts off, every word is visible and the Copy button stays hidden.
- `prefers-reduced-motion` skips the intro, freezes the globe, shows the letter finished, opens every redaction and completes every strike-out.

## The archive

- `archive/2026-09-10-editorial/`: the ivory and forest editorial version.
- `archive/2026-09-10-gradient/`: the first blue and violet geometric sans version.
- The trading floor version before this pass lives in git history (commit `4dfa11e`).
