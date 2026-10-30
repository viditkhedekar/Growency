import csv
import json
import re
from collections import Counter
from pathlib import Path

import openpyxl
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, KeepTogether, PageBreak
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent
SOURCE = ROOT / "infratex-inputs-20261027/Infratex_Email_Prospects (2).xlsx"
OLD = json.loads((ROOT / "outputs/infratex-research-2026-10-26/research-records.json").read_text())
CHECKS = json.loads((OUT / "site-checks-new-200.json").read_text())
OLD_BY_COMPANY = {r["company"].casefold(): r for r in OLD}
CHECK_BY_COMPANY = {r["company"].casefold(): r for r in CHECKS}

# Direct checks of official product/case-study pages on 27 October 2026.
ADDITIONS = {
 "HES FinTech": ("https://hesfintech.com/platform/digital-onboarding/", "LoanBox requests bank statements, ID scans, utility bills and financial statements within lender onboarding.", "Extract income and balance figures from borrower statements into the loan application for reviewer checks.", "Make uploaded statements searchable with source references for a credit analyst.", "It already advertises OCR and automated validation; test a specific difficult document type, not a generic replacement."),
 "Oper Credits": ("https://www.opercredits.com/", "Herman classifies mortgage documents, extracts and verifies data, applies credit policy and prepares cases.", "Test extraction of payslip income and tax-record fields for Herman's underwriting case.", "Return cited answers from a mortgage file so the reviewer can trace any figure.", "Existing extraction is central to the product; identify an unmet file type or accuracy gap before pitching."),
 "CityFALCON": ("https://www.cityfalcon.ai/enterprise-products", "Its financial-content offering includes company filings and extracting insights from customers' own content.", "Structure figures and tables in company filings for its financial-content API.", "Provide source-linked answers across filings for its enterprise research users.", "Existing content extraction is advertised; ingestion needs and source formats need qualification."),
 "Fignum": ("https://www.woodhurst.com/wp-content/uploads/2025/03/Powering-The-Lenders_The-Technology-Landscape_March-2025.pdf", "A lender-technology landscape describes Origin and Adapt for mortgage origination, underwriting and document management.", "Test reading mortgage application documents into the fields Origin uses.", "Make property and income evidence traceable to the source during underwriting review.", "This workflow is supported by a third-party report, not a current official technical specification; confirm entity, integration owner and input formats."),
 "LendingMetrics": ("https://www.lendingmetrics.com/", "The company offers credit decisioning using bureau, open-banking, identity and affordability data.", "If its customers submit financial statements, turn agreed figures into decisioning inputs.", "If lender files contain supporting evidence, return cited answers for a reviewer.", "No PDF ingestion was established; both options are conditional and should not be used as factual email claims."),
 "Northdoor": ("https://www.northdoor.co.uk/ndexinsure/ndexinsure-modules/", "NdexInsure includes a document repository and document generation alongside insurance modules.", "If broker submissions enter NdexInsure, extract risk fields into its underwriting records.", "If claims files are stored there, provide cited answers against the source documents.", "Repository and generation are not evidence of loss-run extraction; confirm live intake and component ownership."),
 "Buckhill": ("https://www.buckhill.co.uk/", "C2MS offers an underwriting workbench, quote-and-bind, claims and policy administration.", "If broker submission PDFs are received, structure the risk fields for the underwriting workbench.", "If claims files are reviewed, make key dates and amounts searchable with source links.", "Exact submission input formats and extraction ownership are unconfirmed."),
 "Concirrus": ("https://concirrus.ai/", "Concirrus markets specialty-insurance underwriting and exposure-management software.", "Test structured capture of broker submission fields for specialty risk triage.", "Make submission evidence searchable with citations for an underwriter.", "The supplied launch describes existing AI intake; confirm a gap rather than claiming the company lacks extraction."),
 "ChainThat": ("https://www.linkedin.com/company/chainthat-limited", "Supplied research describes configurable policy administration for commercial and specialty insurers.", "If its clients ingest submissions, structure broker forms for policy workflows.", "If claims schedules enter a client workflow, surface cited answers for a reviewer.", "Official product page was inaccessible; document ingestion and current vendor route are unverified."),
 "Insurwave": ("https://insurwave.com/", "Its platform advertises pre-quote data-quality assessment and submission processing for specialty insurers and MGAs.", "Test extraction of exposure schedules into the pre-quote data-quality workflow.", "Provide source-linked answers over supporting submission documents.", "It already claims to reduce manual data flow; identify a specific unmet input format."),
 "Fuzzy Labs": ("https://www.fuzzylabs.ai/case-studies/building-an-ai-assistant-to-halve-police-case-file-prep-time", "Its case study describes an assistant for complex police case-file preparation.", "Extract named dates, people and events from client case-file documents for a timeline.", "Provide cited answers across a case-file bundle for its assistant.", "The published case is historical and public-sector; an active commercial project is unknown."),
 "Kortical": ("https://kortical.com/ai-agents", "Kortical builds bespoke AI agents connected to clients' data and systems.", "For a document-heavy client agent, structure PDF tables and scans before the agent uses them.", "Supply cited answers from client documents inside an agent workflow.", "It has its own AI platform; a live project and willingness to use an external component need checking."),
 "Eli5": ("https://www.eli5.io/what-we-do", "Eli5 describes modernising client systems and AI applications, including a TotalEnergies contract-and-quote workflow.", "For a comparable client project, extract fields from contracts and quotes into the target system.", "Provide cited answers from the underlying client documents for review.", "The published example establishes workflow integration, not that document extraction is required now."),
 "Brainpool AI": ("https://brainpool.ai/faqs", "The consultancy describes custom AI implementation, information finding, reports and data structuring.", "If a client project uses scanned reports, extract the agreed fields for its data pipeline.", "Add cited answers over client PDFs to an information-finding application.", "The expert network is not employee headcount; no live document project was verified."),
 "Leftshift One": ("https://leftshiftone.com/en/", "MyGPT connects to company knowledge and offers document-grounded enterprise search.", "Structure scanned tables from client files before MyGPT searches them.", "Return source-linked answers across an agreed client's document set.", "It operates its own RAG platform; external component fit and an active client need are unconfirmed."),
}

