import re,json,csv
from pathlib import Path
g=json.load(open('/tmp/infratex78-groups.json')); out=Path('outputs/infratex-78-rewritten')
assert len(g)==78
docs='''
1|client document packs|key fields|project intake records
2|contract versions|clauses and changes|contract-comparison records
3|supplier invoices|invoice numbers, amounts and due dates|AP review records
4|supplier orders|product references and quantities|order-review fields
5|client documents|agreed fields|the client’s existing schema
6|portfolio reports|reporting periods and financial figures|portfolio-review tables
7|client document packs|agreed fields|an OEM partner’s application
8|customer documents|required fields|the registry’s structured data
9|supplier invoices|invoice details and line items|AP review fields
10|multilingual invoices|supplier names and invoice amounts|the client’s review fields
11|client document packs|agreed fields|a client’s document workflow
12|claims files|claim dates and amounts|claims-review records
13|customer orders|product references and quantities|sales-order review fields
14|supplier invoices|invoice numbers and amounts|AP review records
15|supplier invoices|item references, quantities and prices|SAP review fields
16|private-debt agreements|parties, dates and financing terms|a deal-review table
17|tender documents|submission dates and requirements|a bid checklist
18|supplier invoices|invoice fields and line items|a review queue
19|financial statements|financial figures and reporting periods|company-analysis tables
20|bills of materials and test reports|part references and test results|engineering records
21|business onboarding documents|company and ownership details|KYC review fields
22|credit review documents|borrower figures and reporting periods|a due-diligence table
23|supplier invoices|invoice numbers and line items|an Infor review table
24|client document packs|required fields|an agreed output format
25|transaction documents|transaction terms and dates|a deal-comparison table
26|client document packs|agreed fields|a partner application
27|handwritten forms|names, dates and other agreed fields|a structured review table
28|invoices|invoice numbers and amounts|reconciliation review records
29|scanned business documents|agreed fields|downstream records
30|proofs of delivery|delivery dates and references|open-item review records
31|AP documents|invoice details and line items|an AP review queue
32|supplier invoices|invoice references and line items|SAP Business One review fields
33|application forms|names, dates and agreed fields|structured review records
34|deal and investor documents|parties and investment terms|loan-review fields
35|incoming letters|names, dates and case references|the appropriate review record
36|client invoices|invoice details and line items|ERP review fields
37|borrower statements|income and repayment figures|a credit-review table
38|financial statements|financial figures and reporting periods|investment-analysis tables
39|onboarding documents|company and ownership details|client-review fields
40|mortgage documents|financial figures and reporting periods|a portfolio-review table
41|lending documents|borrower information and dates|a credit-review record
42|incoming invoices|invoice details and line items|ERP review fields
43|transport documents|references and dates|downstream review fields
44|financial statements|financial figures and reporting periods|a due-diligence table
45|leases|rent, dates and tenant details|a property-review table
46|supporting documents|names, dates and references|verification review fields
47|lender documents|customer details and reporting periods|a data-quality review table
48|contracts|deadlines, obligations and payment terms|contract-review fields
49|certified invoices|counterparties, invoice amounts and dates|a claims-review table
50|vendor bills|invoice header and line-item details|bill-review fields
51|underwriting submissions|risk details and dates|underwriting review fields
52|payslips and bank statements|income figures and dates|an affordability-review table
53|client document packs|agreed fields|the client’s application
54|financial documents|income and repayment figures|an underwriting-review table
55|supporting income documents|income figures and dates|a review table
56|financial and legal documents|figures, dates and parties|structured analysis records
57|commercial invoices and packing lists|item descriptions, quantities and values|customs-review fields
58|invoice PDFs|supplier names, amounts and due dates|a funding-review table
59|invoice PDFs|supplier names, dates and amounts|transaction review fields
60|supplier invoices|invoice details and line items|purchase-to-pay review fields
61|KYC documents|company names, addresses and ownership details|compliance-review fields
62|client documents|agreed fields|the client’s business system
63|commercial invoices and packing lists|item details, quantities and values|customs-review fields
64|client document packs|agreed fields|document-review records
65|real-estate documents|property references and stated amounts|a property-review table
66|lending documents|borrower details and reporting periods|lending review fields
67|client document packs|agreed fields|the client’s application
68|client documents|agreed fields|a document-review workflow
69|underwriting submissions|risk details and dates|a review table
70|client documents|agreed fields|business-system review records
71|client document packs|agreed fields|document-processing review records
72|client documents|agreed fields|the client’s downstream system
73|non-identity documents|agreed fields|a partner application
74|client document packs|agreed fields|the client’s application
75|scanned documents|agreed fields|the client’s output schema
76|energy-related documents|property details and stated figures|a property-review table
77|supplier invoices|invoice references, amounts and line items|review fields
78|insurance documents|policy and portfolio details|review fields
'''
items={int(x.split('|')[0]):x.split('|')[1:] for x in docs.strip().splitlines()}
finance={6,16,19,21,22,25,34,37,38,39,40,41,44,47,49,52,54,55,56,58,66}
insurance={2,12,51,69,78}
proof="We've already worked for a private credit lending firm in Sweden with about $4 billion of AUM and many many other companies around the globe."
cta='Give us 12 minutes next week and we can tailor an entire workflow around your systems in place.'
services={
'finance':'Infratex can read stuff like financial statements, scanned reports and tables, and can turn them into structured Markdown, JSON and cited answers your financial AI agents can use, saving you loads of time.',
'insurance':'Infratex can read loss runs, schedules of values and scanned submissions and can turn them into structured Markdown, JSON and cited answers your underwriting agents can use, saving you loads of time.',
'partner':'Infratex can read your clients’ PDFs, scans, tables and handwriting and can turn them into structured Markdown, JSON and cited answers for the AI applications you build.'}
greetings=['Hey','Hi','Hello'];ends=['Best regards,','Kind regards,','Best,','Thanks,','Cheers,'];rows=[]
for i,group in enumerate(g,1):
 company=re.sub(r'^\d+\.\s*','',group[0]);subjectline=next((s for s in group if s.lower().startswith('subject:')),None); pos=group.index(subjectline)
 greet=group[pos+1]; m=re.search(r'^(?:Hi|Hey|Hello)\s+([^,]+)',greet,re.I); name=m.group(1).strip() if m else 'there'
 if '{' in name or name.lower()=='there':name='there'
 hook=group[pos+2].strip(); cat='insurance' if i in insurance else 'finance' if i in finance else 'partner'
 if i in (67,74):opening=f'Was looking into {company} and thought that we could help you turn document information into usable data.'
 else:
  hook=re.sub(r'^I (noticed|saw|came across|read about|read)\s+(?:that\s+)?', '',hook,flags=re.I)
  hook=hook.replace('your role in developing its financial advisory division','the development of its financial advisory division')
  hook=hook.replace('That’s an interesting use of AI in compliance.','').replace('Smart way to take the chasing out of expense admin.','').strip()
  hook=hook.replace('—',', ').strip()
  opening='Saw '+hook if hook else f'Was looking into {company} and thought that we could help you work with documents.'
 doc,fields,dest=items[i]
 work=f'We could extract {fields} from {doc} into {dest} if those files are part of your workflow, or make the documents searchable with answers linked to the original wording.'
 subject='helping you work with '+doc.lower()
 body=f'{greetings[(i-1)%3]} {name},\n\n{opening}\n\n{services[cat]}\n\n{work}\n\n{proof}\n\n{cta}\n\n{ends[(i-1)%5]}\nChinmay'
 rows.append({'Email':'','FirstName':'' if name=='there' else name,'Company':company,'OutreachSubject':subject,'OutreachBody':body,'SourceNumber':str(i)})
with (out/'infratex-78-rewritten.csv').open('w',newline='',encoding='utf-8') as f:
 w=csv.DictWriter(f,fieldnames=list(rows[0]),quoting=csv.QUOTE_ALL);w.writeheader();w.writerows(rows)
with (out/'infratex-78-rewritten.txt').open('w',encoding='utf-8') as f:
 f.write('78 INFRATEX EMAIL DRAFTS\n\nThe source document did not contain recipient email addresses. Add and verify addresses before importing or sending.\n\n')
 for row in rows:f.write(row['SourceNumber']+'. '+row['Company']+'\nSubject: '+row['OutreachSubject']+'\n\n'+row['OutreachBody']+'\n\n'+'='*60+'\n\n')
assert len(rows)==78 and len(items)==78 and all(proof in r['OutreachBody'] and cta in r['OutreachBody'] for r in rows)
assert all('—' not in r['OutreachBody'] for r in rows)
print('78 drafts',sum(not r['Email'] for r in rows),'missing addresses')
