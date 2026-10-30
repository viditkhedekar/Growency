import csv
import importlib.util
import json
import re
from pathlib import Path

ROOT = Path('/Users/Vidit/Projects/Growency')
OUT = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('assembler', ROOT / 'outputs/growency-email-writer/scripts/assemble.py')
assembler = importlib.util.module_from_spec(spec)
spec.loader.exec_module(assembler)
copy = json.loads((ROOT / 'outputs/growency-email-writer/references/company-copy.json').read_text())
leads = {r['_id']: r for r in json.loads(Path('/tmp/infratex-leads.json').read_text())}
research = json.loads(Path('/tmp/infratex-research-content.json').read_text())
options = json.loads(Path('/tmp/infratex-two-options.json').read_text())

# ID | template | subject | product or opening help | two concise research options.
COPY_ROWS = [
 [1,'P','helping you trace issuer risk findings','risk ratings for tokenised assets using issuer documentation','extract issuer terms into your risk-review records','make the supporting disclosures searchable with links to the original wording'],
 [2,'H','helping you use pdf news sources','bring document-based news into your sentiment and risk analysis','turn PDF or scanned articles into text for your models if those formats reach your team','make an authorised news archive searchable with source-linked answers'],
 [3,'P','helping you process difficult kyc packs','financial-crime software that already parses KYC packs and case files','extract ownership and address fields from difficult KYC files','make the source passages behind a compliance finding searchable'],
 [5,'H','helping you review issuer documents','structure issuer information for your tokenised-securities platform','extract security terms if issuers submit prospectuses or term sheets','make legal packs searchable if your tokenisation reviews use them'],
 [6,'H','helping you process financing paperwork','structure the paperwork behind your solar and storage financing','extract quantities and prices if supplier invoices arrive as PDFs','prepare financing case summaries if installations require customer paperwork'],
 [7,'H','helping you review funding documents','prepare document-based inputs for TradeBridge’s funding reviews','extract amounts and due dates if invoices arrive as PDFs','pull payment terms from supplier agreements into a table alongside the invoices'],
 [8,'P','helping you structure bank onboarding documents','a platform for banking and financial services','extract business and director details if clients collect registration PDFs','prepare borrower figures if a lending client accepts financial statements'],
 [9,'H','helping you review supporting kyc files','structure the supporting KYC documents used in Payout’s onboarding','extract names, addresses and document dates into review fields','compare those details across files with references for your team to check'],
 [10,'P','helping you process merchant documents','merchant payments with founding-document checks before contracting','extract legal names and registration numbers into onboarding records','make founding documents searchable so reviewers can find the supporting section'],
 [11,'H','helping you structure investment documents','prepare document-based inputs for your investment-product structuring','extract coupon and maturity terms if issuers send term sheets','build a restrictions checklist if client mandates arrive as documents'],
 [12,'P','helping you answer reserve questions','EURØP with published quarterly reserve attestations','extract reporting dates and reserve figures into a review table','make successive attestations searchable with answers linked to the relevant report'],
 [13,'H','helping you structure programme documents','turn document-based inputs into setup records for your prepaid and incentive services','prepare business-review fields if distributors send registration documents','extract budgets and eligibility rules if programmes arrive as PDF briefs'],
 [14,'H','helping you prepare credit review data','structure the financial statements required for your overdraft applications','extract revenue, profit and debt figures into credit-review tables','make applications and statements searchable so analysts can trace each figure'],
 [17,'H','helping you build document features','add document features to the fintech ventures you build','extract required fields for a venture that accepts customer PDFs','supply source-linked answers inside a portfolio application that uses financial or legal documents'],
 [18,'P','helping you use deal documents','white-label investment platforms with deal-document access and administration','make deal documents searchable with source-linked answers','extract investment terms into a comparison table for administrators to review'],
 [19,'H','helping you structure onboarding evidence','structure document-based evidence for your onboarding and compliance services','extract business and ownership fields if clients submit registration files','make policy or customer document packs searchable if compliance teams use them'],
 [20,'P','helping you answer land investment questions','an agricultural-land investment platform with an information document for each acquisition','extract project terms into a consistent comparison table','make each information document searchable for source-linked answers to investor questions'],
 [21,'H','helping you structure investment onboarding','prepare document-based inputs for your investment infrastructure','extract customer fields if clients collect investor documents','build a fees and investment-terms table if fund information arrives in PDFs'],
 [22,'P','helping you structure investment product data','an investing app with savings products','extract fees and risk information if fund factsheets arrive as PDFs','prepare identity or address fields if account reviews require supporting documents'],
 [23,'H','helping you set up rewards programmes','prepare document-based inputs for your merchant rewards programmes','extract rates, locations and dates if campaign briefs arrive as documents','make merchant terms searchable if programme conditions sit across agreements'],
 [25,'P','helping you structure lender product information','a comparison platform connecting customers with banks and financial institutions','extract rates and eligibility rules if lenders send PDF rate sheets','make partner terms searchable if they arrive as documents'],
 [26,'H','helping you prepare credit memo evidence','prepare source-linked inputs for KiteEdge’s credit-memo appendix','extract covenant thresholds, dates and definitions from credit documents','build period-by-period borrower tables from financial statements with references for each figure'],
 [27,'P','helping you process expense document details','finance tools that retrieve and match Meta Ads, Shopify and TikTok receipts from Gmail','extract merchant, tax and total fields from captured receipts','structure advertising-invoice line items where your matching workflow needs them'],
 [28,'H','helping you compare vendor datasets','structure document-based vendor information for your dataset discovery tools','extract coverage and field definitions if vendors send PDF catalogues','make methodology files searchable if analysts use them to evaluate datasets'],
 [29,'P','helping you review construction invoices','invoice tools with validation and progress-billing support for construction businesses','extract project references, billing periods and amounts into validation fields','compare invoices with supporting progress documents for your team to check'],
 [30,'H','helping you structure issuer programme requirements','structure document-based requirements for your issuer-processing implementations','extract limits and card settings if programme requirements arrive as PDFs','make operating procedures searchable if client support relies on those files'],
 [32,'P','helping you prepare credit review documents','credit and pay-later products for the Baltic market','extract income and repayments if credit exceptions require statement PDFs','prepare company-review fields if merchant onboarding uses registration documents'],
 [33,'H','helping you structure offline banking inputs','prepare document-based inputs alongside your transaction-enrichment tools','structure transaction rows if statements arrive outside connected feeds','extract fees and eligibility rules if banks provide product PDFs'],
 [34,'P','helping you review alternative id documents','account onboarding that accepts supporting letters and statements for eligible applicants without photo ID','extract names, addresses and dates into review fields','compare those details across an applicant’s documents with links to the original pages'],
 [36,'H','helping you structure onboarding evidence','prepare document fields alongside Snaprove’s existing identity checks','extract names, dates and addresses from onboarding documents','prepare ownership and registration details if business applicants submit company files'],
 [37,'P','helping you structure private market research','predictive decision intelligence for private markets','extract company metrics and reporting periods if your research uses pitch decks','make due-diligence packs searchable if analysts work from those files'],
 [38,'H','helping you use compliance documents','structure document inputs for your open-banking and compliance products','extract registration and ownership fields for a product that accepts company documents','supply source-linked policy answers for a client project that uses policy PDFs'],
 [39,'P','helping you handle document based credit exceptions','a lending application flow using BankID and connected bank accounts','extract income and repayments if you have statement-only exceptions','prepare financial comparison tables if applications include self-employment accounts'],
 [40,'H','helping you review investment documents','structure documents used across your investment subscriptions and custody onboarding','extract investor details and terms if subscription forms arrive as files','make deal documents searchable for jurisdiction-specific terms with source references'],
 [42,'P','helping you structure transfer review documents','an international money-transfer service','extract payers, amounts and dates if reviews require proof-of-funds files','prepare names and addresses if account exceptions require supporting documents'],
 [43,'H','helping you structure payment onboarding evidence','prepare document-based evidence for your fiat and digital-currency payment services','extract ownership and registration fields if merchants submit company documents','make policy PDFs searchable if payment operations use them for compliance questions'],
 [44,'P','helping you review business payment documents','stablecoin and fiat payment infrastructure with named accounts and remittances','extract company and ownership fields if your Swiss entity collects onboarding files','prepare amounts and counterparties if payment reviews require invoices or proof-of-funds documents'],
 [45,'H','helping you structure merchant review documents','prepare document-based inputs around your payment-terminal service','extract registration fields if merchant onboarding includes company documents','prepare references and amounts if support receives payment evidence as PDFs'],
 [46,'P','helping you structure reconciliation inputs','a finance interface that brings bank accounts, collections and payments together','structure transaction rows if customers send statements outside bank connections','extract invoice numbers and due dates if collection requests include invoice files'],
 [47,'H','helping you add document extraction to bank projects','add document extraction to the banking systems you implement','extract registration fields for a bank project that accepts company documents','prepare borrower figures for a bank that receives financial-statement PDFs'],
 [48,'P','helping you structure fintech compliance documents','accounts, cards and compliance integrations for fintech products','prepare ownership fields if clients submit KYB document packs','supply source-linked policy answers if their compliance teams search those files'],
 [49,'H','helping you process business registration documents','structure the KBIS and SIRENE files required for your independent-worker accounts','extract SIREN numbers, activity codes and business names into onboarding fields','compare those details with the application record for your team to check'],
 [50,'P','helping you review entity onboarding documents','digital-asset infrastructure whose API accepts registry extracts and shareholder documents','extract company and shareholder fields from registry files','structure amounts and dates from source-of-funds documents with links to the originals'],
 [52,'H','helping you structure recovery case documents','organise document-based evidence around authorised digital-asset recovery','prepare permissions and dates if recovery cases require authorisation documents','make recovery procedures searchable if institutional clients keep them in PDFs'],
 [58,'H','helping you structure invoice and collection data','prepare document-based inputs for your payments and collections service','extract amounts and due dates if customer invoices arrive as PDFs','make case files searchable if collection work includes contracts and invoice attachments'],
 [66,'P','helping you structure securities issuance documents','blockchain infrastructure for regulated financial-market participants','extract coupon and maturity terms if issuers submit bond term sheets','prepare ownership and registration fields if participant onboarding includes company-document packs'],
 [68,'H','helping you structure bank counterparty reviews','structure document-based inputs around your correspondent banking hub','extract questionnaire responses if bank onboarding uses due-diligence files','make partner terms searchable if settlement teams use agreements and operating-rule documents'],
 [72,'H','helping you answer fund document questions','use the terms already set out in your fund key-information documents','extract fees, restrictions and redemption terms into an investor-relations comparison table','make those documents searchable with references behind each answer'],
 [74,'P','helping you prepare invoice funding data','financing that lets businesses upload supplier or customer invoices for funding','extract invoice references, amounts and due dates into funding-review records','build period-by-period financial tables from applicants’ supplied accounts']
]

