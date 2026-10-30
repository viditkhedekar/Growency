import csv, json, re, collections, sys
from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, KeepTogether, PageBreak, Table, TableStyle
from report_copy import MANUFACTURERS, SOFTWARE, OVERRIDES

OUT=Path(__file__).resolve().parent
DATA=json.loads(Path('/tmp/infratex-new-normalized.json').read_text())
FONT=Path('/Users/Vidit/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/libreoffice-headless/libreoffice/LibreOfficeDev.app/Contents/Resources/fonts/truetype')
pdfmetrics.registerFont(TTFont('DejaVu',str(FONT/'DejaVuSans.ttf')))
pdfmetrics.registerFont(TTFont('DejaVuBold',str(FONT/'DejaVuSans-Bold.ttf')))
pdfmetrics.registerFontFamily('DejaVu',normal='DejaVu',bold='DejaVuBold',italic='DejaVu',boldItalic='DejaVuBold')

def clean(v):
    if v is None or str(v).strip().lower() in ('unknown','none','n/a','nan',''):return ''
    return str(v).strip()

def domain(row):return clean(row['raw']['Domain']).lower().removeprefix('www.')
def has_email(row):return bool(re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+',clean(row['raw']['Public business email']) or clean(row['raw']['General company email'])))

FALLBACK={10:True,11:True,13:False,73:True,87:True,160:False,192:True,207:True,210:True,222:True}
SPECIAL={
62:'A 2020 Esker case study documents supplier-invoice automation. Check the current system and a specific remaining requirement; do not present historical figures as current.',
67:'The reviewed site covers several Polleres businesses. Confirm the plastic subsidiary and its own finance owner.',
68:'This appears to be a sourcing/services business. Confirm the direct-buyer lane and a recurring AP document task.',
73:'An industrial laundry and services group, rather than a conventional manufacturer. Confirm local entity and finance procurement ownership.',
90:'The website presents SERAL; the relationship to the named prospect is unconfirmed. Resolve identity before using a company-specific opener.',
94:'Production outsourcing is confirmed, but supplier-invoice volume and AP ownership are not.',
100:'Construction and electrical services differ from the supplied manufacturing/distribution segment. Confirm a separately scoped direct-buyer campaign.',
119:'The site describes construction staffing. Correct the segment and confirm which MGK/HQ entity owns procurement before outreach.',
123:'An engineering simulation consultancy, rather than a manufacturer. Confirm the separate buyer lane and document workload.',
146:'The current website announces reorganisation of KHT Group and KHT Global. Confirm the current company, products and purchasing owner.',
150:'The homepage presents WOLF METALL. Confirm the relationship to WMetall before personalising or choosing the contracting entity.',
160:'Website retrieval failed in both checks. Business description and country remain supplied-only; a document workflow is unconfirmed.',
210:'SOMA is part of KOSTAL and already sells automation. Confirm the local finance owner and an actual AP gap.',
213:'The broad trading catalogue and supplied Netherlands entity need identity confirmation; no supplier-invoice process was verified.',
222:'The group website shows electrical-distribution equipment. Confirm the German operating entity and local procurement route.',
223:'The supplied company website uses the ASI brand. Confirm the company-to-brand relationship and the correct finance owner.'
}

def make_report(i,row):
    a=row['raw']; ev=json.loads((OUT/'sources'/f'{i:03d}.json').read_text())
    mfg=a['Segment']=='Manufacturers/distributors'
    email=clean(a['Public business email']) or clean(a['General company email'])
    assert has_email(row)
    if mfg:
        business=MANUFACTURERS[i]
        state='hypothesis_only'
        detail='No verified supplier-invoice intake task was found in this bounded pass. Product activity alone does not establish invoice volume or manual work.'
        product=business.lower()
        fields='item references, quantities and unit prices'
        if re.search(r'electron|battery|batteries|connector|cable|power supply|led ',product):fields='part numbers, quantities and unit prices'
        elif re.search(r'chemical|cosmetic|flavour|adhesive|ink|varnish',product):fields='material names, quantities and unit prices'
        elif re.search(r'food|beverage|butter|fruit|fish|olive|grain|juice|chocolate',product):fields='product names, quantities and amounts'
        elif re.search(r'cnc|machin|metalwork|cast|steel|bearing|metal component',product):fields='material or part references, quantities and charges'
        elif re.search(r'services|staffing|simulation|construction projects',product):fields='service descriptions, billed periods and amounts'
        one=f'If supplier invoices arrive as PDFs, Infratex could extract {fields} into an AP review table.'
        two='If orders or delivery records are available, Infratex could prepare line-item comparisons and flag differences for an employee before the agreed export.'
        gap=SPECIAL.get(i,'Confirm the finance/AP owner, invoice formats and recurring volume, current checks, and the destination system. No deployed connection is assumed.')
        if i==62:
            state='historical_document_evidence'
            detail='A 2020 Esker case study reports automated supplier invoices and a Microsoft Dynamics AX connection. The present setup was not confirmed.'
            one='If a current invoice exception remains outside Esker, Infratex could extract its agreed fields into an AP review table.'
            two='If current reviewers need more source evidence, Infratex could prepare invoice-to-order comparisons for a scoped exception test.'
        target='Finance controller / accounts payable owner, then ERP or IT owner'
        lane='Direct manufacturer/distributor buyer' if i not in (68,73,94,100,119,123) else 'Separate direct services buyer'
        body_source=ev.get('url') or a['Website']
    else:
        state,one,two,gap=SOFTWARE[i]
        business={'Financial software':'Financial software','Insurance software':'Insurance software','AI implementation consultancy':'Custom AI delivery'}[a['Segment']] + ' / ' + clean(a['Subsegment']) + '.'
        detail=OVERRIDES.get(i,clean(a['Document workflow / fit']))
        target=clean(a['Target role'])
        lane=a['Segment']
        body_source=ev.get('url') or a['Evidence URL']
        one='Infratex could '+one[0].lower()+one[1:]
        two='Infratex could '+two[0].lower()+two[1:]
    # Recovery via the public web reader is retained beside the original failed retrieval.
    access=bool(FALLBACK.get(i,ev.get('usable')))
    sources=[body_source]
    if i in FALLBACK and FALLBACK[i]:sources.append(a['Website'])
    if i==62:sources.append('https://www.esker.com/sites/default/files/resources_files/005-esker-accounts-payable-case-study-manutan-co.pdf')
    sources=list(dict.fromkeys(sources))
    name=clean(a['Decision-maker']);title=clean(a['Title'])
    contact=(f'Supplied contact: {name}' + (f', {title}' if title else '') + '. ' if name else 'No named decision-maker supplied. ')
    contact+=f'Intended owner: {target}. '
    if 'not a named' in clean(a['Email type']):contact+='The email is a company mailbox, not that person’s verified address.'
    else:contact+='The address and role are supplied; current ownership and deliverability were not retested.'
    if not access:gap+=' Public source access remained incomplete; supplied facts are not independently confirmed.'
    return dict(id=f'IR26-{i:03d}',number=i,company=a['Company'],email=email,country=clean(a['Country']),
                segment=a['Segment'],lane=lane,business=business,detail=detail,option1=one,option2=two,
                contact=contact,gap=gap,document_evidence=state,source_access='accessible' if access else 'incomplete',
                research_status='completed',fit='review_needed',sources=sources,
                source_file=row['source_file'],source_row=row['source_row'],raw=a)

def write_csv(path,rows,headers):
    with path.open('w',encoding='utf-8-sig',newline='') as f:
        w=csv.DictWriter(f,fieldnames=headers,quoting=csv.QUOTE_ALL,extrasaction='ignore');w.writeheader();w.writerows(rows)

def main():
    assert len(DATA['selected'])==250 and len(DATA['pending'])==56 and len(DATA['all'])==500
    reports=[make_report(i,r) for i,r in enumerate(DATA['selected'],1)]
    assert len(MANUFACTURERS)==200 and len(SOFTWARE)==50
    by_domain={domain(row):r for row,r in zip(DATA['selected'],reports)}
    refs=collections.defaultdict(list)
    for row in DATA['all']:refs[domain(row)].append(f"{row['source_file']}:Prospects!{row['source_row']}")
    raw_headers=list(DATA['all'][0]['raw'])
    tracker=[]
    for row in DATA['selected']+DATA['pending']:
        d=domain(row);r=by_domain.get(d)
        tracker.append({**row['raw'],
            'Research ID':r['id'] if r else '',
            'Report status':'Completed' if r else 'Not done - no email',
            'Report date':'2026-10-26' if r else '',
            'Completion note':'Bounded research completed; unresolved facts are recorded' if r else 'Skipped as requested; add an email before the research pass',
            'Fit assessment':r['fit'] if r else 'Not assessed',
            'Document evidence':r['document_evidence'] if r else 'Not assessed',
            'Source access':r['source_access'] if r else 'Not checked',
            'Corrected business summary':r['business'] if r else '',
            'Research finding':r['detail'] if r else '',
            'Infratex option 1':r['option1'] if r else '',
            'Infratex option 2':r['option2'] if r else '',
            'Main gaps':r['gap'] if r else 'No supplied business email',
            'Checked source URLs':' ; '.join(r['sources']) if r else '',
            'All source rows':' ; '.join(refs[d])})
    new_headers=['Research ID','Report status','Report date','Completion note','Fit assessment','Document evidence','Source access','Corrected business summary','Research finding','Infratex option 1','Infratex option 2','Main gaps','Checked source URLs','All source rows']
    write_csv(OUT/'infratex-research-tracker.csv',tracker,new_headers+raw_headers)
    source_rows=[]
    for row in DATA['all']:
        r=by_domain.get(domain(row));eligible=has_email(row)
        source_rows.append({'Source file':row['source_file'],'Source row':row['source_row'],
                           'Email gate':'Has email' if eligible else 'No email',
                           'Row disposition':'Research completed / shared company report' if eligible else 'Skipped - no email in this row',
                           'Company research status':'Completed via an email-bearing row' if r else 'Not done - no email',
                           'Research ID':r['id'] if r else '',**row['raw']})
    write_csv(OUT/'infratex-source-row-log.csv',source_rows,['Source file','Source row','Email gate','Row disposition','Company research status','Research ID']+raw_headers)
    (OUT/'research-records.json').write_text(json.dumps(reports,ensure_ascii=False,indent=2))
    summary={'source_files':2,'source_rows':500,'unique_companies':306,'completed_companies':250,'pending_no_email_companies':56,
             'email_bearing_rows':sum(has_email(r) for r in DATA['all']),'no_email_rows':sum(not has_email(r) for r in DATA['all']),
             'segments':dict(collections.Counter(r['segment'] for r in reports)),
             'source_access':dict(collections.Counter(r['source_access'] for r in reports)),
             'document_evidence':dict(collections.Counter(r['document_evidence'] for r in reports))}
    (OUT/'progress.json').write_text(json.dumps(summary,indent=2))
    make_pdf(reports,summary)
    assert len(tracker)==306 and len(source_rows)==500 and sum(x['Report status']=='Completed' for x in tracker)==250
    assert all(has_email(row) for row in DATA['selected']) and all(not has_email(row) for row in DATA['pending'])
    assert len({x['Research ID'] for x in tracker if x['Research ID']})==250
    for path,n in [('infratex-research-tracker.csv',306),('infratex-source-row-log.csv',500)]:
        assert len(list(csv.DictReader((OUT/path).open(encoding='utf-8-sig',newline=''))))==n
    print(json.dumps(summary))

def make_pdf(reports,summary):
    blue=colors.HexColor('#18344D');teal=colors.HexColor('#146A61');grey=colors.HexColor('#526272')
    styles={
      'title':ParagraphStyle('title',fontName='DejaVuBold',fontSize=25,leading=31,textColor=blue,spaceAfter=16),
      'h':ParagraphStyle('h',fontName='DejaVuBold',fontSize=11,leading=14,textColor=blue,spaceAfter=4),
      'meta':ParagraphStyle('meta',fontName='DejaVu',fontSize=8,leading=11,textColor=grey,spaceAfter=6),
      'body':ParagraphStyle('body',fontName='DejaVu',fontSize=8.7,leading=11.5,spaceAfter=4),
      'help':ParagraphStyle('help',fontName='DejaVu',fontSize=8.7,leading=11.5,textColor=teal,spaceAfter=4),
      'cover':ParagraphStyle('cover',fontName='DejaVu',fontSize=10.5,leading=16,spaceAfter=13),
      'source':ParagraphStyle('source',fontName='DejaVu',fontSize=7,leading=9,textColor=grey,spaceAfter=6)}
    def p(text,style='body'):return Paragraph(text,styles[style])
    story=[Spacer(1,25),p('Infratex<br/>Prospect research reports','title'),p('26 October 2026','cover')]
    story.append(p('250 completed company reports. Two proposed uses per company.','cover'))
    rows=[['Companies covered', '250'],['Companies pending: no email','56'],['Distinct companies across both files','306'],['Original rows reconciled','500'],['Software and AI consultancies','50'],['Separate direct-buyer reports','200']]
    t=Table(rows,colWidths=[350,120],hAlign='LEFT');t.setStyle(TableStyle([('FONTNAME',(0,0),(-1,-1),'DejaVu'),('FONTSIZE',(0,0),(-1,-1),10),('LEADING',(0,0),(-1,-1),14),('BOTTOMPADDING',(0,0),(-1,-1),10),('TOPPADDING',(0,0),(-1,-1),10),('LINEBELOW',(0,0),(-1,-1),.35,colors.HexColor('#D8E1E8')),('TEXTCOLOR',(1,0),(1,-1),blue)]));story.extend([t,Spacer(1,22)])
    for text in [
      'Scope: only companies with a supplied business email were researched. General company mailboxes count as email-bearing leads. Their addresses have not been freshly tested for delivery.',
      'Each report puts two proposed Infratex uses first. Conditional proposals identify a possible task to confirm; they do not establish that the company currently uses those documents or needs another tool.',
      'The research tracker lists all 306 companies as Completed or Not done - no email. The source-row log preserves all 500 original rows, including duplicates and rows that lack an email.',
      'Countries, employee estimates and named contacts are supplied fields unless explicitly confirmed in the report. A completed pass records findings and gaps; all accounts still require buyer and workflow review before qualification.',
      'Financial software, insurance software and AI partners are separate from manufacturers, distributors and direct services buyers. Existing extraction, connected-data inputs and document generation are recorded as counterevidence where relevant.',
      'Public product, help and case-study pages were checked on 26 October 2026. Source links appear in each report. Report IDs match the tracker.']:
        story.append(p(escape(text),'cover'))
    story.append(PageBreak())
    # Preserve original report order. The ID, segment and tracker make mixed batches traceable.
    for n,r in enumerate(reports):
        block=[p(escape(r['id']+'  '+r['company']),'h'),
               p(escape(r['lane']+' | '+r['country']+' (supplied country)')+'<br/>'+escape(r['email']),'meta'),
               p('<b>How Infratex could help - option 1:</b> '+escape(r['option1']),'help'),
               p('<b>Option 2:</b> '+escape(r['option2']),'help'),
               p('<b>Business and document evidence:</b> '+escape(r['business']+' '+r['detail'])),
               p('<b>Contact route:</b> '+escape(r['contact'])),
               p('<b>Fit and next check:</b> '+escape(r['gap']))]
        links=[]
        for j,u in enumerate(r['sources'],1):
            label='Company page' if r['segment']=='Manufacturers/distributors' and j==1 else 'Evidence '+str(j)
            if r['number'] in FALLBACK and j==1 and not FALLBACK[r['number']]:label+=' (not accessible)'
            links.append(f'<link href="{escape(u, {chr(34): "&quot;"})}" color="#146A61">{label}</link>')
        block.append(p('Sources: '+' / '.join(links)+'<br/>Input: '+escape(r['source_file'])+', Prospects row '+str(r['source_row'])+'.','source'))
        block.append(Spacer(1,9))
        story.append(KeepTogether(block))
        if (n+1)%3==0 and n<len(reports)-1:story.append(PageBreak())
    def page(canvas,doc):
        canvas.setFont('DejaVu',7);canvas.setFillColor(grey)
        canvas.drawString(42,25,'Infratex prospect research | 26 October 2026')
        canvas.drawRightString(A4[0]-42,25,str(doc.page))
    doc=SimpleDocTemplate(str(OUT/'infratex-250-research-reports.pdf'),pagesize=A4,leftMargin=42,rightMargin=42,topMargin=35,bottomMargin=40,title='Infratex - 250 prospect research reports',author='Growency')
    doc.build(story,onFirstPage=page,onLaterPages=page)

if __name__=='__main__':main()
