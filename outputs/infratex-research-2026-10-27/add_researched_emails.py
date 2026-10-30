import csv
from pathlib import Path
P=Path(__file__).parent
O=P.parent/"infratex-emails-215"
def read(p):return list(csv.DictReader(p.open(encoding="utf-8-sig",newline="")))
research=read(P/"infratex-103-research.csv")
current=read(O/"infratex-personalised-emails.csv")
old={r["Company"]:r for r in read(O/"infratex-215-unwritten-emails.csv")}
for r in research:
 if r["ResearchStatus"]!="researched":continue
 x=old[r["Company"]].copy();parts=x["OutreachBody"].split("\n\n")
 product=r["ObservedDetail"].split(". ")[0].rstrip(".")
 parts[1]=f"Was looking into {r['Company']} and saw your work with {product[0].lower()+product[1:]}. Thought a document workflow around that could be worth testing."
 a=r["InfratexOption1"].removeprefix("Infratex could ").rstrip(".")
 b=r["InfratexOption2"].removeprefix("Infratex could ").rstrip(".")
 parts[3]=f"If these documents are part of your team's workflow, we could {a} or {b}."
 x["OutreachBody"]="\n\n".join(parts);x["OutreachSubject"]=f"helping you work with {product.lower()}"
 current.append(x)
assert len(current)==176
assert len({r["Company"] for r in current})==176
for i,r in enumerate(current):
 parts=r["OutreachBody"].split("\n\n");parts[0]=["Hey","Hi","Hello"][i%3]+" "+(r["FirstName"] or "there")+","
 parts[-1]=["Best regards,","Kind regards,","Best,","Thanks,","Cheers,"][i%5]+"\nChinmay";r["OutreachBody"]="\n\n".join(parts)
 assert "\u2014" not in r["OutreachBody"]
with (O/"infratex-personalised-emails.csv").open("w",encoding="utf-8-sig",newline="") as f:
 w=csv.DictWriter(f,fieldnames=list(current[0]));w.writeheader();w.writerows(current)
with (O/"infratex-personalised-emails.txt").open("w",encoding="utf-8") as f:
 for i,r in enumerate(current,1):f.write(f"{i}. {r['Company']} | {r['Email']}\nSubject: {r['OutreachSubject']}\n\n{r['OutreachBody']}\n\n")
pending=[r for r in research if r["ResearchStatus"]=="unresolved"]
with (O/"infratex-needs-more-research.csv").open("w",encoding="utf-8-sig",newline="") as f:
 w=csv.DictWriter(f,fieldnames=list(pending[0]));w.writeheader();w.writerows(pending)
print("176 drafts; 39 unresolved; 215 accounted for")
