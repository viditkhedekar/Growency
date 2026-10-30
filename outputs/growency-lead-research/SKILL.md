---
name: growency-lead-research
description: Quickly research supplied B2B leads singly or in large CSV batches using a client brief. Return about five concise, sourced bullets per company, a useful personalization detail and fit or key gaps. Prefer supplied Clay, Apollo or Origami data; deeper research, reviewed copy and Instantly export are optional.
---

# Growency Lead Research

Turn a client brief and supplied lead data into a quick, useful account summary: **about five short bullets per company**. Prioritize speed and the strongest relevant specifics. Detailed research is available only when requested; email generation is a later mode.

## Quick default

- Read the selected client brief/profile once per campaign and reuse that context across the batch. Treat their longer field and source lists as a menu, not a checklist to exhaust for every company.
- Use supplied data plus the company website and one relevant YC, founder or signal source: usually **2–3 sources per company**. Batch independent searches when possible. Make at most one narrow follow-up if it could change the verdict or best angle; otherwise mark the gap and move on.
- For **Posting Machine**, make recent founder LinkedIn posts the priority signal source: extract up to 3–5 accessible posts from the last 30 days and use the best relevant post within the five bullets. Follow the bounded lookup and fallback in [its playbook](references/clients/posting-machine.md); this replaces other optional research lanes rather than adding a long social-media audit.
- For **Infratex**, always include **How Infratex could help:** one simple sentence connecting the prospect's actual document task to a concrete useful output. Name the document and the task; avoid technical jargon and generic claims about AI. Use the examples and five-bullet shape in [its playbook](references/clients/infratex.md).
- Stop deeper research once a clear disqualifier is established. Do not audit complete posting histories, funding, hiring, pricing, customer proof and every founder by default. If a LinkedIn profile is blocked, flag the missing data without repeated access attempts or searches for every cofounder.
- Return roughly **80–130 words across five bullets**, with links beside facts. A useful shape is: product/buyer; relevant founder or LinkedIn detail; strongest commercial signal; potential angle, labelled as a hypothesis; fit verdict and main caveat. Adapt these slots to the best available information; do not pad missing facts.
- Keep uncertainty inside the relevant bullet. Skip separate confidence tables, evidence-ID displays, source inventories, long conclusions and follow-up menus in the default response. Create reports, JSON or export files only when requested or needed for an explicitly requested downstream mode.

These quick-mode rules control research depth and presentation even where a supporting reference describes the optional detailed workflow. Never drop factual support or turn unknowns into facts to save time.

## Start with the brief

Use the supplied client brief as the campaign authority. Read it before researching prospects. Keep each client's offer, claims, targeting and research separate. Do not apply one client's strategy to another.

For the supplied campaigns, read the matching profile and its linked original:

- [Posting Machine](references/clients/posting-machine.md): US B2B founders; prioritize recent founder LinkedIn posts, then audience and content-to-pipeline fit. YC affiliation is a sourcing route, not qualification.
- [Kairos Health](references/clients/kairos-health.md): US dental practices; one state per campaign; enquiry capture and booking coverage.
- [Infratex](references/clients/infratex.md): Europe; financial software first, insurance software alongside, AI implementation partners separately. Direct manufacturers/distributors need their own campaign.

For another client, use [the client-brief template](assets/client-brief-template.md). Extract hard filters, preferences, exclusions, buyer roles, approved offer/proof, useful signals, disconfirming evidence and unknowns. If a missing setting changes who qualifies, ask one focused question; continue research that does not depend on it. Never invent commercial terms or qualification thresholds.

## Operating modes

- **Quick research** (default): a bounded source check and about five concise bullets per company, including fit and a useful angle. Do not draft emails unless requested.
- **Bulk supplied-first** (default for lists over 50 rows or daily-volume work): follow [bulk processing](references/bulk-processing.md). Process one uploaded file in manageable chunks, reuse company facts and extract one useful hook per lead without researching every optional field. The user's target is 1,000 leads per day; this is a design target, not a verified throughput or subscription allowance.
- **Detailed research** (only when requested): investigate the relevant source lanes, fuller qualification fields and evidence ledger described in the references.
- **Draft**: use completed research and the client's writing instructions to draft email and, if requested, a distinct LinkedIn hook. Read [writing and review](references/writing-and-review.md).
- **Export**: after human approval, prepare a local Instantly CSV. Read [output and export](references/output-and-export.md). Uploading, sending, sequencing and reply management are separate actions requiring their own authorization.

Do the stages the user requests. Do not turn research on supplied leads into an unrequested market-wide discovery project.

For bulk mode, its narrower source budget and compact file output override the ordinary quick-pass source count and word target. Do not change or maintain the separate writing skill as part of a research request. When the user requests the entire research-to-email workflow, hand completed rows to the existing writing skill without a second research pass; preserve review flags and keep upload/sending as separately authorized actions.

## Pilot cost boundary

