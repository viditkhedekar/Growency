"""Draft only Infratex prospects absent from the existing 250 and 78 email sets."""
import csv
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT/"outputs/growency-email-writer/scripts"))
from assemble import assemble

records = json.loads((ROOT/"outputs/infratex-research-2026-10-27/infratex-465-research-records.json").read_text())
copy = json.loads((ROOT/"outputs/growency-email-writer/references/company-copy.json").read_text())
copy["infratex_service_by_icp"]["direct-b2b"] = (
    "Infratex reads stuff like supplier invoices, purchase orders and delivery notes and can turn them into structured information your finance team can check and use, saving you loads of time."
)
written = set()
for filename in [
    ROOT/"outputs/infratex-emails-250/infratex-250-emails.csv",
    ROOT/"outputs/infratex-78-rewritten/infratex-78-rewritten.csv",
]:
    with filename.open(encoding="utf-8-sig",newline="") as f:
        written.update(r["Company"].strip().casefold() for r in csv.DictReader(f))
missing = [r for r in records if r["company"].casefold() not in written]
assert len(missing)==215, len(missing)

# Short, research-grounded hooks for the 15 new software and implementation prospects.
custom = {
 "HES FinTech": ("product-intro","LoanBox for lender onboarding, where applicants upload bank statements and ID scans","", "extract agreed fields from borrower statements for application review","make uploaded evidence searchable with answers tied to the original file","helping you review borrower documents"),
 "Oper Credits": ("help-intro","", "test document extraction within Herman's mortgage underwriting flow","read payslip income and tax figures into a reviewable case","return cited answers from the supporting mortgage file","let us automate your mortgage document review"),
 "CityFALCON": ("product-intro","financial-content tools that include company filings and analysis of customers' own content","", "structure tables from company filings for your content tools","return cited answers across filings for research users","helping you structure company filings"),
 "Fignum": ("help-intro","", "test document handling in your mortgage origination workflow","extract agreed income and property fields from application documents","let underwriters trace figures back to the original files","helping you handle mortgage documents"),
 "LendingMetrics": ("help-intro","", "test document-derived inputs if your lenders receive financial statements","structure agreed figures from financial statements if lenders submit them","make supporting files searchable with source links if they are part of the process","helping you work with lender documents"),
 "Northdoor": ("product-intro","NdexInsure with a document repository and insurance workflow modules","", "structure broker-submission fields if those PDFs enter NdexInsure","make claims files searchable with cited answers if your clients review them","helping you use insurance documents"),
 "Buckhill": ("product-intro","C2MS with an underwriting workbench and quote-and-bind tools","", "capture fields from broker submissions if they arrive as PDFs","make claims dates and amounts searchable against source files","helping you review underwriting files"),
 "Concirrus": ("help-intro","", "test a difficult document type inside specialty-risk intake","structure fields from one agreed broker-submission format","make its supporting documents searchable with citations for underwriters","helping you process specialty submissions"),
 "ChainThat": ("help-intro","", "test document intake alongside your policy workflows","structure broker forms if your clients receive submissions","surface cited answers if claims schedules are part of a client workflow","helping you work with policy documents"),
 "Insurwave": ("product-intro","exposure-management software with pre-quote data checks and submission processing","", "extract fields from one exposure-schedule format for pre-quote checks","return source-linked answers from supporting submission files","helping you check exposure schedules"),
 "Fuzzy Labs": ("product-intro","a case-file assistant that helps officers prepare complex records","", "pull dates, people and events from case-file documents into a timeline","return cited answers across the source files","helping you structure case files"),
 "Kortical": ("product-intro","bespoke AI agents connected to clients' data and systems","", "turn a client's scanned tables into fields an agent can use","return cited answers from client PDFs inside an agent workflow","helping you handle client documents"),
 "Eli5": ("help-intro","", "handle document data in projects like your contract-and-quote workflow","extract agreed fields from contracts and quotes into the target system","give reviewers cited answers from the original files","helping you process contracts and quotes"),
 "Brainpool AI": ("help-intro","", "add document extraction to a live client project if one needs it","structure fields from client reports or scans for a data workflow","add cited answers over client PDFs to an information-finding app","helping you work with client reports"),
 "Leftshift One": ("product-intro","MyGPT for searching internal company knowledge","", "structure scanned tables before a client's files enter search","return source-linked answers across a client's document set","helping you search scanned documents"),
}