def main():
    expected = [x['id'] for x in research if x['fit'] != 'excluded']
    assert [x[0] for x in COPY_ROWS] == expected
    drafted = []
    next_index = 0
    for ident, template, subject, hook, one, two in COPY_ROWS:
        lead = leads[ident]
        # All retained source rows carry the Financial Software Campaign label.
        assert lead['Lists'] == 'Financial Software Campaign'
        company = lead['Company Name for Emails'] or lead['Company Name']
        fields = {'company': company, 'option 1': one, 'option 2': two}
        fields['product' if template == 'P' else 'opening help'] = hook
        row = {'id': ident, 'name': lead['First Name'], 'company': company,
               'recipient': lead['Email'], 'icp': 'financial-software',
               'subject': subject, 'template': 'product-intro' if template == 'P' else 'help-intro',
               'fields': fields}
        result, next_index = assembler.assemble(row, copy['infratex'], next_index,
                                               client='infratex', service_by_icp=copy['infratex_service_by_icp'])
        assert result['status'] == 'draft', result
        drafted.append(result)

    # One UTF-8, RFC-compatible CSV works in both importers. Quote multiline bodies.
    csv_path = OUT / 'infratex-instantly-hunter.csv'
    with csv_path.open('w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['Email','FirstName','Company','OutreachSubject','OutreachBody'], quoting=csv.QUOTE_ALL)
        writer.writeheader()
        for r in drafted:
            writer.writerow({'Email':r['recipient'], 'FirstName':r['name'], 'Company':r['company'],
                             'OutreachSubject':r['subject'], 'OutreachBody':r['email']})

    instructions = '''INFRATEX: 49 PERSONALISED FIRST EMAILS
26 October 2026

Use infratex-instantly-hunter.csv in either Instantly or Hunter. It contains
one complete subject and email body per contact, not a mail-merge outline.
The seven immediately excluded companies and 18 duplicate source rows are absent.
All 49 retained companies are included in the same order as the research report.
No emails have been sent or imported into a campaign.

IMPORT MAPPING
Email -> Email
FirstName -> First name
Company -> Company / Company name
OutreachSubject -> custom variable (Instantly) / custom attribute (Hunter)
OutreachBody -> custom variable (Instantly) / custom attribute (Hunter)

INSTANTLY
Use this as the entire subject field:
{{OutreachSubject}}

Use this as the entire body field:
{{OutreachBody}}

Custom variable names are case-sensitive. Preview a real imported contact to
check the completed subject, paragraph breaks and signature before launching.

HUNTER
Map or create the two custom attributes when importing. In the sequence editor,
use Insert attribute to select OutreachSubject as the entire subject and
OutreachBody as the entire body. Use Hunter's Review section with actual leads
to verify paragraph breaks. Most custom attributes do not populate in test emails.

The body already contains the greeting and Chinmay sign-off. Avoid adding a
second campaign greeting or signature. Keep the importer file as CSV; do not
copy physical lines into a new sheet, because each quoted body has line breaks.

COPY NOTES
Both research help options appear in every email. Unconfirmed document inputs
remain conditional. All source contacts belong to Financial Software Campaign,
so the approved financial-software service sentence is used throughout.
Your exact proof paragraph and 12-minute CTA are preserved. This file contains
first-touch emails only. Email addresses are copied from the supplied list;
no fresh address verification was performed.

Official import/personalisation references:
https://help.instantly.ai/en/articles/6135930-how-to-add-and-use-variables-in-campaigns
https://help.hunter.io/en/articles/8825344-personalize-your-email-content-using-attributes

ALL 49 EMAILS
=============
'''
    sections = [instructions]
    for n,r in enumerate(drafted,1):
        sections.append(f"\n{n:02d}. {r['company']} | {r['name']}\nTo: {r['recipient']}\nSubject: {r['subject']}\n\n{r['email']}\n\n" + '='*64 + '\n')
    (OUT / 'infratex-all-49-emails.txt').write_text(''.join(sections),encoding='utf-8')
    # Private provenance supports exact lead and research-option reconciliation.
    (OUT / 'assembled-emails.jsonl').write_text(''.join(json.dumps(r,ensure_ascii=False)+'\n' for r in drafted),encoding='utf-8')

    imported = list(csv.DictReader(csv_path.open(encoding='utf-8',newline='')))
    assert len(imported) == len(drafted) == next_index == 49
    assert len({r['Email'].lower() for r in imported}) == 49
    banned = re.compile(r'\b(tapestry|crucial|intricate|interplay|elevate|resonate|enhance|offerings|leverage|embark|multifaceted|foster)\b',re.I)
    for source, rendered in zip(drafted, imported):
        body = rendered['OutreachBody']
        assert rendered['Email'] == leads[source['id']]['Email']
        assert body == source['email']
        assert rendered['OutreachSubject'] == source['subject'] == source['subject'].lower()
        assert source['subject'].startswith(('helping you ','let us automate your '))
        assert len(body.split('\n\n')) == 7
        assert copy['infratex_service_by_icp']['financial-software'] in body
        assert source['fields']['option 1'] in body and source['fields']['option 2'] in body
        assert copy['infratex'][0]['proof'] in body and copy['infratex'][0]['cta'] in body
        assert not re.search(r'\[[^\]]+\]|\{\{|\}\}|\u2014',body)
        assert not banned.search(body+' '+source['subject'])
        assert len(source['subject']) < 80
        assert len(rendered) == 5
    print(json.dumps({'drafted':len(drafted),'unique_recipients':49,'pending':0,
                      'word_range':[min(len(r['email'].split()) for r in drafted),max(len(r['email'].split()) for r in drafted)],
                      'deliverables':[str(csv_path),str(OUT/'infratex-all-49-emails.txt')]}))

if __name__ == '__main__':
    main()
