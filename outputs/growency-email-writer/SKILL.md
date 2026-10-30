---
name: growency-email-writer
description: Quickly turn supplied Growency research briefs or compact lead rows into short cold emails for Posting Machine, Kairos Health and Infratex, singly or in large batches. Use supplied details, approved company copy and a 12-minute ask. Perform no prospect research or qualification.
---

# Growency Email Writer

## Fast drafting

Treat this as writing and assembly from supplied evidence. Do not browse links, run the research skill, retrieve writing samples, inspect company relationships or check B2B status, fit, dates, followers or customer maturity. Those belong upstream. Do not exclude prospects or add background-check warnings. Use the supplied examples as the voice. Load only this file and the relevant client copy once per run; do not load unrelated workflows unless higher-priority instructions require them.

Read each brief once. For Infratex, choose the matching ICP sentence and use the two supplied help options; for other clients, pick one usable detail. Write the opening, assemble and check completeness briefly. Produce no analysis, alternatives, citations, scoring or research recaps unless requested. Do not run another research pass. Accept 100+ briefs without individual clarification. Default to one email per brief; do not multiply 100 briefs into 2,000 unless explicitly requested.

For large batches, generate only openings and identifiers, then use scripts/assemble.py to insert fixed copy. Process manageable chunks and continue through the whole supplied batch without asking between chunks. Keep input order and IDs. Save the full result as a file instead of repeating thousands of emails in chat. Do not claim batching guarantees a particular usage charge or speed: personalized output still consumes tokens.

## Small inputs

Accept full research briefs unchanged, or a compact row:

`id | first_name | company | one product/feature detail | linkedin_presence`

Set client once for the batch. Treat `linkedin_presence` as optional: `Established`, `Developing`, `Limited` or `Unverified` (default); accept earlier aliases without treating missing evidence as low activity. Accept the earlier four-field format unchanged. Optional fields: subject, scaffold, company-copy override, CTA. Do not require links, followers, post text, qualification or extra research. Use the first relevant supplied detail when several are present. Use `Hey there,` when no first name is supplied, subject to each client’s greeting rotation below. If there is no usable hook, mark that row `needs_hook` and continue with the rest; do not invent one.

## Structure and style

1. Rotate `Hey [first_name],`, `Hi [first_name],`, `Hello [first_name],` for Posting Machine and Infratex.
2. For Infratex, use a complete approved template as specified below. For other clients, one short personal paragraph, normally 15-30 words, maximum 35. Use one research hook and at most one brief reaction or suggestion. For Infratex, include the two requested help options in one paragraph. For other clients, do not stack angles. For Moonshot, an everyday-uses hook must not acquire an extra privacy angle.
3. One approved company paragraph copied unchanged. For Infratex, paragraph 2 is the exact sentence for the lead's supplied ICP, followed by the two-option help paragraph.
4. Exactly one supplied call ask, or `You got 12 minutes this week for a quick call?` if none was supplied. For Infratex, insert the fixed proof paragraph before its fixed CTA, then the requested sign-off, as specified below.

Aim for 55-85 words overall where the fixed copy permits. Use casual language, contractions and short sentences. Never use em dashes, emojis, generic flattery or an unsolicited sign-off; Posting Machine’s name-free sign-offs and Infratex’s named sign-offs below are required. Always write email subjects entirely in lowercase, including company and product names. Add a short lowercase subject for individual chat drafts; omit bulk subjects unless requested for other clients. Every Infratex email, including bulk drafts, needs a lowercase subject using `helping you [outcome]` or `let us automate your [workflow]`.

Keep facts within the supplied research. Do not invent quotes, metrics, problems, referral paths or personal experiences. `Saw your post about...` is fine when its contents are supplied. Do not claim to have loved, tested, watched or used something unless the sender supplied that experience. Phrase content angles as suggestions. Do not recheck approved proof points during drafting.

## Natural wording

Use the concrete examples below before abstract instructions like "humanize". Write like a brief note to one person. Keep the sender's casual voice without turning every opening into praise. Natural wording is a writing goal, not a guarantee about AI detection or replies.

