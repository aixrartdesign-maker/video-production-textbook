#!/usr/bin/env python3
"""v10 restructure: remove duplicated content, merge overlapping sections, add the scene-light dictionary.
usage: restructure.py <parts_dir> <lang>   (idempotence: run on a fresh copy of the v9.6/v1 parts)"""
import re,sys,os,json,glob
D,L=sys.argv[1],sys.argv[2]
HERE=os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0,HERE); import icons
TX=json.load(open(f'{HERE}/i18n/{L}.json'))
def rd(f): return open(f'{D}/{f}',encoding='utf-8').read()
def wr(f,t): open(f'{D}/{f}','w',encoding='utf-8').write(t)
LOG=[];XLOG=[];DEM={}
def art_span(t,i):
    m=re.search(r'<article class="sec page"[^>]*\bid="'+re.escape(i)+r'"[^>]*>',t)
    assert m,(i,'not found')
    e=t.find('</article>',m.end()); return m.start(),e+len('</article>')
def delete(t,i,redirect=None):
    s,e=art_span(t,i); LOG.append(f'del {i}')
    if redirect:
        sn=re.search(r'<div class="num">([\d.]+)</div>',t[s:e]).group(1); t2=t[:s]+t[e:]
        hs0,he0=art_span(t2,redirect); DEM[sn]=re.search(r'<div class="num">([\d.]+)</div>',t2[hs0:he0]).group(1)
    return t[:s]+t[e:].lstrip('\n')
LAB=re.compile(r'<div class="lab">.*?</dl>\s*</div>',re.S)
def demote(t,src,host):
    s,e=art_span(t,src); A=t[s:e]; t=t[:s]+t[e:].lstrip('\n')
    sn=re.search(r'<div class="num">([\d.]+)</div>',A).group(1); hs0,he0=art_span(t,host); hn=re.search(r'<div class="num">([\d.]+)</div>',t[hs0:he0]).group(1); DEM[sn]=hn
    hdr=re.search(r'<header>(.*?)</header>',A,re.S).group(1)
    h2=re.search(r'<h2>(.*?)</h2>',hdr,re.S).group(1).strip()
    lead=re.search(r'<p class="lead">(.*?)</p>',hdr,re.S)
    body=A[A.find('</header>')+9:A.rfind('</article>')]
    labs=LAB.findall(body); body=LAB.sub('',body)
    chunk=f'\n  <h3 class="merged" style="font-size:13pt;margin:9mm 0 2mm;break-after:avoid">{h2}</h3>'
    if lead: chunk+=f'\n  <p class="mlead" style="font-weight:500;break-after:avoid">{lead.group(1).strip()}</p>'
    chunk+=body.rstrip()+'\n'
    hs,he=art_span(t,host); H=t[hs:he]
    m=LAB.search(H); cut=m.start() if m else H.rfind('</article>')
    H=H[:cut]+chunk.lstrip('\n')+'\n  '+H[cut:]
    end=H.rfind('</article>'); H=H[:end]+'  '+'\n  '.join(labs)+'\n'+H[end:]
    LOG.append(f'merge {src} -> {host}'); return t[:hs]+H+t[he:]

def renumber(t):
    """sequential section numbers inside one part file; returns (text, map old->new, labelmap)"""
    arts=list(re.finditer(r'<article class="sec page"[^>]*\bid="[^"]+"[^>]*>.*?</article>',t,re.S))
    nums=[]; mp={}; lab={}
    for a in arts:
        n=re.search(r'<div class="num">(\d+)\.(\d+)</div>',a.group(0))
        if n: nums.append((a,n.group(1),n.group(2)))
    out=t; shift=0; k=0
    for a,p,s in nums:
        k+=1; old=f'{p}.{s}'; new=f'{p}.{k}'; mp[old]=new
    # rebuild each article
    def fix(a):
        A=a.group(0); n=re.search(r'<div class="num">(\d+)\.(\d+)</div>',A)
        if not n: return A
        new=mp[f'{n.group(1)}.{n.group(2)}']
        A=A[:n.start()]+f'<div class="num">{new}</div>'+A[n.end():]
        c=[0]
        def labn(m):
            c[0]+=1; return m.group(1)+(new if c[0]==1 else f'{new}-{c[0]}')+m.group(3)
        A=re.sub(r'(<div class="lab-n"><small>[^<]*</small>)([^<]*)(</div>)',labn,A)
        letters=[0]
        def ph(m):
            o=m.group(2)+m.group(3); letters[0]+=1; nl=new+chr(64+letters[0]); lab[o]=nl
            return m.group(1)+nl+'</b>'
        A=re.sub(r'(<b>[^<]{0,40}?)(\d+\.\d+)([A-Z])</b>',ph,A)
        return A
    out=re.sub(r'<article class="sec page"[^>]*\bid="[^"]+"[^>]*>.*?</article>',fix,t,flags=re.S)
    return out,{o:n for o,n in mp.items() if o!=n},{o:n for o,n in lab.items() if o!=n}

