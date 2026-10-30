import concurrent.futures, json, re, time
from pathlib import Path
import urllib.request, gzip
from html.parser import HTMLParser

class PageParser(HTMLParser):
    def __init__(self):
        super().__init__();self.skip=0;self.in_title=False;self.in_heading=False;self.title=[];self.description='';self.headings=[];self.heading=[];self.parts=[]
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if tag in ('script','style','noscript','svg'):self.skip+=1
        if tag=='title':self.in_title=True
        if tag in ('h1','h2'):self.in_heading=True;self.heading=[]
        if tag=='meta' and (attrs.get('name','').lower()=='description' or attrs.get('property')=='og:description') and not self.description:self.description=attrs.get('content','')
    def handle_endtag(self,tag):
        if tag in ('script','style','noscript','svg') and self.skip:self.skip-=1
        if tag=='title':self.in_title=False
        if tag in ('h1','h2') and self.in_heading:self.headings.append(' '.join(self.heading));self.in_heading=False
    def handle_data(self,data):
        if not self.skip:
            data=data.strip()
            if data:self.parts.append(data)
            if self.in_title:self.title.append(data)
            if self.in_heading:self.heading.append(data)

OUT = Path(__file__).resolve().parent
DATA = json.loads(Path('/tmp/infratex-new-normalized.json').read_text())
OUT.mkdir(exist_ok=True,parents=True)
(OUT/'sources').mkdir(exist_ok=True)

def fetch(task):
    ident, row = task
    a=row['raw']
    url=a['Website'] if a['Segment']=='Manufacturers/distributors' else a['Evidence URL']
    path=OUT/'sources'/f'{ident:03d}.json'
    if path.exists(): return json.loads(path.read_text())
    result={'id':ident,'company':a['Company'],'requested_url':url,'checked':'2026-10-26'}
    try:
        req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 (compatible; business research)'})
        with urllib.request.urlopen(req,timeout=14) as r:
            content=r.read(3000000)
            result.update(status=r.status,url=r.url)
        if content.startswith(b'\x1f\x8b'): content=gzip.decompress(content)
        soup=PageParser();soup.feed(content.decode('utf-8',errors='replace'))
        result['title']=' '.join(soup.title)
        result['description']=soup.description
        result['headings']=soup.headings[:18]
        text=' '.join(soup.parts)
        result['text']=re.sub(r'\s+',' ',text)[:45000]
        result['mailto']=list(dict.fromkeys(re.findall(r'mailto:([^?"\s>]+)',content.decode('utf-8',errors='replace'))))[:15]
        result['usable']=result['status']==200 and len(text)>150 and not any(t in result['title'].lower() for t in ['just a moment','access denied','attention required','robot or human','security verification'])
    except Exception as e:
        result.update(usable=False,error=type(e).__name__)
    path.write_text(json.dumps(result,ensure_ascii=False))
    return result

if __name__=='__main__':
    started=time.monotonic(); results=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=20) as pool:
        for result in pool.map(fetch,enumerate(DATA['selected'],1)):
            results.append(result)
    (OUT/'web-evidence.json').write_text(json.dumps(results,ensure_ascii=False))
    print(json.dumps({'attempted':len(results),'accessible':sum(x['usable'] for x in results),'elapsed_seconds':round(time.monotonic()-started,1)}))