sheet = openpyxl.load_workbook(SOURCE, read_only=True, data_only=True)["Prospects"]
values = list(sheet.values)
header = values[4]
input_rows = [(i, dict(zip(header, row))) for i, row in enumerate(values[5:], 6) if row[1]]
assert len(input_rows) == 465

def clean(value):
    return str(value).strip() if value is not None else ""

def source_urls(value):
    return [u.strip() for u in re.split(r"\s*;\s*", clean(value)) if u.strip().startswith("http")]

records = []
for idx, raw in input_rows:
    a = {k: clean(v) for k, v in raw.items()}
    company = a["Company"]
    prior = OLD_BY_COMPANY.get(company.casefold())
    check = CHECK_BY_COMPANY.get(company.casefold())
    addition = ADDITIONS.get(company)
    if prior:
        evidence = prior["detail"]
        option1, option2 = prior["option1"], prior["option2"]
        gap = prior["gap"]
        access = "Previously checked 26 Oct 2026" if prior["source_access"] == "accessible" else "Earlier source access incomplete"
        doc_status = prior["document_evidence"]
        sources = prior["sources"]
        if doc_status == "observed":
            verdict = "review_needed - document workflow evidenced; current buying need and owner remain unconfirmed"
        else:
            verdict = "review_needed - specific document intake or manual workload remains unconfirmed"
    elif addition:
        url, evidence, option1, option2, gap = addition
        access = "Product/case-study page checked 27 Oct 2026" if company != "Fignum" else "Third-party report checked from supplied research"
        doc_status = "observed" if company not in {"LendingMetrics","Buckhill","Concirrus","ChainThat","Brainpool AI","Kortical","Leftshift One","Eli5","Northdoor"} else "conditional"
        verdict = "review_needed - fit plausible; validate the exact document type, current need and integration owner"
        sources = [url]
    else:
        category = a["Document workflow / fit"].split(" Supplier-invoice automation")[0].strip().rstrip(".")
        evidence = f"Supplied screening identifies {category.lower() if category else 'a product supplier'}; supplier-invoice automation was proposed, not observed."
        option1 = "If it receives supplier invoices and purchase orders, Infratex could extract line items and prepare a price/quantity check."
        option2 = "If delivery notes are used, Infratex could structure received quantities for a finance or warehouse review."
        gap = "No public evidence of manual invoice checking, document volume, current ERP or budget owner. Confirm all before outreach about process pain."
        access = "Official site opened 27 Oct 2026; product identity only" if check and check["accessible"] else "Official site unavailable in this pass; supplied screening only"
        doc_status = "hypothesis_only"
        verdict = "review_needed - manufacturer/distributor screened; actual document workflow unverified"
        sources = [a["Website"]] if check and check["accessible"] else []
    email_type = a["Email type"] or "Published business address; individual ownership not verified"
    contact = a["Decision-maker"] if a["Decision-maker"].lower() not in {"", "unknown"} else "Named decision-maker not established"
    sources = list(dict.fromkeys([*sources, *source_urls(a["Evidence URL"])]))
    r = dict(
        id=f"IR27-{idx-5:03d}", source_row=idx, batch=a["Batch"], company=company,
        country=a["Country"], segment=a["Segment"], subsegment=a["Subsegment"],
        website=a["Website"], employee_estimate=a["Employees (approx.)"],
        contact=contact, title=a["Title"], target_role=a["Target role"],
        linkedin=a["LinkedIn URL"], email=a["Public business email"], email_type=email_type,
        email_evidence=a["Email evidence URL"], email_verification=a["Email verification"],
        evidence=evidence, document_evidence=doc_status, option1=option1, option2=option2,
        gap=gap, access=access, verdict=verdict, sources=sources,
        source_basis=("Earlier research plus current workbook" if prior else
                      "Direct public page plus current workbook" if addition else
                      "Current workbook; website identity only where accessible"),
        question=("Which borrower or financial document is hardest to process, and who owns its ingestion?" if a["Segment"]=="Financial software" else
                  "Which submission document and fields recur, and who owns the intake component?" if a["Segment"]=="Insurance software" else
                  "Which active client project handles documents, and who owns evaluation and data permission?" if a["Segment"]=="AI implementation consultancy" else
                  "Do supplier invoices or delivery notes require manual checks, at what volume, and in which system?")
    )
    records.append(r)