- Prefer one concrete observation and one short reaction, or a single direct question. An observation alone is enough. Do not force a content suggestion into every opening.
- Use ordinary words: "use", "help", "write", "calls". Cut any sentence that adds neither a specific detail nor a useful reaction.
- Preserve the two current approved Infratex templates below; their wording takes precedence over these general style suggestions. For other copy, avoid stock filler: "I hope this finds you well", "I came across", "I was impressed by", "your innovative approach", "really caught my attention", "in today's fast-paced world", "game-changing", "unlock your potential", "take it to the next level", "perfect fit" and "seamlessly".
- Do not default to "there's a whole series in that", "deserves a post of its own" or "must be difficult" for every lead. Use those scaffold clauses only when they fit the supplied hook. Treat the Kairos workload lines as tentative possibilities, never known pain.
- Allow contractions and sentence fragments when natural. Do not manufacture typos, add slang or insert filler words to disguise generation. Do not replace every short word with a synonym to create variety.
- Keep "CRAZY" available because the user selected it, but reserve it for an enthusiastic product reaction; do not attach it automatically to every company. Do not exaggerate an ordinary update into a major achievement.
- Vary sentence length and opening structure across a batch using the supplied hooks. Avoid three consecutive generic praise openings. Do not rewrite approved company paragraphs or CTAs for variety.
- Before assembly, check the opening once: one grounded hook, no empty praise, no em dash. For Infratex, also retain both supplied help options; other clients keep one angle. Fix obvious filler immediately, without generating alternatives or running a second model pass. Do not research during this check.

Examples of the target voice, not additional prospect evidence:

- Simulithic: `Saw Satyam's post about onboarding your waitlist companies. Have you thought about sharing the testing lessons as you go?`
- Moonshot: `Moonshot is CRAZY. Have you thought about posting a few examples of how people could use Samantha day to day?`
- Tsenta: `Saw creator partnerships are your biggest acquisition channel. Thought that was smart for a job-search product.`

Avoid: `Your innovative approach to AI companionship really caught my attention. There is enormous potential to turn your unique journey into compelling thought leadership.`

See references/writing-research.md only when revising the skill or when the user asks for sources. Do not read it for each email or batch. Preserve the user's fixed 12-minute ask even when external advice recommends a different CTA.

## Selected opening scaffolds

Adapt minimally to the hook. Keep one angle and the word limit; optional clauses are alternatives, not a list to fill completely.

### Posting Machine: mandatory current rules

Read [references/postingmachine-frames.md](references/postingmachine-frames.md) once before every Posting Machine batch. It contains the user-approved firm and gentle hooks, the exact shared copy, 30-day activity rubric and follow-up rules. Apply these rules to every future Posting Machine request; they replace the older rotating proof paragraphs, alternative CTAs and no-sign-off rule.

- Use exactly one shared paragraph and one shared CTA for **every initial email**, regardless of style. Never rotate in the 14-demos proof, substitute a softer CTA, or rewrite the fixed wording.
- Split addressed leads 50/50 between `firm` and `gentle`; for odd counts, differ by at most one. Preserve order and track style and frame separately. When instructed to ignore missing addresses, omit them before rotation and drafting.
- Rotate greetings `Hey`, `Hi`, `Hello`. Independently rotate `Best regards,`, `Kind regards,`, `Best,`, `Thanks,`, `Cheers,`. End with the sign-off only: never add Chinmay, another name, a title or a company signature to Posting Machine emails.
- Use one concrete product detail inside the selected approved hook. Keep the hook short; the fixed frames may exceed the general 35-word limit when a company name or product needs it. Do not replace the approved direct hooks with generic content-strategy commentary.
- Use supplied Established/Developing/Limited evidence for activity claims. Isolated indexed posts, follower counts and missing data do not establish a complete month. Use neutral founder-led/direct hooks for Unverified leads. Do not research during drafting.
- Use the requested favourite-YC, enthusiastic-product and feature-appreciation hooks in the gentle half; the favourite-YC wording is the user’s selected voice. Use it only with supplied YC affiliation. Do not invent having used a product or watched posts.
- For user-supplied follow-ups, retain their body and proof. Rotate greeting and name-free sign-off as described in the reference. Never silently invent missing attachment content.
- For CRM exports, use exactly `email,subject,body,first_name,company,followup_1_body,followup_2_body`; preserve real paragraph breaks inside quoted CSV cells. Keep research fields and style/frame labels in a separate review file. Do not send or import a campaign unless requested separately.

Kairos Health:

- `Saw you're hiring a [receptionist / patient coordinator]. I imagine keeping patient calls and bookings organised takes a fair bit of work.`
- `Saw you're hiring a new dentist. I imagine there's a fair bit to coordinate as you start booking patients into their schedule.`
- `Congrats on the [location] opening. I imagine keeping patient enquiries and bookings organised takes some coordination.`
- `Had a look at your offices in [locations]. I imagine getting patient calls and bookings to the right office can get pretty busy.`

### Infratex two current templates and ICP service paragraphs

Use only the two current templates in [references/infratex-templates.md](references/infratex-templates.md): `product-intro` and `help-intro`. These replace the four earlier templates and legacy openings. The matching template fields and the three exact service sentences live in [references/company-copy.json](references/company-copy.json).

