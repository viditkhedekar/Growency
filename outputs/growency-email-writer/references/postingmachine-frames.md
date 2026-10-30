# Posting Machine: user-approved writing rules

Authority: explicit user instructions, 29 October 2026. Apply these settings to every initial Posting Machine email unless the user explicitly replaces them. Do not revert to earlier variants.

## Shared paragraphs: exact wording

At Posting Machine, we run founders’ and businesses’ LinkedIn. We have generated over 2 million impressions for our clients, including multiple YC ones.

Give us 12 minutes on a call next week to persuade you. You’ll be getting inbounds like crazy within weeks.

Use these as two separate paragraphs, unchanged, for both styles. Do not rotate proof, add the 14-demo case, or use alternative template CTAs.

## Message format and rotation

Use lowercase subject; greeting; hook; shared company paragraph; shared CTA; sign-off. Separate paragraphs with a blank line. Hooks may include the approved short question on a second line or paragraph; do not add extra service paragraphs from the old full templates.

Rotate `Hey`, `Hi`, `Hello`, then repeat. Use the supplied first name; use `there` if no recipient first name is supplied. Do not assume the researched founder owns a supplied mailbox.

Rotate `Best regards,`, `Kind regards,`, `Best,`, `Thanks,`, `Cheers,`, then repeat. Do not put any name below the sign-off. In particular, do not append Chinmay to Posting Machine copy. This rule differs from Infratex.

Split the addressed batch evenly between firm and gentle styles. An odd batch may differ by one. Preserve original IDs/order; keep style and frame labels for review. Ignore rows without an email when requested. Start the completed-draft counter at zero and carry it across chunks. For the initial message, greeting = index modulo 3 and sign-off = index modulo 5.

## 30-day evidence rubric

| Rating | Visible evidence |
| --- | --- |
| Established | Original posts across several weeks, with meaningful engagement on multiple posts. |
| Developing | Some original content, but inconsistent or recently started. |
| Limited | Little activity across the full visible month. |
| Unverified | Activity inaccessible or coverage insufficient to establish a rating. |

Use the actual supplied rating, period, source and account owner. Keep founder and company activity distinct. A small following, an old indexed post, an empty search or an incomplete feed does not establish Limited. If no usable full-period evidence is supplied, use Unverified and a neutral hook. Do not run another research pass inside this writing skill.

## Firm hooks

Use one supplied product/audience detail and adapt grammar minimally. The shared paragraph, shared CTA and rotating name-free sign-off replace the different middle paragraphs and asks in the original full-email examples.

1. `firm-weak`: `Saw that [Company] helps [audience] with [specific task]. I also noticed you aren’t posting much on LinkedIn at the moment.` Require supplied Limited evidence across the visible month. Neutral alternative: `Saw that [Company] helps [audience] with [specific task]. I think there’s an opportunity to get what you’re building in front of more of those people on LinkedIn.` Use the neutral alternative without implying an activity rating.
2. `firm-founder`: `Saw that you’re building [short product description]. Would you be open to having someone run your LinkedIn for you?` Alternative: `You’re building [specific product or service], which seems like the sort of thing people in [target audience] would be interested in hearing about. Would you be open to having someone run your LinkedIn for you?` Do not assume an existing presence or content problem.
3. `firm-developing`: `I saw that [Company] is helping [audience] with [specific task] and has started posting on LinkedIn. Are you looking to grow the account further?` Require supplied Developing evidence. Neutral alternative: `I saw that [Company] helps [audience] with [specific task]. Are you looking to grow your LinkedIn presence and reach more people in that space?`
4. `firm-strong`: `Saw that [Company] is building [short product description]. You’ve already got a pretty consistent LinkedIn posting routine. Do you handle all of it yourself?` Alternative: `I saw that [Company] is building [specific product or service]. You’ve already got a solid LinkedIn presence too. Do you handle the writing yourself?` Require Established evidence for the account being described. Do not assert that writing takes too long.
5. `firm-direct`: `Saw that [Company] helps [audience] with [specific task]. I think we could help you reach more of those people through LinkedIn.` Shorter alternative: `Saw that [Company] helps [audience] with [specific task]. We could help you reach more of those people through LinkedIn.` Safe for Unverified activity.

For Unverified activity, prefer `firm-founder` or `firm-direct`; never insert an unsupported frequency claim to fill a frame quota.

## Gentle hooks

1. `gentle-favourite`: `[Company] is one of my favourite YC companies. Wanted to reach out because I thought [specific product or feature] could make a really good content series on LinkedIn.` Use supplied YC affiliation. This is the user’s chosen opinion-based voice, not permission to invent product experience.
2. `gentle-enthusiastic`: `[Company] is CRAZY. Have you thought about posting a few examples of how [audience] could use [specific feature] day to day?` Adapt to short demos or explaining the product where that fits. Use selectively, not for every routine feature or sensitive care-service story.
3. `gentle-feature`: `Thought [Company]’s [specific feature] was really smart. Have you thought about breaking down how it works on LinkedIn?` If Established evidence exists, the approved alternative is `Thought [Company]’s [specific feature] was really smart. You’ve already got a solid LinkedIn presence. Do you handle the writing yourself?`
4. `gentle-developing`: `I’ve been watching [Company]’s LinkedIn posts recently. Thought there’s massive potential to document some of the work you do, like [specific task], in a building-in-public kind of series.` Require supplied evidence that those posts were actually reviewed and are recent; never manufacture this experience. Otherwise use a product-based gentle frame.

## Follow-ups

The user supplied three pairs of follow-up bodies on 29 October 2026. Preserve their body copy, testimonials, metrics and asks as supplied; these do not use the initial message’s fixed company paragraph or CTA. The six bodies are saved under `postingmachine_followups` in `company-copy.json` in pair order: 1+2, 3+4, 5+6. Rotate pairs across leads; never pair two arbitrary bodies.

For message step 1 or 2, rotate greeting and name-free sign-off using `(lead index + step) modulo 3` and `(lead index + step) modulo 5`. Replace only the supplied greeting; append the sign-off with a blank line. Preserve the rest of the supplied follow-up. Do not add a sender name. If the user supplies a new attachment, read it before using it; never claim a missing attachment was included.

## Checks before delivery

Confirm the style split, one exact shared paragraph and one exact shared CTA per initial message, greeting/sign-off rotation, no signature name, no em dash or unresolved placeholder, and supported activity claims. Keep subjects lowercase. Verify CSV round-trips and run the actual CRM parser where available. Keep the import columns exactly `email,subject,body,first_name,company,followup_1_body,followup_2_body`. A review file may retain research and frame metadata.
