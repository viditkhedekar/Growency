import json,csv,re
from pathlib import Path
ROOT=Path('/Users/Vidit/Projects/Growency')
OUT=ROOT/'outputs/infratex-emails-250'
records=json.loads((ROOT/'outputs/infratex-research-2026-10-26/research-records.json').read_text())
copy=json.loads((ROOT/'outputs/growency-email-writer/references/company-copy.json').read_text())
services=copy['infratex_service_by_icp']
generic='At Infratex (infratex.ai), we help companies automate workflows, cutting down the manual work involved in extracting, checking and processing information.'
proof=copy['infratex'][0]['proof'];cta=copy['infratex'][0]['cta']
greetings=['Hey','Hi','Hello'];signoffs=['Best regards,','Kind regards,','Best,','Thanks,','Cheers,']
def phrase(s):
    s=s.rstrip('.').strip()
    m=re.match(r'If (.*?), Infratex could (.*)',s,flags=re.I)
    if m:return m.group(2)+' if '+m.group(1)[0].lower()+m.group(1)[1:]
    return re.sub(r'^Infratex could\s+','',s,flags=re.I)
def first_sentence(s):
    return re.split(r'(?<=[.!?])\s+',s.strip())[0].rstrip('.')
rows=[]
for i,r in enumerate(records):
    a=r['raw']; typ=a['Email type']; named=typ in ('Published named decision-maker address','Published named finance contact')
    person=str(a.get('Decision-maker') or '').strip()
    name=person.split()[0] if named and person and person.lower()!='unknown' else 'there'
    company=r['company']; segment=r['segment']; direct=segment=='Manufacturers/distributors'
    service=generic if direct else services[{'Financial software':'financial-software','Insurance software':'insurance-software','AI implementation consultancy':'ai-implementation-partner'}[segment]]
    if direct:
        observation=first_sentence(r['business'])
        if any(w in observation.lower() for w in ['supplied','confirm','could not','the website','its current page','the polleres group','the reviewed']):
            opening=f'Was looking into {company} and thought that we could help you process supplier documents, if that is relevant to your team.'
        else:
            opening=f'Saw that {company} {observation[0].lower()+observation[1:]}.'
        subject='helping you process supplier documents'
    else:
        detail=first_sentence(r['detail'])
        unverified=r['document_evidence'] in ('supplied_only','no_intake_evidence','data_not_documents','output_only','connected_data','email_extraction','structured_models','viewing_only','storage_or_templates')
        if not unverified and not any(w in detail.lower() for w in ['supplied','could not','unconfirmed','the official site','the public page','a public','its official']):
            if detail.lower().startswith(('its ','the ','a ')):
                opening=f'Was looking into {company} and thought that we could help you work with document information.'
            elif re.match(r'(?i)^(maintains|structures|breaks|turns|provides|delivers|publishes|builds|ingests|extracts|converts|offers|supports|lets|includes|describes|generates|uploads|uses|develops)\b',detail):
                opening=f'Saw that {company} {detail[0].lower()+detail[1:]}.'
            else:
                opening=f'Saw that at {company}, your {detail[0].lower()+detail[1:]}.'
        else: opening=f'Was looking into {company} and thought that we could help you work with document information.'
        subject={'Financial software':'helping you structure financial documents','Insurance software':'helping you structure insurance documents','AI implementation consultancy':'helping you build document workflows'}[segment]
    helptext='We could '+phrase(r['option1'])+' or '+phrase(r['option2'])+'.'
    body=f'{greetings[i%3]} {name},\n\n{opening}\n\n{service}\n\n{helptext}\n\n{proof}\n\n{cta}\n\n{signoffs[i%5]}\nChinmay'
    rows.append({'Email':r['email'],'FirstName':name if name!='there' else '', 'Company':company,'OutreachSubject':subject,'OutreachBody':body,'ResearchID':r['id']})
with (OUT/'infratex-250-emails.csv').open('w',encoding='utf-8',newline='') as f:
    w=csv.DictWriter(f,fieldnames=list(rows[0]),quoting=csv.QUOTE_ALL);w.writeheader();w.writerows(rows)
with (OUT/'infratex-250-emails.txt').open('w',encoding='utf-8') as f:
    f.write('INFRATEX: 250 FIRST EMAILS\n\nThe CSV contains one email per company. For Instantly, map OutreachSubject and OutreachBody as custom variables and use {{OutreachSubject}} and {{OutreachBody}} in the campaign. For Hunter, map them as custom attributes and insert each in the corresponding field. Preview a lead and check line breaks and signature.\n\n')
    for i,r in enumerate(rows,1):f.write(f"{i}. {r['Company']} ({r['ResearchID']})\nTo: {r['Email']}\nSubject: {r['OutreachSubject']}\n\n{r['OutreachBody']}\n\n"+'='*60+'\n\n')
assert len(rows)==250 and len({r['Email'].lower() for r in rows})==250
assert all(proof in r['OutreachBody'] and cta in r['OutreachBody'] and '\u2014' not in r['OutreachBody'] for r in rows)
assert len(list(csv.DictReader((OUT/'infratex-250-emails.csv').open(encoding='utf-8',newline=''))))==250
print('250 email drafts written and CSV checked')
