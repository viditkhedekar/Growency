import csv,json,re
from pathlib import Path
P=Path(__file__).parent
checks=json.loads((P.parent/"infratex-research-2026-10-27/site-checks-new-200.json").read_text())
base=list(csv.DictReader((P/"infratex-215-unwritten-emails.csv").open(encoding="utf-8-sig")))
first=list(csv.DictReader((P/"infratex-rewritten-first-10.csv").open(encoding="utf-8-sig")))
by={r["Company"]:r for r in base}
# Hook is observed product context; proposed document tasks are conditional.
# index | product detail | input and output option A | input and output option B
DATA="""11|smoke alarms|extract model numbers and quantities from supplier invoices|structure alarm-specification PDFs for a product comparison
12|indoor and outdoor lighting|pull fitting references and prices from PDF quotations|structure delivery-note quantities for an order check
14|intercom and access-control equipment|extract access-unit model numbers from order PDFs|make installation manuals searchable with source-linked answers
18|urban fast-charging equipment|pull charger ratings and connector details from specification PDFs|structure invoice lines for comparison with an equipment order
19|energy-management equipment|extract meter and controller specifications into a comparison table|make technical manuals searchable with cited answers
22|the MARO Model 1 coffee machine|extract component references and quantities from supplier documents|make service instructions searchable for your team
23|batteries|structure capacity and voltage details from battery datasheets|pull product codes and quantities from order PDFs
24|personalised neon signs|extract sign dimensions and order details from PDF briefs|structure delivery notes for checking completed orders
30|ultrasound antifouling technology|pull equipment specifications from technical PDFs into a table|make maintenance instructions searchable with cited answers
31|cables and system solutions|extract cable references and ordered lengths from PDF orders|structure supplier invoice lines for a purchase-order check
34|ultrasonic testing instruments|pull instrument ranges and probe details from datasheets|make operating manuals searchable with cited answers
36|electromechanical components and assembly|extract component references and quantities from PDF orders|structure technical datasheets for a component comparison
37|smart materials and mechatronic systems|structure material properties from technical PDFs|make project reports searchable with answers linked to the source
40|building-security equipment|pull device references and quantities from order PDFs|make installation instructions searchable for your team
43|audio equipment|structure speaker specifications from PDF datasheets|extract product references and quantities from quotations
45|components and systems for laser material processing|extract component specifications from technical PDFs|make service documentation searchable with source references
46|electronics manufacturing services|pull component references and quantities from PDF purchasing documents|structure supplier invoices for an order comparison
49|solar water-heating equipment|structure power and capacity details from product PDFs|make installation guidance searchable with cited answers
50|train-weighing systems|extract measurements and equipment identifiers from PDF test reports|make maintenance manuals searchable with source references
51|LiDAR systems for drone mapping|structure sensor specifications from technical PDFs|make survey-equipment manuals searchable with cited answers
52|glass tempering, lamination and screen-printing equipment|pull machine specifications from quotation PDFs into comparison tables|make equipment maintenance instructions searchable
53|3D-printing filaments|structure material properties from filament datasheets|extract product codes and quantities from purchase-order PDFs
55|the FRIGG and Mushie baby-product ranges|extract product references and quantities from wholesale order PDFs|structure supplier invoices for an order check
58|semiconductor wet-processing equipment|structure machine specifications from technical PDFs|make equipment manuals searchable with cited answers
60|transformers|extract ratings and dimensions from transformer datasheets|structure quotation line items for an order comparison
61|RFID applications for hotels|extract device specifications from product PDFs|make deployment instructions searchable with cited answers
63|test equipment for aircraft, helicopters and trucks|structure test readings from PDF reports for review|make equipment manuals searchable with source-linked answers
64|LED lighting|extract light-output and power specifications from datasheets|pull fitting references and quantities from order PDFs
68|digital access solutions for workspaces and homes|structure lock and controller specifications from product PDFs|make installation instructions searchable for your team
70|tailored driver packs|extract vehicle and driver-pack requirements from PDF order briefs|structure delivery notes for checking completed orders
71|solid-state switching and magnetic sensors|pull electrical ratings from sensor and relay datasheets|extract component references from purchase-order PDFs
76|PCB manufacturing software and laser photoplotters|structure photoplotter specifications from technical PDFs|make operating documentation searchable with source-linked answers
78|pre-owned test and measurement equipment|extract instrument specifications from equipment PDFs|structure model numbers and prices from quotations for review
79|sport optics|pull magnification and lens specifications from product PDFs|extract model numbers and quantities from order documents
80|lighting equipment|structure fitting specifications from datasheets|extract item references and quantities from project quotations
82|security-management and parking-guidance systems|structure device specifications from technical PDFs|make installation and service manuals searchable
83|duvets and pillows|extract product sizes and quantities from wholesale order PDFs|structure supplier invoice lines for an order check
85|solid-state LiDAR|pull sensor specifications from technical PDFs into comparison tables|make sensor documentation searchable with cited answers
89|liquid leak-detection systems|structure sensor specifications from datasheets|make installation manuals searchable with source references
91|connectors and interconnect products|extract connector ratings and dimensions from datasheets|pull part numbers and quantities from PDF orders
92|electric motors|structure motor ratings and dimensions from technical PDFs|extract model references and prices from supplier quotations
93|fire and security systems|pull device specifications from product datasheets|make installation and service instructions searchable
94|smart-building systems|structure controller and device details from technical PDFs|make installation guidance searchable with cited answers
99|regulated DC power supplies|extract voltage and current ranges from datasheets|make equipment manuals searchable with source-linked answers
100|thread-cutting tools|pull tool sizes and material details from product PDFs|structure order-line references and quantities for review
101|refrigerant gas detection|extract detector ranges and ratings from datasheets|make calibration instructions searchable with cited answers
102|speakers and multiroom audio systems|structure speaker specifications from product PDFs|extract product references and quantities from quotations
104|cutter-grinding services|extract tool dimensions from PDF job specifications|structure quoted prices and quantities for an order check
105|precision sheet metal, electronic integration and wiring|extract item references from PDF job briefs|structure supplier invoices for comparison with orders
106|lime and limestone products|structure product properties from specification PDFs|extract quantities and product references from delivery notes
107|electric mopeds|extract component references from supplier documents|make service manuals searchable with cited answers
108|cooker hoods and home appliances|structure model specifications from product PDFs|extract model numbers and quantities from wholesale orders
109|construction-site vibration and noise monitoring|structure measurement tables from PDF reports|make equipment manuals searchable with cited answers
115|furniture|extract dimensions and product codes from order PDFs|structure supplier invoices for comparison with purchasing records
118|high-pressure water jetters|pull pressure and flow ratings from technical PDFs|make maintenance guidance searchable with source references
121|food and wine preservation equipment|structure product specifications from datasheets|extract product references and quantities from purchase documents
123|fastening tools|pull tool specifications from PDF catalogues|structure order-line references and quantities for review
125|machines for door and window production|extract machine specifications from quotation PDFs|make operating manuals searchable with cited answers
131|crimping machinery and service|structure machine specifications from technical PDFs|make servicing instructions searchable with source references
135|T-shirts, polo shirts and sweatshirts|extract sizes and quantities from order PDFs|structure invoice lines for comparison with garment orders
136|EV-charging distribution|pull charger specifications from technical PDFs|extract model references and quantities from supplier documents
138|air purifiers and ionisers|structure airflow and power details from product PDFs|make maintenance instructions searchable with cited answers
139|measurement instruments and calibration|extract instrument identifiers and results from PDF calibration reports|structure specifications for an instrument comparison
142|packaging machinery|pull machine specifications from technical PDFs|make maintenance instructions searchable with source-linked answers
143|baby-care equipment|extract product references and quantities from order PDFs|structure supplier invoices for an order check
145|large-scale 3D printers|structure printer specifications from technical PDFs|make operating and maintenance guidance searchable
147|CNC machine tools|extract machine specifications from quotation PDFs|make maintenance instructions searchable with source references
148|the Erae 2 expressive instrument|structure technical specifications from product PDFs|make setup documentation searchable with cited answers
153|personalised planners|extract order requirements from PDF briefs|structure supplier invoice details for a finance review
154|electric street-cleaning vehicles|pull vehicle specifications from quotation PDFs|make service manuals searchable with source-linked answers
156|personalised signs|extract dimensions and text requirements from PDF order briefs|structure invoice line items for a check against orders
158|printed circuit boards|structure technical requirements from PDF specifications|extract item references and quantities from purchase documents
159|water-saving shower systems|structure product specifications from technical PDFs|make installation and service guidance searchable
162|wooden wind-turbine towers|extract agreed material properties from technical PDFs|make project documentation searchable with cited answers
166|milling, grinding and flaking machinery|pull machine specifications from technical PDFs|make maintenance manuals searchable with source references
170|gas-safety and fire-alarm equipment|structure sensor and alarm specifications from datasheets|make installation guidance searchable with cited answers
181|precision machining|extract agreed tolerances from PDF specifications for review|structure component references and quantities from order documents
183|woodworking machinery, materials and components|pull machine specifications from product PDFs|extract component references and quantities from supplier invoices
184|LED walls and large-format screens|structure screen specifications from technical PDFs|extract panel references and quantities from quotations
185|filling, capping and labelling machinery|pull capacity and format specifications from equipment PDFs|make maintenance instructions searchable with cited answers
189|cleaning machines|structure machine specifications from product PDFs|make servicing instructions searchable with source references
190|printed circuit boards|extract agreed board requirements from PDF specifications|structure purchase-order line items for review
191|railway tools and measurement equipment|pull instrument specifications from technical PDFs|structure measurement tables from PDF reports
192|custom copper and aluminium components|extract material and dimension requirements from PDF specifications|structure part references and quantities from purchasing documents
194|home and industrial security systems|structure device specifications from product PDFs|make installation manuals searchable with cited answers
195|balancing machines and services|extract equipment specifications from technical PDFs|structure measurement tables from PDF test reports
199|RF-over-fibre links and systems|pull frequency and link specifications from datasheets|make setup instructions searchable with source-linked answers"""
revised=base[:15]+first
done={r["Company"] for r in revised}
audit=[]
for line in DATA.splitlines():
 idx,product,a,b=line.split("|");c=checks[int(idx)];r=by[c["company"]].copy()
 if r["Company"] in done:continue
 parts=r["OutreachBody"].split("\n\n")
 parts[1]=f"Was looking into {r['Company']} and saw your work with {product}. Thought a document workflow tailored to that might be useful."
 parts[3]=f"If your team uses these documents, we could {a} or {b}."
 r["OutreachBody"]="\n\n".join(parts)
 r["OutreachSubject"]=("helping you work with "+product).lower()
 revised.append(r);done.add(r["Company"])
 audit.append({"Company":r["Company"],"EvidenceURL":c["url"],"ObservedDetail":product,"ProposedUseCases":"Conditional; document use not verified"})
