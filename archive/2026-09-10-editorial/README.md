# Growency

Static one page site. No build step, no dependencies. Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 4319
```

## Files

| File | What it holds |
| --- | --- |
| `index.html` | All page content and copy |
| `styles.css` | Palette, type, layout, the walkthrough panels |
| `script.js` | Scroll reveals, the six panel walkthrough, count up numerals |

## Before this goes live

Everything below is a placeholder. Each one is marked with a `TODO` comment in `index.html`.

- **Links.** Every `href="#"` needs the real destination: nav "Book a Call", hero "Request an Audit", final CTA.
- **Client logos.** Six invented wordmarks sit in the trust bar. Replace with real logos, ideally inline SVG so the grayscale to colour hover keeps working.
- **Results.** The three figures (38%, 4.2x, 412) and the pull quote are invented. Do not publish them as they are. Attribution reads `[Client name], [Title], [Company]` on purpose so it cannot be mistaken for a real testimonial.
- **Founder photo.** `.founders__photo` holds a gradient block. Drop an `<img>` in its place and the green duotone filter applies automatically.
- **The hero letter.** Dana, Meridian Labs, the SSO detail and the questionnaire line are invented. Replace them with a real anonymised example before this goes live, keeping the `data-generic` / `data-specific` pair on each `.ln`.
- **The funnel numbers.** 2,940 down to 118 across six stages is illustrative. The values live in `STAGES` at the top of the funnel module in `script.js`.
- **Walkthrough mockups.** The names, addresses and reply text inside the six panels are fictional set dressing.

## Notes

- **The hero letter** rewrites itself. Each `.ln` carries `data-generic` (the template) and `data-specific` (the real thing); the specific version is what sits in the markup, so with JS off, or under `prefers-reduced-motion`, the finished letter is what shows. `script.js` types the template in, draws a strike through three phrases, then grows the specifics in underneath. One pass is roughly nine seconds and it only runs while the letter is on screen. Timings are the `TYPE`, hold and `t +=` values inside `pass()`.
- **The funnel** is the fixed block in the bottom left. It appears once the hero is behind you, counts down one stage per walkthrough step, flips pale on the dark sections, and hides below 900px. Stages are the `STAGES` array in `script.js`.
- **The turn** is the single cropped line between the problem and the method. `font-size: 23vw` with `white-space: nowrap` and a negative inline margin, so it always bleeds past both edges.
- **The ink** is the accent wash that floods into the method section. `script.js` measures the wordmark dot in the nav and writes `--ink-x` / `--ink-y` onto `.method`, then a `clip-path: circle()` opens from that point. Change the origin by moving the dot, not the CSS.
- **The deck spine** is one line down all six steps with a fill that tracks scroll progress. It sits at the same x as the step rail and has replaced the rail's own short line, so the numerals sit directly on it. The six panels also share one continuous background gradient now rather than a different green each, which is what made them read as separate slides.

- Fonts load from Google Fonts (Fraunces for display, Inter for body). Self host them if the site needs to work offline.
- **Accent colour** is one green in two stops: `--accent-dk` (#3F6B4B) for the ivory sections, `--accent-lt` (#C3DBB8) for the dark ones. Sections override `--accent`, so changing those two values at the top of `styles.css` re-tints the whole page.
- **Scrolling** is a weighted glide written in `script.js`: the wheel feeds a target, the page eases toward it, and when the wheel goes quiet it drifts onto the nearest walkthrough panel. It only runs with a fine pointer, above 900px wide, and with motion allowed. Everywhere else the browser scrolls natively and the CSS `scroll-snap-type: y proximity` fallback takes over. `lerp` controls the weight, `reach` in `settle()` controls how close a panel has to be to pull.
- **The custom cursor** is a dot that grows and names the action. Add `data-cursor="Word"` to anything that should carry a label. It flips light or dark based on what sits under it, and it is off entirely on touch devices and under reduced motion.
- **The product mocks.** Each of the six panels shows one screen of the same fictional internal tool: Segments, People, Sequences, Deliverability, Inbox, Reports, with the matching item lit in the sidebar. They are built at a fixed design size (`--aw`, 760px wide by 470 tall) and scaled by `script.js` to whatever width the panel gives them, so the interface keeps the density and proportions of a real screenshot rather than being drawn at landing-page scale. Below 680px the sidebar is dropped and the design width falls to 600px, which buys back legibility.
- **How the clips run.** Everything inside a frame sits on one `--loop` clock (9s, top of `styles.css`) and is paused until its panel is on screen. A pointer moves and clicks through each one: it hits Run and the segment count falls 2,940 → 118, hits Verify all and the statuses flip row by row, selects a line and clicks Rewrite, hovers the chart for a tooltip, opens the week menu and picks Week 09. Anything that has to happen in sequence uses absolute keyframe percentages rather than `animation-delay`, so all the parts of one window stay on the same take. The thin bar along the bottom is the playhead, and the numbers re-count on every pass (`data-at` on a `.counter` delays it to its cue in the clip).
- **The mock UI is light on purpose**, because that is what reads as a genuine screenshot against the dark panel. To flip it dark, change the six theme variables on `.app` in `styles.css` (`--w`, `--bg`, `--side`, `--line`, `--ink`, `--mut`, `--fai`) and nothing else needs to move.
- **All mock data is invented.** Names, companies, email addresses, reply text, scores and domains inside the six windows are set dressing for a tool that does not exist yet. The interface is deliberately not modelled on any real product.
- `prefers-reduced-motion` disables the glide, the cursor, the looping clips and every transition.
