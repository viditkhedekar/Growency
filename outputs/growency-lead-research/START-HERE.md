# Growency Lead Research

A portable research skill for Claude and Codex, built from the three client briefs supplied on 21 October 2026 and updated on 23 October to default to **quick research and about five bullets per company**. Start with `SKILL.md`; it links to the relevant client profile, original brief and supporting rules. The folder includes client material, so share it only with the intended team.

## Use it

For daily-volume work, send one CSV with the full lead list, including 1,000 or more rows if needed. This is file intake, not a guarantee that all rows can be researched in one response or within a day. Bulk mode starts with chunks of about 100 enriched rows, or 25 rows needing fresh web research, and saves progress. It prefers the supplied information, reuses company research and flags difficult rows instead of spending a long time on them. Email addresses alone often do not contain enough information for personalization. See [bulk processing](references/bulk-processing.md).

Give a skills-compatible assistant this folder, the client/campaign name and your Clay, Apollo or Origami export. In an environment without native skill installation, provide `SKILL.md`, its referenced research/output instructions and the selected client profile/original as context. The assistant needs access to the files it is told to read; attaching one entrypoint alone does not supply its referenced files.

Copy this first instruction and replace the campaign/input names:

> Use the Growency Lead Research skill. Client: Posting Machine. Mode: quick research only. Use about 2–3 key sources per company and return about five short bullets: what they do, relevant founder detail, strongest signal, a potential angle, and fit/main caveat. Include sources within the bullets. Flag missing facts and move on. Use no paid APIs or credit-consuming provider actions. Do not draft, upload or send outreach yet.

For Codex, the installed skill is named `$growency-lead-research`. The portable archive contains the same folder and instructions. Browser access and usage allowances come from the host; no API key is required by the files or offline formatter. Python 3 is optional and needed only for the local CSV formatter. Without browsing, the assistant can work from supplied material but must identify unverified gaps.

## What is included

- Separate Posting Machine, Kairos Health and Infratex research playbooks, plus the unchanged original briefs.
- Posting Machine prioritizes a bounded check of recent founder LinkedIn posts, with the strongest relevant post included in the five bullets. Access limitations are flagged; no standalone LinkedIn scraper or paid scraping service is bundled.
- Client-brief template for additional clients and per-campaign alpha strategies.
- Clay/Apollo/Origami input guidance based on official provider documentation.
- A quick five-bullet default, with deeper evidence and qualification work available when requested.
- A supplied-data-first bulk mode and offline CSV batch preparer for the 1,000-lead/day design target. Actual research throughput must be measured on the user's sample; the preparer does not do research or sending.
- Every Infratex brief includes a simple, specific explanation of how Infratex could help with the company's document task. [See illustrative examples](assets/infratex-research-examples.md).
- Optional semi-structured writing/QC instructions and a local Instantly formatter.
- [Illustrative research output](assets/research-example.md), clearly fictional.

## Decisions before live batches

- Kairos: choose one US state, resolve 1–5 vs 2–11-location targeting, and confirm current price/discount approval before pricing copy.
- Infratex: choose finance, insurance, partners or the additional direct-buyer campaign; confirm any proposed free comparison and turnaround before promising them.
- All clients: supply approved emails, banned phrases/word limits/alpha strategies if different from the provisional writing defaults. The supplied strategy briefs are not samples of Growency's email voice.

The first test should use a small real export, with every email reviewed before sending. No real prospects were researched or contacted while building the package. The supplied source briefs and official provider documentation were inspected; client proof points were not independently audited. No provider APIs, paid enrichment or sending services were invoked.

The formatter is tested locally with synthetic records. Live provider column mappings and Instantly campaign rendering still need a small account-specific test. This folder supplies a repeatable workflow; running unattended at scale would require separate orchestration and a measured cost/quality decision.
