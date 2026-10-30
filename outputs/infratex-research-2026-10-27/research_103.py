import csv,json,re
from pathlib import Path
P=Path(__file__).parent
E=json.loads((P/"new-103-final-evidence.json").read_text())
original={r["company"]:r for r in json.loads((P/"infratex-465-research-records.json").read_text())}
# Reviewed facts. Document presence is distinguished from a hypothetical use.
D="""0|Custom cable assembly|Product/service evidence only|extract cable references from PDF specifications|structure quantities from purchasing documents
1|Energy-efficient lighting, LED technology and backup power|Product/service evidence only|structure power and light-output details from product PDFs|extract equipment references from project quotations
2|T16-L lighting product|Technical PDF located|extract light-output and power figures into a product table|return cited answers about installation requirements
4|Electrical test and measurement equipment|Product catalogue page|structure measurement ranges from datasheets|extract instrument references from PDF orders
5|TBB POWER products|Official operating-manual archive|make operating instructions searchable with citations|structure technical limits from manuals for review
6|Industrial electronics, measurement and network devices|Product catalogue and PDF manuals located|extract device specifications into comparison tables|make instrument instructions searchable
7|DVSB/DWSB electricity meters|Meter handbook PDF opened|structure meter parameters from the handbook|return cited answers about installation and operation
9|Off-grid fuel-cell generators|Product page with downloads navigation|extract fuel and power specifications from technical PDFs|make generator service instructions searchable
11|Manufacturing electronic assemblies and systems|Service page; document intake unconfirmed|extract component references from PDF purchasing files|structure invoice lines for order checks
14|Relay technology|Official site includes downloads|structure relay ratings from technical PDFs|extract relay references and quantities from order documents
15|Transformer stations and power houses|Product page; technical documents not established|structure equipment ratings from specification PDFs|extract requirements from project documents for review
17|Technical manufacturer representation for wholesale and project buyers|Service positioning only|structure product specifications from supplier PDFs|extract item references and prices from quotations
18|SERVOLASER Xpert laser projection|Product datasheet PDF opened|extract model dimensions and specifications into comparison tables|return cited answers from the product sheet
19|Audio systems|Official site includes download resources|structure speaker and amplifier specifications from datasheets|make installation guidance searchable
20|Cables|Official site includes a download centre|extract cable codes and lengths from order PDFs|structure cable specifications from technical sheets
22|Electronic components including wireless and optoelectronics|Product catalogue page|structure component parameters from datasheets|extract part references and quantities from purchasing PDFs
23|Industrial baking cups, trays and cases|Specific product portfolio|extract pack sizes and product codes from order PDFs|structure delivery quantities for order checks
24|Motorcycle suspension products|Product history names KYB suspension|structure model-compatibility details from product PDFs|make suspension service guidance searchable
25|Corrugated, foam and temperature-controlled packaging|Specific product portfolio|extract packaging dimensions from PDF requirements|structure quantities and product codes from order documents
26|Nuclear and particle-physics electronics|Official product divisions|structure instrument parameters from technical PDFs|make operating documentation searchable with citations
28|Commercial interiors and furniture|Supplier Sustainability Review process described|extract supplier evidence from sustainability reports|return cited answers from supplier documentation
29|Compressed-air control and monitoring|Product and engineering positioning|structure controller specifications from technical PDFs|make equipment instructions searchable
30|Micro-transfer printing for photonics integration|Technical process positioning|structure process parameters from technical reports|return cited answers across project documentation
31|Technical and commercial support resources|Document area exists but is reserved|test extraction from authorised technical files|make authorised commercial documents searchable
32|Automated optical and solder-paste inspection|Official imprint identifies specialist scope|structure inspection-system specifications from technical PDFs|make service documentation searchable
34|SLSC boards and desktop products|Dedicated online specifications documentation|structure board parameters into comparison tables|provide cited answers across product specifications
35|Relays and contactors|Official datasheet archive|extract electrical ratings into product tables|return cited answers about operating limits
36|Published company and supplier documentation|Downloads include quality certificates and supply terms|extract certificate dates and scope into review records|return cited answers from supply terms
37|Active harmonic filters|Partner workflow names measurement analysis and a subsequent report|extract agreed figures from analysis reports|make the report findings traceable to their source
38|Solar-energy products including GEN24|Official UK certificates and datasheets page|structure inverter specifications into comparison tables|extract certificate identifiers and scope for review
39|Electrical products|OT240DIM datasheet hosted on company domain|extract product codes and dimensions into catalogue records|return cited answers from the product sheet
40|Pharmaceutical raw materials and specialty chemicals|Sourcing workflow evidenced; document types unknown|structure material properties from supplier specifications if used|extract identifiers from quality documents if received
42|Agronomy, land-use products and services|Group-level positioning; local workflow owner unclear|structure figures from technical reports if used|make product guidance searchable with citations
43|Milling tool holders and accessories|Specific product descriptions|structure tool dimensions from technical PDFs|extract holder references from quotation documents
44|Industrial tooling, cutting and assembly|Official quality-certification downloads|extract certificate dates and scope for review|make supplier quality documents searchable
45|Electronic products and systems|Engineering and production positioning|structure technical requirements from PDF specifications|extract component references from purchasing files
47|B2B wholesale|Retail and distribution buyer positioning|extract product references and quantities from wholesale orders|structure supplier invoice lines for checking
49|High-reliability electronic solutions|Products and manufacturer resources visible|structure component ratings from supplier datasheets|extract part references from purchasing documents
50|Industrial heating products|Zoppas company product and catalogue navigation|structure heater ratings from technical PDFs|extract equipment references from quotations
51|CITYX, URBANX and CARGOX bicycles|Digital-display user manual PDF opened|make display instructions searchable with citations|structure model-specific operating information for support
53|Secure bicycle-storage boxes|Official FAQ explains key, card or code access|structure dimensions and access details from product PDFs|make installation guidance searchable if supplied
54|Insulating and protective sleeving|SI product page names technical datasheets|structure temperature limits into a comparison table|return cited answers from sleeve specifications
56|Electrical installation and building automation|Installer/service business, not confirmed manufacturer|extract requirements from project specifications if supplied|make commissioning documentation searchable if used
57|Bespoke rugs|Product positioning and bespoke service|extract dimensions and finish requirements from PDF briefs|structure order references for production review
58|Materials for PCB, assembly and microelectronics|Specific product categories|structure material properties from supplier datasheets|extract product references from purchasing documents
60|E-bikes|Official manuals and downloads service page|make bike instructions searchable with citations|structure model-specific maintenance guidance
62|Residential mailboxes, access and communication systems|Product portfolio page|structure mailbox and access specifications from product PDFs|make installation manuals searchable if used
64|Electrical machines|Official site includes manufacturing and downloads|structure machine ratings from technical PDFs|extract equipment references from quotations
65|Business display products|Brochure PDFs on Asia-Pacific site; European ownership unresolved|structure display specifications from brochures|return cited answers from approved product documentation
66|Bespoke machine guarding|Design and engineering service page|extract agreed dimensions from PDF project briefs|structure purchased-item details from quotations
71|Printed-circuit-board production|Official PCB manufacturing site|extract agreed board requirements from PDF specifications|structure component and quantity details from purchasing files
73|Cutting tools|Official UK technical instructions and cutting-data resources|structure cutting parameters into review tables|return cited answers from tool instructions
75|Mechanical control systems|Official model portfolio; document intake not established|structure model parameters from technical PDFs|extract item references from order documents
76|Thermal-management equipment|Downloads include safety sheets, certificates and operating instructions|structure product parameters and certificate identifiers|return cited answers from operating instructions
77|Flatbed laminating equipment|Specific machinery portfolio|extract machine specifications from quotation PDFs|make maintenance instructions searchable if supplied
79|Lift controls|Controller and car/landing product categories|structure controller specifications from technical PDFs|make installation instructions searchable if used
80|Dot-matrix printheads and electromechanical OEM components|Specific product portfolio|structure printhead parameters from technical PDFs|extract component references from purchase documents
81|Renol bio-based materials|Material and converting-process positioning|structure material properties from technical PDFs|make processing guidance searchable if supplied
83|Charging stations and electric roads|Products include charging, monitoring and maintenance|structure charging specifications from technical PDFs|make maintenance instructions searchable if supplied
84|INFINICUT mowing equipment|FL22/FL26 technical brochure PDF opened|structure machine specifications from the brochure|return cited answers about the published equipment features
86|Flexible and lightweight photovoltaic panels|Specific product positioning|structure panel power and dimensions from technical PDFs|extract panel references from project quotations
90|Copper busbars, braids and conductors|Specific product catalogue and download navigation|structure conductor dimensions from technical PDFs|extract item references and quantities from order files
94|Electrical motors|Matched group site; exact local product scope needs confirmation|structure motor ratings from technical PDFs|extract model references from quotations
95|Motor control and power distribution|Official catalogue and certificate downloads|structure component ratings from catalogues|extract certificate identifiers and scope for review
97|Engineering and tooling solutions|Product detail too broad in inspected homepage|structure tool specifications if relevant PDFs are supplied|extract item references from purchasing documents
101|Food and confectionery process machinery|Specific systems portfolio|extract process-equipment specifications from technical PDFs|make operating guidance searchable if supplied
102|Intrusion alarm systems|Catalogue and price-list downloads visible|structure alarm product specifications from catalogues|extract item references and prices from price lists"""
mapping={}
for line in D.splitlines():
 i,product,doc,a,b=line.split("|");mapping[int(i)]=(product,doc,a,b)
