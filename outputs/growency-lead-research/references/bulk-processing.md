# Bulk supplied-first research

## Daily-volume goal

The user wants to work toward at least 1,000 leads per day with minimal research per lead and no material additional AI cost. Optimize for one accurate, useful personalization hook rather than comprehensive account reports. Do not claim 1,000/day has been achieved, promise a completion time or translate subscription allowances into a guaranteed lead count. Benchmark the real sample once supplied. A skill is instructions, not an unattended scheduler or a mechanism for bypassing tool/usage limits.

## Intake and chunks

Accept a single CSV containing 1,000 or more rows as file input; do not ask the user to paste each address or manually send every chunk. The row count is file intake, not a claim that every row can be processed in one model response. Preserve IDs, row order and the original data.

- **Useful input:** email plus company/domain and ideally first name, role, LinkedIn URL, company description and one researched signal or recent post. Client/campaign is set once per batch. Accept whatever columns the user actually supplies; do not require them to complete a long schema.
- **Email addresses alone:** a business domain can be a company clue, but does not establish the person's name, role or a personalization hook. Do not guess identity from an email handle. Free/personal email domains do not identify an employer. Mark missing/ambiguous identity and carry on with other rows.
- **Enriched input:** use working chunks of about 100 rows. **Mostly fresh web research:** start around 25 rows per chunk. These are operational starting points, not platform limits; adjust downward if the actual rows are long or tool constraints require it.
- Optional offline preparation: `python3 scripts/prepare_batches.py input.csv --output-dir new-batch-folder --mode supplied-first`. Use `--mode web-light` for the smaller starting chunks or `--chunk-size` to choose a size. This only splits CSV data and creates a manifest; it does not research, draft, send or consume provider credits.

Continue through manageable chunks of the supplied file without asking the user to approve each chunk. Save completed chunk outputs and progress as work proceeds. If the session is interrupted or limits prevent completion, report completed and remaining rows and leave a resumable checkpoint; do not claim background work will continue on its own.

## Research budget

1. Read the client profile/brief and map the input columns once per run.
2. Extract the strongest useful detail from the supplied row. Existing clear source material may be enough; do not re-open every source merely because it contains a URL. Keep supplied facts attributed and preserve original source/date/confidence. Provider AI assertions do not become independently verified facts.
3. Research a company only once per client/campaign and reuse those current facts for its other contacts. Keep person-specific identity/posts separate.
4. If a useful hook is missing, make one focused lookup per distinct company using its supplied domain or name. Inspect the relevant accessible result rather than treating a search snippet as confirmed evidence. Skip careers, pricing, funding, full biographies and full qualification audits unless the selected hook requires them.
5. For Posting Machine, use supplied recent founder-post text/links first. Otherwise, make one bounded post lookup per matched founder when a profile or clear identity is supplied. A blocked feed means recent posts unverified; do not chase every cofounder or crawl history. Prefer one useful post over five collected posts. This priority check replaces other optional social research.
6. For Infratex, identify one supported document task and give the simple **How Infratex could help** sentence. Do not invent a document workflow just to produce an email angle.
7. Stop on a supported disqualifier or a missing essential that the bounded lookup cannot resolve. Keep the row, mark the gap and continue; do not let difficult rows stall the batch.

No paid APIs, scraping subscriptions, contact reveals, verification services or credit-consuming enrichment by default. Preserve the existing pilot cost boundary. More detailed research is an explicit opt-in.

## Compact output and handoff

For bulk work, save files instead of pasting all lead briefs into chat. Include about five short points per company, roughly 50–80 words where useful: business/buyer, one signal or post, relevant contact detail if known, proposed angle/help, and fit/main gap. Use fewer points where the input cannot support five. Reuse company-level points rather than generating a second company report for each person.

Each lead row should carry its original ID/email plus client/campaign, name/company if known, one grounded `research_detail`, its source/date and verification label, `how_infratex_could_help` when applicable, disposition and unresolved gaps. Do not burden a simple research-to-writing handoff with the full sending/export approval schema unless that mode was requested.

The writing skill can consume `id | first_name | company | one research detail` with the client set once. Preserve any supplied help sentence and row flags beside that handoff. Do not invoke writing for a research-only request, silently discard excluded rows or label unresolved research as verified. Email formatting and validation are distinct from email deliverability verification.

Return a brief batch summary: supplied, completed, remaining, usable hooks, needs review and excluded; link the output. A 1,000-row input is not 1,000 qualified or send-ready contacts.

## Benchmark before promising volume

Once the real sample arrives, measure elapsed time, rows completed, new external lookups, proportion needing review and actual additional spend. Estimate daily capacity from measured work and available operating hours, clearly separating supplied-data processing from fresh web/LinkedIn research. Do not invent a throughput estimate before this test.
