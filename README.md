# Growency

Static landing page. Run locally with:

```sh
python3 -m http.server 4341
```

Open http://localhost:4341. No build step is required. `landing.js` progressively adds scroll and workflow animations; the content and navigation remain usable without JavaScript.

## Current landing page

- `index.html`: hero, client references, four illustrated workflow chapters, and footer.
- `landing.css`: responsive layout, brand colours, typography, workflow illustrations, and motion.
- `landing.js`: the central scroll rail and travelling mark, chapter navigation, staged workflow animations, replay, and pause controls.
- `workflow.js`: connected interactive demos using a local fictional prospect dataset. Filter by sector, role or region, search and select a lead, choose an outreach angle, edit a draft, simulate sending and receiving a reply, and choose and confirm a calendar slot. Nothing is transmitted or booked.
- Typography: Instrument Sans and Instrument Serif, currently loaded from Google Fonts.
- The brand gradient uses 21 colour samples taken from the unobstructed top edge of the supplied Growency cover. The cover's raster texture is approximated with a subtle noise layer; this is not a pixel-identical reproduction of the source image.
- The existing inline Growency mark is preserved.
- Client references link to Posting Machine (https://www.postingmachine.ai/) and Kairos Health, YC F26 (https://kairoshealthai.com/). They are labelled “Worked with”; no client outcomes or testimonials have been invented.
- All contact buttons currently open the existing Growency LinkedIn destination (https://www.linkedin.com/company/growency/). Replace these destinations when a calendar URL is available.
- Native anchor navigation works without JavaScript. Reduced-motion preferences disable animation and smooth scrolling; a visible pause control also disables motion.
- The workflow is illustrated with responsive HTML/CSS graphics: lead search and shortlist, prospect research, email and reply, and calendar handover. Prospects and conversations are explicitly labelled as samples. Selection carries through all four demos. Empty searches have a clear message; sending an empty message is disabled; choosing a new prospect refreshes the draft and resets confirmation states. These are service illustrations, not a claim that Growency sells the depicted software.
- The four chapters alternate around a central progress rail on desktop; the rail moves left and illustrations stack under the copy on mobile. The floating chapter button moves to the next step. Each workflow has a Replay control.
- The rejected editorial images were removed; the shipped page uses no generated raster photography.

## Existing supporting pages

`privacy.html` and `compare/` remain available. They retain `styles.css` and their previous design. The privacy document still contains draft placeholders requiring company details and legal review.

`script.js` and `scene.js` belong to the previous landing page and are no longer loaded by `index.html`. Previous landing implementations are available in Git history and `archive/`.