Keep this paragraph order: greeting; product or help opening; exact ICP service sentence; `We could [option 1] or [option 2].`; fixed proof; fixed CTA; rotating Chinmay sign-off. Use both supplied research options in each email. Rewrite each option as a short verb phrase that follows “We could”; preserve any conditions for an unconfirmed workflow and do not present it as the company’s current process. Do not add assumptions about manual work or growth.

Choose paragraph 2 from the supplied campaign/ICP label:

- `financial-software`: financial software and the campaign’s financial/fintech leads.
- `insurance-software`: insurance software.
- `ai-implementation-partner`: AI consultancies and implementation partners.

Copy the selected service sentence exactly, retaining Markdown, JSON and cited answers. Do not mix different ICP sentences, rotate these sentences randomly, or use the earlier generic automation paragraph. Resolve the ICP from the supplied brief/segment without new research; if no supported match exists, return `needs_icp`. This is a copy-routing gap, not prospect exclusion.

Every Infratex subject must be lowercase and follow `helping you [outcome]` or `let us automate your [workflow]`. Use ordinary short phrases from the supplied help options. Preserve the existing greeting and sign-off rotations. The full approved structure takes precedence over the general word targets and one-angle rule.

For assembly, supply `icp`, `subject`, `name`, optional `template`, and a `fields` object containing `company`, `option 1`, `option 2`, plus `product` for `product-intro` or `opening help` for `help-intro`. The two openings alternate by completed-draft counter when no template is requested. Example:

```json
{"id":"1","name":"Alex","company":"Acme","icp":"financial-software","template":"product-intro","fields":{"company":"Acme","product":"a credit analysis platform","option 1":"extract borrower figures from financial statements","option 2":"make the supporting documents searchable"},"subject":"helping you process borrower documents"}
```

Keep missing inputs visible with `needs_hook`, `needs_icp` or `needs_subject`. Do not fall back to an obsolete opening or generic service paragraph.

### Infratex fixed closing and operator rotation

Apply these rules to every Infratex email, including individual chat drafts and batch assembly. After the opening, ICP service sentence and two-option help paragraph, append these two separate paragraphs verbatim and in this order:

We've already worked for a private credit lending firm in Sweden with about $4 billion of AUM and many many other companies around the globe.

Give us 12 minutes next week and we can tailor an entire workflow around your systems in place.

Do not shorten, paraphrase or add another proof paragraph or call ask. These are approved supplied copy, not claims to re-investigate during drafting. Only a later explicit user replacement may change them. The fixed copy takes precedence over the overall word-count target; keep placeholder replacements concise while preserving all approved template paragraphs.

Rotate greetings `Hey`, `Hi`, `Hello`, then repeat, followed by the recipient's first name and a comma. Use `there` when the name is missing. Independently rotate these five sign-offs in order, then repeat: `Best regards,`, `Kind regards,`, `Best,`, `Thanks,`, `Cheers,`. Put `Chinmay` on the next line after every sign-off; Chinmay is the operator. Separate the sign-off from the CTA with a blank line.

Start both rotations at zero for a new batch and carry the same per-client draft counter across chunks and subsequent drafts in the same run. Only completed drafts advance it. Greeting = counter modulo 3; sign-off = counter modulo 5. For the two current templates, select the service sentence by ICP rather than template ID or company-copy pair rotation. Retain lowercase subjects and the ban on em dashes throughout the email, including the subject and sign-off. Posting Machine uses its own required name-free sign-off rule; Kairos retains its existing greeting and no-unsolicited-sign-off rule.

## Company copy and rotation

Read references/company-copy.json once for the requested client. Prefer later user-supplied replacements. For Posting Machine, use its single fixed shared paragraph and CTA without rotation. For Kairos, rotate company paragraphs in pairs, A, A, B, B, C, C, then repeat, independently of scaffold choice. For Infratex, use the supplied ICP's matching service sentence. Maintain a per-client counter across chunks. If copy is missing, return openings with `company_copy_pending`; do not invent pitches or block other clients. Preserve the earlier Kairos distinction between dental production and attributable revenue without re-investigating it during drafting.

For Posting Machine assembly, supply `id`, `name`, `company`, `opening`, lowercase `subject`, `style` (`firm` or `gentle`), `frame`, and supplied `presence`; include `yc_confirmed` for the favourite frame. For other compatible routes, supply `id`, `name`, `company`, `opening`; optionally `subject`. For Infratex, use `icp`, `subject`, `template` and `fields` as shown above; do not use the legacy `opening` route. Run:

`python3 scripts/assemble.py openings.jsonl --client postingmachine --output emails.jsonl --start 0`

Pass the returned `next_start` for the next chunk. Assemble different clients separately and restore source order by ID. Pass `--copy` for replacement company-copy JSON. Return all rows, including incomplete ones with a short status. Do not send emails or create external email drafts.
