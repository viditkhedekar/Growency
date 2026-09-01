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
- The walkthrough uses `scroll-snap-type: y proximity` on the root. Switch it to `y mandatory` in `styles.css` if you want each panel to click into place harder. Snapping and the numeral rail both switch off below 900px.
- `prefers-reduced-motion` disables every animation, the snapping and the typing effect.
