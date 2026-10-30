# Output and Instantly export

## Quick research deliverable (default)

For large supplied lists, use the compact file output and resumable chunks in [bulk processing](bulk-processing.md), rather than printing every brief in chat. Bulk handoff does not require the full export/approval schema unless that mode is requested.

Return a company-name label and about five concise bullets, approximately 80–130 words total. Use this as a flexible guide:

1. What it sells and who buys it.
2. Relevant founder/decision-maker or LinkedIn detail, if readily available.
3. Strongest client-relevant commercial signal.
4. One potential angle, clearly marked as a hypothesis.
5. Fit verdict (qualified / review_needed / excluded) and the main caveat.

For Infratex, replace the generic angle with **How Infratex could help:** one plain sentence naming the observed document and a concrete useful output/task. See its client playbook; do not settle for “document-heavy business” or “could benefit from AI.”

Put source links and material uncertainty inside the bullets. Do not add a separate evidence ledger, confidence table, sources section, long introduction or closing recommendation by default. If little is supported, give fewer useful bullets rather than padding. The quick source budget in SKILL.md takes precedence over the detailed workflow below.

## Detailed research deliverable (only when requested)

For each lead use a short opening decision, followed by useful specifics. Do not force a fixed number of bullets: include every material supported detail, and retain longer evidence in the ledger.

```text
Company — person / role — client / campaign
Decision: qualified | review_needed | excluded — concrete reasons
Client tier: if the brief defines one
Identity confidence: High/Medium/Low + reason
Fit confidence: High/Medium/Low + reason

Specifics
- [E1] Exact product, buyer or workflow fact. Source + date.
- [E2] Exact targeting or timing observation. Source + date.
- Continue with the relevant detail; do not pad with generic facts.

Best angle
- Observed signal: ... [E1, E2]
- Why it matters to this client: ...
- Hypothesis to test: ... (unconfirmed)
- Worth mentioning: ...
- Keep internal / ignore: ... and why

Counterevidence / gaps
- Hard-filter status: pass / fail / unknown, with evidence and rule.
- Conflicting, stale or inaccessible information.
- The most useful next verification step.

Coverage
- Sources actually inspected; sources supplied but not verified.
- Input rows accounted for; market coverage is not exhaustive.
- Incremental provider/AI spend: actual known amount, or unknown.

Optional requested copy
- Subject / email; distinct LinkedIn hook if requested.
- Claim-to-evidence mapping and QC issues.
- Human review: pending until a real decision arrives.
```

For a requested detailed batch report or downstream copy/export workflow, preserve the original source data and create `research.md` and/or `results.json` as needed. Quick chat research does not require these files. Account for every supplied company, including review-needed and excluded leads.

## Optional machine output

Use this envelope for the offline formatter. This is an interchange format defined by this skill, **not** any provider's native schema. The example deliberately requires review and cannot be exported as approved outreach.

```json
{
  "schema_version": 1,
  "client_id": "infratex",
  "campaign_id": "europe-cre-software",
  "brief_version": "user-brief-2026-10-21",
  "export_policy": {
    "max_contact_check_age_days": 30,
    "max_body_words": 90,
    "banned_phrases": ["hope this finds you well", "game-changing"]
  },
  "records": [{
    "lead_id": "row-001",
    "source_rows": ["input.csv:row 2"],
    "contact": {
      "email": "",
      "first_name": "",
      "last_name": "",
      "job_title": "",
      "company_name": "",
      "website": "",
      "linkedin": ""
    },
    "research": {
      "disposition": "review_needed",
      "reasons": ["Demonstration schema only; no lead researched."],
      "identity_confidence": "low",
      "fit_confidence": "low",
      "hard_filters": [{"rule": "Europe", "status": "unknown", "evidence_ids": []}],
      "bullets": [],
      "evidence": [],
      "best_angle": {"text": "", "evidence_ids": []},
      "counterevidence": [],
      "unknowns": ["Actual lead input required"],
      "coverage": {"inspected": [], "unavailable": []}
    },
    "draft": {"subject": "", "body": "", "claim_checks": []},
    "qc": {"status": "pending", "issues": []},
    "export_checks": {
      "contact_policy": "pending",
      "contact_check_ref": "",
      "checked_at": "",
      "suppression": "unknown",
      "suppression_ref": ""
    },
    "human_review": {
      "status": "pending", "reviewer": "", "reviewed_at": "",
      "approval_ref": "", "fingerprint": ""
    }
  }]
}
```

Use the evidence-entry schema in [research and evidence](research-and-evidence.md). Each `draft.claim_checks` entry contains `claim` and `evidence_ids`. Include both prospect facts and any client proof/offer claims. `export_checks.contact_policy=pass` means the contact meets the campaign's approved verification policy, with the source/date of the check recorded. Email syntax alone never qualifies. `suppression=clear` needs an actual checked list/policy reference. Do not assume missing suppression data is clear.

## Human approval and formatter

With the final record prepared, calculate its fingerprint:

```bash
python3 scripts/format_instantly.py fingerprints /path/to/results.json
```

Show the final email and research to the reviewer. **Only after an actual human approval**, record `status=approved`, reviewer, ISO date, a locator for that explicit decision in `approval_ref`, and the fingerprint. This command never grants approval. Every record field except the review metadata is fingerprinted together with the client, campaign, brief and export policy. Any substantive edit requires another review. Recomputing a hash does not renew approval.

Then prepare local output:

```bash
python3 scripts/format_instantly.py export /path/to/results.json --output-dir /path/to/new-output-folder --as-of 2026-10-21
```

Use the actual run date. The output folder must not already exist to prevent stale files being mistaken for a new batch.

- `instantly.csv`: only qualified rows passing evidence, contact-policy, suppression, QC and current human-approval checks. An empty eligible set yields headers only.
- `review.csv`: every row, its copy, source references and explicit hold reasons.
- `export-summary.json`: counts and per-row hold reasons; no provider/network actions.

The formatter enforces structural gates, duplicate protection, approval versioning, body limits and banned phrases. It cannot independently establish that a citation supports a sentence, a lead is real, a contact check was honestly performed or a reviewer approved. The researcher and human reviewer own those judgments. It does not verify deliverability, browse, generate copy, upload or send.

## Instantly mapping

Documentation checked 21 October 2026: [Instantly variable mapping](https://help.instantly.ai/en/articles/6135930-how-to-add-and-use-variables-in-campaigns). Email is required. Map `first_name`, `last_name`, `company_name`, `website` and `linkedin` to their corresponding predefined fields. Map `outreach_subject` and `outreach_body` to **Custom Variable**, preserving exact spelling and case.

- Campaign subject: `{{outreach_subject}}`
- Campaign body: `{{outreach_body}}`

This imports variable data; a CSV row does not create a sequence step by itself. Keep internal research/QA out of the sending CSV. Preview representative leads, paragraph breaks, sender signature and variables in the actual campaign before launch. A body with a signature plus an automatic sending-account signature may duplicate it; the approved campaign template should choose one. End-to-end import/rendering is unverified until tested in the user's account.

CSV fields are quoted correctly, including multiline bodies. Formula-like leading values in sending cells are held for review rather than silently changed; `review.csv` escapes those values for safe spreadsheet inspection. No live import is performed by this skill's formatter.