def xref(t,mp,lab):
    """replace prose references outside svg/num/lab markup"""
    if not mp and not lab: return t,0
    parts=re.split(r'(<svg.*?</svg>|<div class="num">.*?</div>|<div class="lab-n">.*?</div>)',t,flags=re.S)
    cnt=0
    keys=sorted(set(mp)|set(lab),key=len,reverse=True)
    R=re.compile(r'(?<![\d./A-Za-z~$€£¥₩])(?<!\d, )(?<!\d,)('+'|'.join(re.escape(k) for k in keys)+r')(?![\d]|\.\d|:\d|\s?(?:m|mm|cm|kW|K|s|x|%|초|배|stop)(?![A-Za-z]))')
    for i in range(0,len(parts),2):
        def rep(m):
            nonlocal cnt; k=m.group(1); cnt+=1; nv=lab.get(k,mp.get(k,k))
            XLOG.append(parts[i][max(0,m.start()-30):m.start()].replace('\n',' ')[-30:]+'['+k+'→'+nv+']'+parts[i][m.end():m.end()+15].replace('\n',' '))
            return nv
        parts[i]=R.sub(rep,parts[i])
        parts[i]=re.sub(r'(?<![\d.])(\d+\.\d+)(\s*·\s*)\1(?![\d.])',r'\1',parts[i])
    return ''.join(parts),cnt

# ---------------- 1. duplicated photos ----------------
t=rd('part08.html')
fs=[m.start() for m in re.finditer(r'<figure',t)]
i2=[m.start() for m in re.finditer('HOOK-ANOMALY',t)][1]
f0=max(x for x in fs if x<i2); fe=t.find('</figure>',f0)
F=t[f0:fe]; g=F.find('<div class="grid c6 thumbs">'); ge=F.find('<figcaption>')
F=F[:g]+F[ge:]
cap=re.search(r'(<figcaption><b>[^<]*</b>)(.*?)(</figcaption>)',F,re.S)
sent=re.split(r'(?<=。)' if L in ('zh','ja') else r'(?<=[.!?])\s+(?=\S)',cap.group(2).strip()); sent=[x for x in sent if x.strip()]
newcap=' '.join(sent[:-1]) if L not in('zh','ja') else ''.join(sent[:-1])
F=F[:cap.start(2)]+' '+newcap.strip()+F[cap.end(2):]
t=t[:f0]+F+t[fe:]; LOG.append('hook thumbs removed; caption -> '+newcap[-40:])
t=delete(t,'s8-14','s8-4')
wr('part08.html',t)
t=rd('part03.html'); s,e=art_span(t,'s3-7'); A=t[s:e]
assert 'DOF-F11' in A; A=A.replace('img_new/DOF-F11.jpg','img_new/P04-3POINT.jpg',1); t=t[:s]+A+t[e:]
# lens cards
s,e=art_span(t,'s3-4'); A=t[s:e]; cs=[m for m in re.finditer(r'<div class="cards">.*?</div>\s*</div>\s*</div>',A,re.S)]
blk=[m for m in re.finditer(r'<div class="cards">',A)][-1]; j=A.find('<figure',blk.start())
if j<0: j=A.find('<div class="lab"',blk.start())
k=A.rfind('</div>',blk.start(),j)
cards=''.join(f'\n    <div class="card"><h4><small>{a}</small>{b}</h4><ul><li>{c}</li><li>{d}</li></ul></div>' for a,b,c,d in TX['lens'])
A=A[:k]+cards+'\n  '+A[k:]; t=t[:s]+A+t[e:]
s,e=art_span(t,'s3-14'); A=t[s:e]; tb=A.find('</tbody>'); lr=A.rfind('<tr>',0,tb)
rows=''.join(f'<tr><td>{a}</td><td>{b}</td><td>{c}</td><td>{d}</td></tr>\n      ' for a,b,c,d in TX['filt'])
A=A[:lr]+rows+A[lr:]; t=t[:s]+A+t[e:]; wr('part03.html',t); LOG.append('lens cards +3, filter rows +3')
# ---------------- 2. duplicated tables ----------------
t=rd('part05.html'); s,e=art_span(t,'s5-4'); A=t[s:e]
tbs=[m for m in re.finditer(r'<table.*?</table>',A,re.S) if 'J / K / L' in m.group(0)]
assert len(tbs)==1; m=tbs[0]; h=A.rfind('<h3>',0,m.start())
assert A[h:m.start()].count('</h3>')==1 and len(A[h:m.start()])<200
A=A[:h]+A[m.end():].lstrip(); t=t[:s]+A+t[e:]; wr('part05.html',t); LOG.append('5.4 shortcut table removed (kept in appendix)')
t=rd('part01.html'); s,e=art_span(t,'s1-8'); A=t[s:e]; m=re.search(r'\s*<table.*?</table>',A,re.S)
A=A[:m.start()]+A[m.end():]; t=t[:s]+A+t[e:]; wr('part01.html',t); LOG.append('1.8 AI tool table removed (same as 9.9)')
# ---------------- 3. merges ----------------
t=rd('part02.html')
t=demote(t,'s2-17','s2-5'); t=demote(t,'s2-7','s2-6'); t=demote(t,'s2-19','s2-6'); t=demote(t,'s2-14','s2-12')
wr('part02.html',t)
t=rd('part11.html')
t=demote(t,'s11-11','s11-3'); t=demote(t,'s11-13','s11-6'); t=demote(t,'s11-17','s11-10'); t=delete(t,'s11-16','s11-10')
wr('part11.html',t)
# ---------------- 4. appendix ----------------
t=rd('part14a.html'); t=delete(t,'s14-K'); wr('part14a.html',t)
t=rd('part14b.html')
for i in ['app-N','app-V','app-R','app-S']: t=delete(t,i)
wr('part14b.html',t)
t=rd('part00.html'); n0=len(re.findall(r'(부록|Appendix|Anhang|[Пп]риложени\w|附录|付録|Apéndice|Appendice|annexe)(\s?)S(?![A-Za-z0-9])',t))
t=re.sub(r'(부록|Appendix|Anhang|[Пп]риложени\w|附录|付録|Apéndice|Appendice|annexe)(\s?)S(?![A-Za-z0-9])',r'\1\2W',t); wr('part00.html',t); LOG.append(f'appendix S->W refs {n0}')
# ---------------- 5. lighting dictionary ----------------
t=rd('feature_lighting.html')
sm=re.search(r'(<section class="page brk" id="f-lt-setups">\s*<h2 class="spread-title"><small>)([^<]*?)04(</small>)',t)
word=sm.group(2)
plate=re.search(r'<figcaption><b>([^<]*?)LT-4</b>',t).group(1)
# renumber later spreads and the LT-5 plate
t=re.sub(r'(<small>'+re.escape(word)+r')0([56])(</small>)',lambda m:m.group(1)+'0'+str(int(m.group(2))+1)+m.group(3),t)
t=t.replace(f'<b>{plate}LT-5</b>',f'<b>{plate}LT-9</b>')
figs=[]
for gi,(gt,keys) in enumerate(zip(TX['groups'],icons.ORDER)):
    its=''.join(f'<div class="it">{icons.I[k]}<b>{TX["items"][gi*6+j][0]}</b><span>{TX["items"][gi*6+j][1]}<br><em style="font-style:normal;color:#7A1C2B">→ {TX["items"][gi*6+j][2]}</em></span></div>' for j,k in enumerate(keys))
    figs.append(f'<figure class="fg wide lt-dict"><div class="ttl">{"①②③④"[gi]} {gt}</div><div class="grid c3">{its}</div><figcaption><b>{plate}LT-{5+gi}</b> {TX["caps"][gi]}</figcaption></figure>')