pending=[{"Company":r["Company"],"Email":r["Email"],"ResearchID":r["ResearchID"],"Status":"needs_hook","Reason":"No sufficiently specific company detail selected from available evidence; no replacement email drafted"} for r in base if r["Company"] not in done]
order={r["Company"]:i for i,r in enumerate(base)}
revised.sort(key=lambda r:order[r["Company"]])
replacements={
"Infratex reads financial statements, scanned reports and tables, turning them into structured Markdown, JSON and cited answers your financial AI agents can use.":"Infratex can read stuff like financial statements, scanned reports and tables, and can turn them into structured Markdown, JSON and cited answers your financial AI agents can use, saving you loads of time.",
"Infratex reads loss runs, schedules of values and scanned submissions, turning them into structured Markdown, JSON and cited answers your underwriting agents can use.":"Infratex can read loss runs, schedules of values and scanned submissions and can turn them into structured Markdown, JSON and cited answers your underwriting agents can use, saving you loads of time.",
"Infratex reads your clients’ PDFs, scans, tables and handwriting, turning them into structured Markdown, JSON and cited answers for the AI applications you build.":"Infratex can read your clients’ PDFs, scans, tables and handwriting and can turn them into structured Markdown, JSON and cited answers for the AI applications you build."
}
for i,r in enumerate(revised):
 parts=r["OutreachBody"].split("\n\n")
 parts[0]=["Hey","Hi","Hello"][i%3]+" "+(r["FirstName"] or "there")+","
 parts[-1]=["Best regards,","Kind regards,","Best,","Thanks,","Cheers,"][i%5]+"\nChinmay"
 r["OutreachBody"]="\n\n".join(parts)
 for old,new in replacements.items():r["OutreachBody"]=r["OutreachBody"].replace(old,new)
 assert "\u2014" not in r["OutreachBody"]
assert len(revised)+len(pending)==215
assert len(done)==len(revised)
for filename,rows in [("infratex-personalised-emails.csv",revised),("infratex-needs-more-research.csv",pending),("infratex-rewrite-evidence.csv",audit)]:
 with (P/filename).open("w",encoding="utf-8-sig",newline="") as f:
  w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
with (P/"infratex-personalised-emails.txt").open("w",encoding="utf-8") as f:
 for i,r in enumerate(revised,1):f.write(f"{i}. {r['Company']} | {r['Email']}\nSubject: {r['OutreachSubject']}\n\n{r['OutreachBody']}\n\n")
print(json.dumps({"drafts":len(revised),"remaining_without_draft":len(pending),"new_rewrites":len(audit),"total_accounted":len(revised)+len(pending)}))
