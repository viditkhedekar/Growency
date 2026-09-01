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
- **Walkthrough mockups.** The names, addresses and reply text inside the six panels are fictional set dressing.

## Notes

- Fonts load from Google Fonts (Fraunces for display, Inter for body). Self host them if the site needs to work offline.
- **Accent colour** is one green in two stops: `--accent-dk` (#3F6B4B) for the ivory sections, `--accent-lt` (#C3DBB8) for the dark ones. Sections override `--accent`, so changing those two values at the top of `styles.css` re-tints the whole page.
- **Scrolling** is a weighted glide written in `script.js`: the wheel feeds a target, the page eases toward it, and when the wheel goes quiet it drifts onto the nearest walkthrough panel. It only runs with a fine pointer, above 900px wide, and with motion allowed. Everywhere else the browser scrolls natively and the CSS `scroll-snap-type: y proximity` fallback takes over. `lerp` controls the weight, `reach` in `settle()` controls how close a panel has to be to pull.
- **The custom cursor** is a dot that grows and names the action. Add `data-cursor="Word"` to anything that should carry a label. It flips light or dark based on what sits under it, and it is off entirely on touch devices and under reduced motion.
- **The window mocks** each run as a looping clip on one `--loop` clock (9s, set in `styles.css`). Everything inside a frame is paused until its panel is on screen, the thin bar along the bottom of each window is the playhead, and the numbers re-count on every pass. Anything that has to happen in sequence uses absolute keyframe percentages rather than `animation-delay`, so all the parts of one window stay on the same take.
- `prefers-reduced-motion` disables the glide, the cursor, the looping clips and every transition.