def category_for(record):
    evidence=record["evidence"]
    m=re.search(r"identifies (.*?); supplier-invoice automation",evidence,re.I)
    category=m.group(1) if m else ""
    if "industrial manufacturing or distribution" in category or len(category)>45:
        return ""
    return category

rows=[]
counter=0
for r in missing:
    if r["company"] in custom:
        template,product,opening_help,option1,option2,subject=custom[r["company"]]
        icp=({"Financial software":"financial-software","Insurance software":"insurance-software",
              "AI implementation consultancy":"ai-implementation-partner"})[r["segment"]]
        fields={"company":r["company"],"option 1":option1,"option 2":option2}
        fields["product" if template=="product-intro" else "opening help"]=product or opening_help
        review="research-backed; confirm current need"
    else:
        assert r["segment"]=="Manufacturers/distributors"
        icp="direct-b2b"
        category=category_for(r)
        opening_help=(f"test a supplier-invoice workflow for your {category} business"
                      if category else "test a supplier-invoice workflow for your team")
        fields={"company":r["company"],"opening help":opening_help,
                "option 1":"extract invoice line items for purchase-order checks",
                "option 2":"turn delivery notes into quantities your team can review, if you use those notes"}
        template="help-intro"
        subject=("helping you check supplier invoices" if counter%2==0 else
                 "let us automate your invoice checks")
        review="workflow hypothesis; confirm invoices, volume and buyer before sending"
    # A person's name is used only when the supplied email is explicitly their address.
    name=(r["contact"].split()[0] if "named business email" in r["email_type"].lower()
          and r["contact"]!="Named decision-maker not established" else "there")
    payload={"id":r["id"],"name":name,"company":r["company"],"icp":icp,
             "template":template,"fields":fields,"subject":subject}
    assembled,new_counter=assemble(payload,copy["infratex"],counter,client="infratex",
                                   service_by_icp=copy["infratex_service_by_icp"])
    assert assembled["status"]=="draft", (r["id"],assembled)
    counter=new_counter
    rows.append({"Email":r["email"],"FirstName":"" if name=="there" else name,
                 "Company":r["company"],"OutreachSubject":assembled["subject"],
                 "OutreachBody":assembled["email"],"ResearchID":r["id"],
                 "ReviewStatus":review,"SourceRow":r["source_row"]})
assert len(rows)==215 and len({r["Company"].casefold() for r in rows})==215
assert all(r["Company"].casefold() not in written for r in rows)
assert all(r["OutreachSubject"]==r["OutreachSubject"].lower() for r in rows)
assert all("We've already worked for a private credit lending firm in Sweden with about $4 billion of AUM" in r["OutreachBody"] for r in rows)
assert all("Give us 12 minutes next week and we can tailor an entire workflow around your systems in place." in r["OutreachBody"] for r in rows)
assert all("\u2014" not in r["OutreachBody"] for r in rows)

OUT.mkdir(parents=True,exist_ok=True)
with (OUT/"infratex-215-unwritten-emails.csv").open("w",encoding="utf-8-sig",newline="") as f:
    fields=["Email","FirstName","Company","OutreachSubject","OutreachBody","ResearchID"]
    writer=csv.DictWriter(f,fieldnames=fields);writer.writeheader()
    writer.writerows({k:r[k] for k in fields} for r in rows)
with (OUT/"infratex-215-unwritten-emails.txt").open("w",encoding="utf-8") as f:
    for n,r in enumerate(rows,1):
        f.write(f"{n}. {r['Company']} | {r['Email']} | {r['ResearchID']}\n")
        f.write(f"Subject: {r['OutreachSubject']}\n\n{r['OutreachBody']}\n\n"+"="*60+"\n\n")
print(json.dumps({"unwritten":len(rows),"software_and_partners":sum("workflow hypothesis" not in r["ReviewStatus"] for r in rows),
                  "manufacturer_hypotheses":sum("workflow hypothesis" in r["ReviewStatus"] for r in rows),
                  "greetings":{g:sum(r["OutreachBody"].startswith(g+" ") for r in rows) for g in ["Hey","Hi","Hello"]}}))