assert len(records) == len({r["company"].casefold() for r in records})
assert all(r["email"] for r in records)
assert sum(bool(OLD_BY_COMPANY.get(r["company"].casefold())) for r in records)==250
assert sum(bool(ADDITIONS.get(r["company"])) for r in records)==15

out_json = OUT / "infratex-465-research-records.json"
out_json.write_text(json.dumps(records, ensure_ascii=False, indent=2))
columns = ["id","source_row","batch","company","country","segment","subsegment","website",
           "employee_estimate","contact","title","target_role","linkedin","email","email_type",
           "email_evidence","email_verification","verdict","document_evidence","evidence",
           "option1","option2","gap","question","access","source_basis","sources"]
with (OUT / "infratex-465-research-tracker.csv").open("w", newline="", encoding="utf-8-sig") as f:
    w=csv.DictWriter(f,fieldnames=columns);w.writeheader()
    for r in records:w.writerow({**r,"sources":" ; ".join(r["sources"])})

lines = [
 "# Infratex prospect research - 465 companies",
 "",
 "Checked 27 October 2026. Scope: all rows with a published business email in the supplied workbook. This report incorporates the 250 bounded reports completed 26 October and 15 new software/AI checks. For 200 new manufacturers, the current workbook establishes category and a published business address, but no observed manual AP process; 147 official sites opened for product identity and 53 were unavailable in this pass.",
 "",
 "All entries remain **review_needed**. A published company mailbox is not a verified named buyer address or a deliverability check. Proposed Infratex applications below are conditional hypotheses, not claims that the prospect has a problem or is using Infratex. Sources listed include workbook evidence URLs; the access line distinguishes independently opened pages from supplied-only material.",
 "",
]
for r in records:
    lines += [
       f"## {r['id']} - {r['company']}",
       "",
       f"**Decision:** {r['verdict']}.  ",
       f"**Campaign:** {r['segment']}" + (f" / {r['subsegment']}" if r["subsegment"] else "") + f"; {r['country']}; estimated employees {r['employee_estimate'] or 'unknown'}.  ",
       f"**Company and document evidence:** {r['evidence']}  ",
       f"**Evidence strength:** {r['document_evidence']}; {r['access']}.  ",
       f"**Likely owner and contact:** {r['contact']}" + (f" ({r['title']})" if r["title"] else "") + f"; target role: {r['target_role'] or 'to establish'}. The supplied address is {r['email']} ({r['email_type']}).  ",
       f"**How Infratex could help - option 1:** {r['option1']}  ",
       f"**How Infratex could help - option 2:** {r['option2']}  ",
       f"**Counterevidence / gaps:** {r['gap']}  ",
       f"**Best qualification question:** {r['question']}  ",
       f"**Sources:** " + ("; ".join(r["sources"]) if r["sources"] else "Supplied workbook row only") + f"; workbook Prospects row {r['source_row']}.",
       "",
    ]
