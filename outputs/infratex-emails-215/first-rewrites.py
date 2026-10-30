import csv
from pathlib import Path
p=Path(__file__).parent
with (p/"infratex-215-unwritten-emails.csv").open(encoding="utf-8-sig",newline="") as f:
    rows={r["Company"]:r for r in csv.DictReader(f)}
copy={
"Marine Power Engines":("Saw that Marine Power Engines supplies marine engines and generators. I thought we could help your team test a simpler way to handle supplier paperwork.","We could extract invoice line items into a table for purchase-order checks or turn delivery notes into quantities your team can review.","helping you check engine orders"),
"Simtec Systems":("Saw that Simtec builds simulation equipment. I thought we could help your team test a workflow for supplier documents.","We could extract invoice numbers and line items for purchase-order checks or make delivery-note quantities easier to compare with an order.","helping you check supplier paperwork"),
"Safety Products Holdings GmbH":("Was looking into Safety Products Holdings and its industrial safety products. I thought we could help your finance team test document checks.","We could pull supplier invoice details into a review table or structure delivery-note quantities for checking against orders.","helping you check invoices and deliveries"),
"Norck":("Saw that Norck supplies precision-machined components. I thought we could help with the paperwork around purchasing, if that would be useful.","We could extract part numbers and quantities from supplier invoices or turn delivery notes into a table your team can check against orders.","helping you check component orders"),
"Chip 1 Exchange":("Saw that Chip 1 distributes electronic components. I thought we could help your team test a workflow for purchasing documents.","We could extract part numbers and quantities from invoices or structure delivery-note information for a check against purchase orders.","helping you check component paperwork"),
"Condor Pressure Control GmbH":("Saw that Condor works on industrial pressure controls. I thought we could help your team handle information from supplier documents.","We could pull invoice line items into a format your finance team can review or structure delivery notes for checking quantities against an order.","helping you check supplier documents"),
"LYNXTechnik AG":("Was looking into LYNXTechnik and its broadcast equipment. I thought we could help your team test a way to process supplier paperwork.","We could extract item numbers and prices from invoices or turn delivery notes into structured quantities for your team to check.","helping you process supplier invoices"),
"Phocos":("Saw that Phocos supplies solar power equipment. I thought we could help your team test a workflow for supplier paperwork.","We could prepare invoice line items for checking against purchase orders or extract quantities from delivery notes for review.","helping you check solar equipment orders"),
"ZOPF Energieanlagen GmbH":("Was looking into ZOPF's industrial power electronics. I thought we could help your finance team test document processing.","We could extract invoice totals and line items for your team to check or make delivery-note quantities available alongside purchase-order information.","helping you process purchasing documents"),
"EFD Elektrotechnische Fabrik Düsseldorf GmbH - Sitec":("Saw that Sitec works in electrical manufacturing. I thought we could help your team test a supplier-document workflow.","We could turn supplier invoices into structured line items for finance review or pull quantities from delivery notes for comparison with orders.","helping you review supplier invoices"),
}
out=[]
for company,(opening,options,subject) in copy.items():
 r=rows[company].copy();parts=r["OutreachBody"].split("\n\n");parts[1]=opening;parts[3]=options;r["OutreachBody"]="\n\n".join(parts);r["OutreachSubject"]=subject;out.append(r)
with (p/"infratex-rewritten-first-10.csv").open("w",encoding="utf-8-sig",newline="") as f:
 w=csv.DictWriter(f,fieldnames=list(out[0]));w.writeheader();w.writerows(out)
with (p/"infratex-rewritten-first-10.txt").open("w",encoding="utf-8") as f:
 for i,r in enumerate(out,1):f.write(f"{i}. {r['Company']} | {r['Email']}\nSubject: {r['OutreachSubject']}\n\n{r['OutreachBody']}\n\n")
print("drafted",len(out))