records=[]
for e in E:
 i=e["index"];o=original[e["company"]];detail=mapping.get(i)
 if detail and e["open_ok"]:
  product,doc,a,b=detail;status="researched";fact=f"{product}. {doc}.";op1=f"Infratex could {a}.";op2=f"Infratex could {b}."
  gap="Document use, volume, current tools and budget owner remain unconfirmed. Proposed applications are hypotheses, not an established buying need."
  if i in {31,65,94,97}:gap="Restricted access, regional ownership or broad product evidence limits this angle. Confirm the relevant local owner and authorised document set."
 else:
  status="unresolved";fact="No sufficiently specific, matched company/document evidence was verified in this bounded pass."
  op1=op2="Not proposed: company-specific evidence is insufficient."
  gap="Official page was unavailable, empty, too broad or mismatched; unrelated search results were discarded. Obtain a current company/product source before drafting."
 records.append({"ResearchID":o["id"],"Company":e["company"],"Email":o["email"],"CountrySupplied":o["country"],"ResearchStatus":status,"Fit":"review_needed","ObservedDetail":fact,"InfratexOption1":op1,"InfratexOption2":op2,"Gaps":gap,"SourceURL":e["source"],"SourceOpened":e["open_ok"],"Checked":"2026-10-27","TargetOwner":"Finance/operations for purchasing; technical/service owner for document search","NextQuestion":"Which of these documents is used repeatedly, who checks it, and what output is needed?"})