(OUT / "infratex-465-full-research.md").write_text("\n".join(lines), encoding="utf-8")

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="ReportTitle",parent=styles["Title"],fontName="Helvetica-Bold",fontSize=16,leading=20,textColor=colors.HexColor("#16324c"),spaceAfter=16))
styles.add(ParagraphStyle(name="Company",parent=styles["Heading2"],fontName="Helvetica-Bold",fontSize=11,leading=14,textColor=colors.HexColor("#16324c"),spaceBefore=9,spaceAfter=5,keepWithNext=True))
styles.add(ParagraphStyle(name="Line",parent=styles["BodyText"],fontName="Helvetica",fontSize=8.5,leading=12,spaceAfter=4))
styles.add(ParagraphStyle(name="Small",parent=styles["BodyText"],fontName="Helvetica",fontSize=7.5,leading=10,spaceAfter=3))
story=[Paragraph("Infratex prospect research",styles["ReportTitle"]),
       Paragraph("465 companies | 27 October 2026",styles["Line"]),
       Paragraph("250 earlier bounded reports; 15 new software/AI public checks; 200 new manufacturers screened. All remain review needed. Company mailboxes do not establish a named decision-maker or deliverability. Proposed workflows are conditional.",styles["Line"]),
       Spacer(1,10)]
for r in records:
    def p(label,value,style="Line"):
        return Paragraph(f"<b>{escape(label)}</b> {escape(clean(value))}",styles[style])
    block=[Paragraph(escape(f"{r['id']}  {r['company']}"),styles["Company"]),
           p("Decision:",r["verdict"]),
           p("Campaign:",f"{r['segment']} / {r['subsegment']} | {r['country']} | employees approx. {r['employee_estimate'] or 'unknown'}"),
           p("Evidence:",r["evidence"]),
           p("Evidence strength:",f"{r['document_evidence']} | {r['access']}"),
           p("Owner/contact:",f"{r['contact']} {r['title']}; target {r['target_role']}. Published address: {r['email']} ({r['email_type']})"),
           p("Option 1:",r["option1"]),
           p("Option 2:",r["option2"]),
           p("Gaps:",r["gap"]),
           p("Qualify:",r["question"]),
           p("Sources:",f"{'; '.join(r['sources']) or 'Supplied workbook only'} | Workbook row {r['source_row']}","Small")]
    story.append(KeepTogether(block))
def page(canvas, doc):
    canvas.setFont("Helvetica",7)
    canvas.setFillColor(colors.HexColor("#697887"))
    canvas.drawString(40,28,"Infratex | Prospect research | 27 October 2026")
    canvas.drawRightString(doc.pagesize[0]-40,28,str(doc.page))
SimpleDocTemplate(str(OUT/"infratex-465-full-research.pdf"),pagesize=(595.28,841.89),
    leftMargin=40,rightMargin=40,topMargin=42,bottomMargin=45,title="Infratex prospect research - 465 companies").build(story,onFirstPage=page,onLaterPages=page)
print(json.dumps({"records":len(records),"segments":Counter(r["segment"] for r in records),"prior":250,"new_public_checks":15,"new_manufacturer":200,"pdf":str(OUT/"infratex-465-full-research.pdf")},default=dict))
