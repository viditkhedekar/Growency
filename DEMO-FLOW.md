# Growency campaign films

Four passive, looping illustrations tell one Northstar outbound story. Northstar is a fictional finance reporting and forecasting platform connecting accounting, banking and CRM data. The same three fictional prospects recur in every film. Nothing is sent, submitted or booked.

| Prospect | Company | Research opening | Agreed calendar slot |
| --- | --- | --- | --- |
| Maya Patel, CFO | Atlas Labs | New US entity and multi-entity forecasting | Tuesday, 10:30 |
| Daniel Wong, Founder | Relay Systems | First finance hire and founder-led reporting | Wednesday, 14:00 |
| Sofia Martins, VP Finance | Lumen AI | UK/Portugal expansion and cross-entity reporting | Thursday, 11:00 |

| Film | Sequence | Outcome |
| --- | --- | --- |
| Find | Type seven ideal-customer criteria → collapse criteria → reveal Maya → tick seven fit checks → shortlist → repeat for Daniel and Sofia | Three focused prospects ready for research |
| Research | Select Maya’s visual tab → reveal five account findings → highlight the relevant opening → repeat for Daniel and Sofia | A specific reason to reach out to each person |
| Reach out | Type a personal email from the research at an accelerated human rhythm → send → show a relevant follow-up → receive interested reply with an agreed time → repeat for each person | Genuine interest tied to the eventual calendar slot |
| Book | Show three calendar blocks → automatically expand Maya’s briefing → Daniel’s → Sofia’s | Research, role, company, pain and conversation context handed over |

## Playback

- The films contain no interactive controls. Tabs, checkboxes, email content and calendar blocks are visual elements, never editable or clickable.
- Only the visible film closest to the viewport centre plays. It holds its outcome before looping; it never scrolls the page. Leaving the viewport or hiding the tab pauses the current wait and stopwatch. Returning resumes the same sequence instead of restarting it.
- Each film has a stopwatch icon, a playback progress bar and an elapsed / total time counter. Durations come from the animation timings, including the final hold; the bar resets with every loop. Offscreen and hidden films pause their clocks and resume from the same elapsed time. Paused and reduced-motion previews show the completed duration.
- Pointer movement and click rings are scripted only at meaningful visual targets: a person tab, email send state or calendar block. There are no random button clicks or unrelated feeds.
- Global Pause motion and reduced-motion preferences show complete, readable frames without synthetic pointers or typing.
- The adjacent explanatory headline types once on arrival, emphasises its key phrase and remains complete afterward. Its full height is reserved while typing. Screen readers receive the complete copy immediately.
- `campaign.js` owns the illustration data and choreography; `campaign.css` owns the visual frames and motion. The older interactive demo scripts remain in the repository but are not loaded on the landing page.

## Responsive scrolling

- Pinned films run only at widths of at least 1101px and heights of at least 740px. Smaller windows and phones use readable, stacked films with native page scrolling and a horizontal sticky stage meter.
- Mobile frames are shorter, reserve the prospect-selection footprint and keep the email in a scrollable reading area as it types. No text or prospect data is removed.
- One visibility calculation chooses the active film and the stage-meter row. Resizing across layouts preserves the active stage, and a film size observer keeps pinned frames inside the viewport as their content changes.
- Touch devices and windows below 1101px use native scrolling. Desktop wheel easing remains available, and Pause motion or reduced-motion preferences restore native scrolling by destroying the smoother.
- Layout changes refresh the chapter rail and background geometry. Inactive pinned films hide immediately so resize and chapter transitions do not overlay multiple demos.
- Scroll updates use cached film and chapter positions; stage fills update only their small meter elements. Fonts, content resizing and layout changes refresh the cache.