Default incremental AI/provider spend is zero. Use supplied exports, accessible public pages and capabilities already included in the user's existing session. Do not initiate paid model APIs, paid research agents, enrichment waterfalls, contact reveals, verification services, credit-consuming exports, extra seats or upgrades without explicit authorization. Included credits still have value: do not consume them merely because they are prepaid. If cost cannot be established, use supplied data and log the gap.

This skill is a portable set of instructions and an offline formatter, not a background automation service or an unlimited compute allowance. Usage limits, existing subscriptions and representative review time still apply. Never promise zero total operating cost or guaranteed daily volume.

## 1. Normalize without losing detail

Read [input mapping](references/input-mapping.md) when processing an export. Inspect actual columns: none of the providers guarantees one universal schema. Accept CSV, JSON, spreadsheets, pasted rows and research notes. For spreadsheet formats, use the environment's available spreadsheet capability; for CSV/JSON, ordinary file tools suffice.

Retain original row IDs, column names, raw values and source platform. Preserve nested research, source links and dates. Split company facts from person facts. Missing means unknown, never false or zero. Provider AI summaries are claims to check, not verified evidence.

Resolve company/domain, person/profile and current role before connecting signals. Deduplicate accounts for company research, but preserve every input row and its disposition. Do not collapse different people at one company or silently merge ambiguous identities. Reuse current public company evidence across contacts while researching each person's role separately.

## 2. Research against the client's commercial questions

Use [research and evidence](references/research-and-evidence.md) for evidence handling or detailed mode. In quick mode, collect only the strongest supported specifics needed for the five-bullet summary. Prefer exact details over generic company summaries.

Start with the homepage or a relevant product page, then the most useful source for this client's strategy. Pricing, careers, case studies, announcements and blog posts are optional lanes, not required visits. Respect the quick source budget; unresolved essentials mean review_needed, not an extended investigation. Expand only when the user requests depth.

LinkedIn can be inaccessible or incomplete. Use legitimate available access, supplied exports or dated screenshots/notes; never bypass access controls or infer inactivity from an inaccessible profile. Log whose follower count it is, the count type, observation date and whether the activity window is complete.

## 3. Verify before selecting an angle

In quick mode, keep each important fact attached to its source and flag uncertain dates or verification inline. A full evidence ledger with IDs, dates, status and confidence reasons is needed for detailed research or requested copy/export, not the default chat summary. A search snippet alone does not establish a decisive claim. Two vendors repeating one source are not independent corroboration.

Separate:

1. **Observed fact:** what the source actually establishes.
2. **Commercial relevance:** how that fact connects to this client's product and buyer.
3. **Hypothesis:** a reasonable problem or opportunity to ask about, explicitly unconfirmed.
4. **Counterevidence/gap:** what weakens the angle or prevents qualification.

Choose one useful, supported angle. Keep discarded signals out of the quick summary unless they materially change the fit decision. Funding alone is insufficient for Infratex; follower count alone is insufficient for Posting Machine; closed hours alone do not establish lost patients for Kairos.

Use High / Medium / Low with reasons, separately for identity, key facts and client fit. These are review labels, not calibrated probabilities. Unknown hard filters require review. Strong fit never makes weak evidence true. Do not pad bullets or fabricate research to meet a quota.

## 4. Deliver research the rep can use

Use a company-name label followed by about five bullets, including the useful angle and fit decision. Include source links beside facts; supplied-only evidence can use a concise file/row reference. Read [output and export](references/output-and-export.md) for detailed outputs or export requirements.

Return every supplied lead as **qualified**, **review_needed** or **excluded**, with reasons. Preserve client-specific tiers separately. A list being fully processed does not mean the market was exhaustively covered.

Review all copy before the initial pilot sends. For research, surface conflicting identity, unknown hard filters, inaccessible essential evidence and unsupported claims first so reps can focus review effort. Later sampling policies must be chosen by the user and informed by measured error rates.

## 5. Optional copy, QC and export

Follow the client's approved examples, alpha strategies, structure, word limits, banned phrases and claims. These settings are per-client; if absent, use the provisional defaults in the writing reference and say they are provisional. Do not claim to have learned Growency's exact email voice without examples.

Check factual support, buyer relevance, offer accuracy, awkward personalization and copy constraints. A separate critique pass can help, but the same model reviewing itself is not independent verification. Use existing session capacity; another paid reviewer is not a default dependency.

Human approval must come from an actual user/reviewer decision on the final copy. Never fabricate reviewer names, approvals or evidence. Produce review files locally. Only explicitly approved, current-copy rows may enter the Instantly file; changing the copy, contact or research invalidates its approval.

## Portability and pilot evaluation

All workflow instructions are ordinary Markdown with relative references. The script uses only Python's standard library and performs no network calls. Browsing, file access and optional Python execution depend on the host. In text-only environments, work from supplied sources, retain unknowns and provide a mapping table instead of claiming a verified CSV.

For a pilot, use a small representative batch before scaling. Track research minutes, sourced-claim error rate, reviewer edits, percentage rejected and qualified conversations/meetings against the existing process. Record actual incremental spend. Open rates and an AI-writing detector score do not establish commercial success.