sec=(f'\n<!-- ---------- scene-light dictionary (v10) ---------- -->\n<section class="page brk" id="f-lt-dict">\n  <h2 class="spread-title"><small>{word}05</small>{TX["title"]}</h2>\n  <p>{TX["intro"]}</p>\n  '
     +f'<aside class="tip"><b>{TX["note_t"]}</b><p>{TX["note"]}</p></aside>\n  '+'\n  '.join(figs)+'\n</section>\n')
e=t.find('</section>',t.find('id="f-lt-setups"'))+len('</section>')
t=t[:e]+'\n'+sec+t[e:]; wr('feature_lighting.html',t); LOG.append('lighting dictionary spread added')
# ---------------- 6. renumber + cross references ----------------
MP={};LB={}
for f in ['part02.html','part08.html','part11.html']:
    t=rd(f); t,mp,lb=renumber(t); wr(f,t)
    for sn,hn in DEM.items():
        if sn.split('.')[0]==hn.split('.')[0] and f[4:6].lstrip('0')==sn.split('.')[0] or True:
            pass
    MP.update(mp); LB.update(lb); LOG.append(f'{f}: {len(mp)} sections renumbered, {len(lb)} photo labels')
for sn,hn in DEM.items(): MP[sn]=MP.get(hn,hn)
tot=0
for f in sorted(glob.glob(f'{D}/*.html')):
    b=os.path.basename(f); t=rd(b); t,c=xref(t,MP,LB)
    if c: wr(b,t); tot+=c; LOG.append(f'xref {b}: {c}')
json.dump({'sec':MP,'labels':LB},open(f'{D}/../restructure_map.json','w'),ensure_ascii=False,indent=1)
print('\n'.join(LOG)); open(f'{D}/../xref.log','w').write('\n'.join(XLOG))
