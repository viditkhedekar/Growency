# Growency

Static landing page. Run locally with:

```sh
python3 -m http.server 4341
```

Open http://localhost:4341. No build step is required. `landing.js` and `campaign.js` progressively add scroll and campaign animations; the content and navigation remain usable without JavaScript.

## Current landing page

- `index.html`: split hero with a large video-ready film frame, a dedicated client slide, hedge-fund-for-sales pitch, four workflow chapters, founder and team slides, pilot term sheet, original FAQs, and comparison/privacy navigation.
- `slides.css`: full-screen sections, client wordmarks, pilot, FAQ, hover details and responsive layouts.
- `media.js`: hero video configuration. Set `GROWENCY_MEDIA.heroVideo` to the supplied file or URL when ready; the empty value keeps the subdued editorial poster. Video pauses offscreen, when the tab is hidden, and with reduced or paused motion.
- `interactions.js`: hover, keyboard-focus and tap details; video playback coordination.
- `landing.css`: responsive layout, brand colours, typography, workflow illustrations, and motion.
- `landing.js`: the full-page central scroll rail and travelling mark, fourteen milestones, chapter navigation and the global motion pause.
- `campaign.js` and `campaign.css`: four passive, looping Northstar campaign films. The same three prospects move through ideal-customer fit, research, personal outreach, follow-up, interested replies and calendar handover. Only the nearest visible film plays. There are no editable fields, clickable demo tabs, filters, booking controls or playback buttons inside the films. Global pause and reduced motion show completed frames; hidden tabs and offscreen films stop. Nothing is transmitted or booked. See `DEMO-FLOW.md`.
- Typography: Instrument Sans and Instrument Serif, currently loaded from Google Fonts.
- The brand gradient uses 21 colour samples taken from the unobstructed top edge of the supplied Growency cover. The cover's raster texture is approximated with a subtle noise layer; this is not a pixel-identical reproduction of the source image.
- The existing inline Growency mark is preserved. Founder/team copy comes from the supplied screenshots; initials are used until original portraits are supplied.
- The pitch displays the requested 8× higher conversion rate claim, with a keyboard/tap/hover explanation of alpha strategies. The hero uses the supplied booked-calls copy. Team cards show names only.
- Client references link to Posting Machine (https://www.postingmachine.ai/) and Kairos Health, YC F26 (https://kairoshealthai.com/). They are labelled “Worked with”; no client outcomes or testimonials have been invented.
- Business contact buttons open `contact.html`, which links to Vidit Khedekar and Growency on LinkedIn. Cohort applications link directly to https://www.linkedin.com/in/vidit-khedekar/. No calendar URL has been supplied.
- Native anchor navigation works without JavaScript. Reduced-motion preferences disable animation and smooth scrolling; a visible pause control also disables motion.
- The four campaign chapters place explanatory headlines beside films that occupy two-thirds of the desktop screen, with larger demonstration typography. They stack on smaller screens. The headlines type once on arrival and emphasise the relevant phrase in Instrument Serif italic. The large cursive introduction reads “Find. Research. Reach out. Book.” Northstar, Atlas Labs, Relay Systems, Lumen AI and all contacts/signals are fictional illustrations, disclosed in the footer.
- Seven original reference-inspired, grainy blue/violet editorial photographs are in assets/editorial/. Every landing chapter, the journey introduction and ending, and the footer use them as full-width backgrounds through `backgrounds.css`. Each has its own crop and tint: blue, lavender, violet, teal, rose or warm amber. Background opacity is generally 20–27%, raised from the earlier 14%; mobile workflow backgrounds use 20%. The hero keeps the sampled brand gradient below its photograph. WebP copies reduce download size; original generated PNGs remain available. The prompt directions are in assets/editorial/PROMPTS.md.
- `premium.css` and `rail.js` add the custom cursor, responsive text-clearing rail and floating meeting shortcut. The landing rail bends from the centre to the right before the four films, runs outside their content, then returns to the centre. Its traveller and illuminated stroke follow the same SVG path, including both turns. `assets/favicon.svg` is the gradient brand favicon across all pages.
- The rail clears copy and controls with a responsive mask. Fourteen milestones mark the traveller’s progress. `fluid.js` blends the shared palette continuously around each milestone; scrolling back smoothly restores earlier tones.
- `netting.css`, `netting.js` and `assets/netting*.svg` restore the original cube lattice from `scene.js` (commit `773624a`) across every landing chapter, the footer, comparison pages and privacy page. The net sits behind foreground content and drifts by only eight pixels over 24 seconds. Offscreen sections and hidden tabs pause it; the existing motion toggle and reduced-motion preference also stop movement.

## Existing supporting pages

`privacy.html` and `compare/` remain available. They retain `styles.css` and their previous design. The privacy document still contains draft placeholders requiring company details and legal review.

`script.js`, `scene.js`, `workflow.js`, `experience.js` and `live.js` are previous landing/demo implementations and are no longer loaded by `index.html`. Previous landing implementations are available in Git history and `archive/`.

## Company pages and pricing

- `index.html#pricing`: fees for booked calls and positive replies, with no commission on client sales. Rates and qualification criteria are agreed in writing after the pilot; no numerical prices have been invented. Pricing is included in the chapter rail and background transitions.
- `contact.html`: LinkedIn contact routes and a useful brief for starting a pilot conversation.
- `manifesto.html`: Growency’s principles of qualified opportunities, human judgement, measurable proof and keeping the client’s upside.
- `methodology.html`: offer mapping, research signals, alpha strategies, live pilot tests and optimisation for quality over quantity.
- `careers.html`: Founding GTM Operator — Pilot Cohort, all four stages, unpaid probation, learning requirements, compensation, fit and direct LinkedIn application instructions. Earnings examples are labelled performance-dependent; the full-time pay period has not been assumed.
- `pages.css` and `pages.js`: shared responsive company-page layout, native Company menu, photographed chapter backgrounds, animated netting, central milestones, text-clearing rail, cursor and motion controls. Content and navigation work without JavaScript.

## Fluid backgrounds and image variation

- Three additional generated scenes: `assets/editorial/strategy.png`, `call.png` and `handover.png`, with optimised WebP delivery copies. The exact built-in generation prompts are in `assets/editorial/PROMPTS-v2.md`.
- All seven photographs are distributed across the landing and company pages, avoiding identical backgrounds on adjacent slides. The hero film poster is preserved.
- `fluid.js` creates one continuous colour field under the whole page. Rail positions blend the palette using smoothstep and a brief easing period. Paper/night boundaries blend through the empty section margins, while photographs bleed and fade into neighbouring backgrounds. The sampled hero brand gradient is preserved with a soft bottom fade.
- Geometry is cached and refreshed for resizing, fonts, content height and disclosure changes. Scroll frames avoid layout reads; easing stops when settled or when the tab is hidden. Reduced or paused motion applies colours without animated easing. Original section colours remain available without JavaScript.
