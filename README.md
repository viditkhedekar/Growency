# Growency

Static landing page. Run locally with:

```sh
python3 dev_server.py 4341
```

Open http://localhost:4341. No build step is required. `landing.js` and `campaign.js` progressively add scroll and campaign animations; the content and navigation remain usable without JavaScript.

## Page URLs

The public pages use `/`, `/careers`, `/contact`, `/privacy`, and `/compare/<name>` without `.html` or a trailing slash. `vercel.json` enables Vercel's `cleanUrls` and redirects `/index` and `/index.html` to `/`. Existing `.html` page URLs redirect permanently to the clean URLs. Navigation and footer links use these canonical paths; homepage section links use `/#section`.

The source files keep their `.html` names. `dev_server.py` serves the same clean routes and legacy redirects locally so navigation works in the preview. Use this server instead of Python's generic `http.server`, which doesn't resolve extensionless page paths. Recheck FormSubmit delivery from `/careers` after publishing if it requests activation for the new form URL.

## Current landing page

- `index.html`: split hero with a large video-ready film frame, a dedicated client slide, hedge-fund-for-sales pitch, four workflow chapters, founder and team slides, one-week pilot term sheet, original FAQs, and comparison/privacy navigation.
- `slides.css`: full-screen sections, client wordmarks, pilot, FAQ, hover details and responsive layouts.
- `media.js`: hero video configuration. Set `GROWENCY_MEDIA.heroVideo` to the supplied file or URL when ready; the empty value keeps the subdued editorial poster. Video pauses offscreen, when the tab is hidden, and with reduced or paused motion.
- `interactions.js`: hover, keyboard-focus and tap details; video playback coordination.
- `landing.css`: responsive layout, brand colours, typography, workflow illustrations, and motion.
- `landing.js`: the full-page central scroll rail and travelling mark, fourteen milestones, chapter navigation and the global motion pause.
- `campaign.js` and `campaign.css`: four passive, looping Northstar campaign films. The same three prospects move through ideal-customer fit, research, personal outreach, follow-up, interested replies and calendar handover. Only the nearest visible film plays. There are no editable fields, clickable demo tabs, filters, booking controls or playback buttons inside the films. Global pause and reduced motion show completed frames; hidden tabs and offscreen films stop. Nothing is transmitted or booked. See `DEMO-FLOW.md`.
- Typography: Instrument Sans and Instrument Serif, currently loaded from Google Fonts.
- The brand gradient uses 21 colour samples taken from the unobstructed top edge of the supplied Growency cover. The cover's raster texture is approximated with a subtle noise layer; this is not a pixel-identical reproduction of the source image.
- The existing inline Growency mark is preserved. Founder/team copy comes from the supplied screenshots. The team section uses the supplied portraits from `assets/team/`, with Vivin’s card above Vidit’s; `team.css` keeps the layout responsive. The founder quote retains its initial badge.
- The pitch displays the requested 8× higher conversion rate claim, with a keyboard/tap/hover explanation of alpha strategies. The hero uses the supplied booked-calls copy. Team cards show names only.
- Client references link to Posting Machine (https://www.postingmachine.ai/) and Kairos Health, YC F26 (https://kairoshealthai.com/). They are labelled “Worked with”; no client outcomes or testimonials have been invented.
- Business meeting buttons and floating shortcuts open https://calendly.com/vidit-khedekar/30min in a new tab, including contact, company, comparison and privacy pages. Contact navigation opens `/contact`; cohort applications use the form on `/careers#apply`, with LinkedIn available for questions.
- Native anchor navigation works without JavaScript. Reduced-motion preferences disable animation and smooth scrolling; a visible pause control also disables motion.
- The four campaign chapters place explanatory headlines beside films that occupy two-thirds of the desktop screen, with larger demonstration typography. They stack on smaller screens. The headlines type once on arrival and emphasise the relevant phrase in Instrument Serif italic. The large cursive introduction reads “Find. Research. Reach out. Book.” Northstar, Atlas Labs, Relay Systems, Lumen AI and all contacts/signals are fictional illustrations, disclosed in the footer.
- Seven original reference-inspired, grainy blue/violet editorial photographs are in assets/editorial/. Every landing chapter, the journey introduction and ending, and the footer use them as full-width backgrounds through `backgrounds.css`. Each has its own crop and tint: blue, lavender, violet, teal, rose or warm amber. Background opacity is generally 20–27%, raised from the earlier 14%; mobile workflow backgrounds use 20%. The hero keeps the sampled brand gradient below its photograph. WebP copies reduce download size; original generated PNGs remain available. The prompt directions are in assets/editorial/PROMPTS.md.
- `premium.css` and `rail.js` add the custom cursor, responsive text-clearing rail and floating meeting shortcut. The landing rail bends from the centre to the right before the four films, runs outside their content, then returns to the centre. Its traveller and illuminated stroke follow the same SVG path, including both turns. `assets/favicon.svg` is the gradient brand favicon across all pages.
- The rail clears copy and controls with a responsive mask. Fourteen milestones mark the traveller’s progress. `fluid.js` holds the full-page palette between milestones. When the traveller reaches a node, the entire colour field eases into the next restrained blue, lilac, periwinkle or teal palette; scrolling back restores the earlier scene. Section boundaries have wider spatial fades. Photograph edges overlap by 160px on desktop and 100px on mobile, with a gradual opacity feather and masked 20px edge blur on desktop; the middle of each image and all foreground content stay sharp. Pitch, quote and footer containers allow the photographs to overlap their section boundaries; the footer is its own photograph positioning container, has no hard divider line, and its photograph still ends at the page bottom. Company pages use the same milestone-triggered transitions with deeper navy, violet and teal shades.
- `netting.css`, `netting.js` and `assets/netting*.svg` restore the original cube lattice from `scene.js` (commit `773624a`) across every landing chapter, the footer, comparison pages and privacy page. The net sits behind foreground content and drifts by only eight pixels over 24 seconds. Offscreen sections and hidden tabs pause it; the existing motion toggle and reduced-motion preference also stop movement.

## Existing supporting pages

`privacy.html` and `compare/` remain available. They retain `styles.css` and their previous design. The privacy document still contains draft placeholders requiring company details and legal review.

`script.js`, `scene.js`, `workflow.js`, `experience.js` and `live.js` are previous landing/demo implementations and are no longer loaded by `index.html`. Previous landing implementations are available in Git history and `archive/`.

## Company pages and pricing

- `index.html#pricing`: fees for booked calls and positive replies, with no commission on client sales. Rates and qualification criteria are agreed in writing after the pilot; no numerical prices have been invented. Pricing is included in the chapter rail and background transitions.
- `contact.html`: Calendly booking and LinkedIn contact routes, plus context for a pilot conversation.
- `careers.html` and `careers.css`: the supplied Founding GTM Operator - Pilot Cohort copy, including all stages and learning requirements, followed by a native application form. It collects name, email, academic qualifications, location, an optional LinkedIn/CV link, relevant experience, motivation, weekly availability, earliest start date, and tool familiarity. Applications POST to FormSubmit for delivery to `vidit.khedekar@gmail.com`, with the applicant’s email as Reply-To, a dedicated application subject, and a table email template. Native browser validation, FormSubmit’s default CAPTCHA, and a hidden honeypot protect the form. No JavaScript is needed to submit. After submitting, applicants complete FormSubmit’s verification and see its confirmation page. The page still provides LinkedIn for questions.
- Email setup: FormSubmit requires a one-time recipient activation. The first submission triggers a confirmation email to `vidit.khedekar@gmail.com`; follow that email’s activation link before accepting applications, then submit a test application and verify its arrival. Without activation, delivery is not ready. No SMTP secrets are included in the static site. Test email delivery separately from local rendering; it depends on FormSubmit and recipient activation.
- Verified 11 October 2026: activated FormSubmit for the local careers preview and confirmed a clearly labelled delivery test reached `vidit.khedekar@gmail.com`. Gmail classified the test as Spam; mark it “Not spam” to help subsequent applications reach the inbox. Recheck delivery from the public URL after publishing, including any activation prompt for that URL. Browser checks covered ten fields, required/email/URL/hours validation, all selected answers in the POST payload, widths from 320px to 1440px, and operation without JavaScript. Production submissions retain FormSubmit’s default CAPTCHA; the delivery test used its supported AJAX endpoint.
- `compare/*.html` and `comparison.css`: all six comparisons use the current company-page shell, Instrument typography, responsive navigation, editorial chapter images, fluid milestone backgrounds, central rail, motion controls and Calendly booking. Comparison content and source dates are preserved; the table scrolls within its own region on small screens and the rail clears its content.
- `pages.css` and `pages.js`: shared responsive company-page layout, native desktop Company and compact mobile menus, photographed chapter backgrounds, animated netting, central milestones, text-clearing rail, cursor and motion controls. Content and navigation work without JavaScript. `navigation.js` closes menus after navigation, outside clicks or Escape. The header switches to a compact menu at 960px and keeps its brand, booking button and menu usable down to 320px.

## Pinned workflow demos

- `demo-scroll.js` and `demo-scroll.css` hold the four existing passive campaign films in one native sticky viewport. About 1.1 viewport lengths of scroll advance each stage; the active film keeps looping, while copy, photographs and milestone palettes switch together. Reverse scrolling restores the previous stage. No wheel locking or forced snap is used.
- A four-stage side meter shows the current stage and continuous scroll progress. Only the active film runs, and inactive pinned panels are inert and hidden from assistive technology. Offscreen and hidden films pause their current wait and stopwatch, then resume at the same point. The central rail uses the virtual milestone positions of the pinned sequence.
- At widths below 1101px, heights below 740px, or with reduced motion, the complete demos remain in normal document flow with a readable horizontal sticky stage meter. Pause motion keeps the sticky layout but stops film playback, typing, colour easing and scroll inertia.

## Smooth scrolling

- `smooth-scroll.js` uses locally vendored Lenis 1.3.26 with light wheel easing (`lerp: 0.18`) for a quicker response and shorter trailing motion. Scroll distance is unchanged; touch gestures stay native. Anchor links, nested scrolling, the rail and milestone backgrounds continue to use the browser’s actual scroll position.
- Touch devices, windows below 1101px, reduced motion and the existing Pause motion control use native scrolling; the smoother is destroyed when disabled. The library is stored in `assets/vendor/lenis/` with its MIT license; no CDN is required.

## Fluid backgrounds and image variation

- Three additional generated scenes: `assets/editorial/strategy.png`, `call.png` and `handover.png`, with optimised WebP delivery copies. The exact built-in generation prompts are in `assets/editorial/PROMPTS-v2.md`.
- All seven photographs are distributed across the landing and company pages, avoiding identical backgrounds on adjacent slides. The hero film poster is preserved.
- `fluid.js` creates one continuous colour field under the whole page. The palette holds between rail milestones, then eases into the next scene when the traveller crosses a node. Paper/night boundaries blend through the empty section margins, while photographs bleed and fade into neighbouring backgrounds. The sampled hero brand gradient is preserved with a soft bottom fade.
- Geometry is cached and refreshed for resizing, fonts, content height and disclosure changes. Scroll frames avoid layout reads; easing stops when settled or when the tab is hidden. Reduced or paused motion applies colours without animated easing. Original section colours remain available without JavaScript.

## Mobile scroll performance

- The rail mask rebuilds on layout changes, not on demo or milestone animation completion. Mobile illumination uses a fixed, viewport-sized SVG over the static full-page track. The traveller moves with a transform; chapter and demo geometry are cached between layout changes.
- Phones and coarse-pointer devices keep the lattice static and omit photograph backdrop blur. Palette changes apply once per milestone instead of repainting the full-page background throughout an easing animation.