with (P/"infratex-103-research.csv").open("w",encoding="utf-8-sig",newline="") as f:
 w=csv.DictWriter(f,fieldnames=list(records[0]));w.writeheader();w.writerows(records)
lines=["# Infratex - research on the 103 remaining prospects","","Checked 27 October 2026. One focused product/document search, a direct page check and one targeted fallback where needed. Search-only or unrelated results do not count as verified research. Product-document availability is not proof of internal manual processing or a buying need. Company addresses are carried forward, not reverified for deliverability.",""]
for r in records:
 lines += [f"## {r['Company']}","",f"- **Research:** {r['ResearchStatus']}; fit remains review_needed. Supplied country: {r['CountrySupplied']}.",f"- **Observed:** {r['ObservedDetail']}",f"- **How Infratex could help, option 1:** {r['InfratexOption1']}",f"- **Option 2:** {r['InfratexOption2']}",f"- **Owner / question:** {r['TargetOwner']}. {r['NextQuestion']}",f"- **Gap:** {r['Gaps']}",f"- **Source:** {r['SourceURL']} (opened: {r['SourceOpened']}). Address carried forward: {r['Email']}.",""]
(P/"infratex-103-research.md").write_text("\n".join(lines))
assert len(records)==103
print(json.dumps({"total":len(records),"researched":sum(r["ResearchStatus"]=="researched" for r in records),"unresolved":sum(r["ResearchStatus"]=="unresolved" for r in records)}))
