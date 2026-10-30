# Input mapping

Provider documentation checked 21 October 2026. These are likely available fields and semantic mappings, not promises about a specific export. Read the actual file before using them. Do not run a provider action to manufacture a missing column under the zero-spend pilot.

## Clay

Clay is a configurable table/workflow, so column names, providers, research prompts and output structures vary. Expect identity seeds such as company domain/company LinkedIn and person name/person LinkedIn; enrichments may add description, industry, headcount, headquarters, title, bio and work history. Custom research columns may contain signal answers, URLs, JSON objects or AI summaries. Preserve question, answer, supporting text and URL separately where available.

Export settings matter: confirm the file includes the research/evidence columns you need rather than assuming the table view and file match. Sources: [Clay's enrichment framework](https://university.clay.com/lessons/jigsaw-framework), [CSV export guide](https://university.clay.com/lessons/download-as-a-csv-clay-101). Claygent research is a credit-consuming capability; this skill consumes existing results rather than rerunning it.

## Apollo

Common contact fields include First name, Last name, Title, Seniority, Departments, Email, Email status, Email confidence and Person linkedin url. Company fields can include Company name, Website, Company linkedin url, Industry, # employees, location, Technologies, Total funding, Latest funding and Last raised at. Export options may also provide Primary email source, Primary email last verified at, provider IDs and Custom fields.

Missing export cells do not prove Apollo lacks the underlying information. Exporting does not automatically refresh contact data. Keep company and personal LinkedIn URLs distinct. Preserve the provider's own verification label and date; do not reinterpret an email confidence field as confidence in research, buyer fit or delivery today.

Source: [Apollo export documentation and available fields](https://knowledge.apollo.io/hc/en-us/articles/4409237712141-Export-Contacts-to-a-CSV).

## Origami

Assume the user means the prospecting product at origami.chat unless their export identifies another product. Its public material describes firmographics, contact/role information and custom research about funding, hiring and other signals, with spreadsheet/CSV output. It does not establish a universal CSV header schema. Inspect the actual table, requested question, rationale, source links and dates. AI-generated qualification text stays unverified until its underlying source supports it.

Source: [Origami product page](https://origami.chat/). Its current page meters research and contact work in credits; do not rely on older descriptions that all research is free. No new Origami actions are part of this pilot by default.

## Normalize semantically

| Meaning | Possible headers | Treatment |
| --- | --- | --- |
| Person | First Name + Last Name; Full name; Name | Preserve spelling; do not guess name splits when ambiguous. |
| Role | Title; Job Title; Current role | Confirm current company when qualification depends on it. |
| Company | Company name; Account; Organization | Preserve raw legal/display names. |
| Domain | Website; Company Domain; Account Website | Normalize for matching; keep original URL and do not merge separate subsidiaries on name alone. |
| Person LinkedIn | Person linkedin url; LinkedIn Profile | Confirm it is a person and the correct company. |
| Company LinkedIn | Company linkedin url | Never substitute its followers for founder followers. |
| Contact | Email; Work email; Email status | Keep original value, status, source and verification date. |
| Employee count | # employees; Headcount; Employee range | Distinguish exact estimate, range and date. |
| Money | Funding; ARR; Revenue; ACV; Price | Preserve currency, interval, source, actual vs estimate; do not convert funding into revenue or monthly price into ACV without evidence. |
| Research | Summary; Signal; Reason; Claygent/custom columns | Keep raw text, underlying question, URLs and attribution; split claims. |
| Followers | Followers; Connections; Audience | Record owner/profile URL, metric type and date. Connections are not followers. |

Use a stable `lead_id` and original `source_rows` such as `apollo.csv:row 14`. Every input row must be accounted for, including duplicate, excluded or unresolved rows. Where no reliable ID exists, assign a local ID without asserting a matched entity.

Keep raw input separately. Normalize only for matching; do not overwrite the evidence. A website change requires two dated versions; a single current page cannot establish that positioning changed.
