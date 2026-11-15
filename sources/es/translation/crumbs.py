"""Set the running crumbs '<b>PART NN</b>title' to the exact title of that PART's opener. usage: crumbs.py <lang>"""
import json, glob, re, sys, html
lang = sys.argv[1]
sys.path.insert(0, 'build'); from lang_strings import STR
PW = STR[lang]['PART']
H = ''.join(open(f, encoding='utf-8').read() for f in sorted(glob.glob(f'../book_{lang}/parts/*.html')))
titles = {}
for m in re.finditer(r'<section class="part" id="part(\d+)">.*?<h1>(.*?)</h1>', H, re.S):
    titles[int(m.group(1))] = re.sub(r'<.*?>', '', re.sub(r'<br\s*/?>', ' ' if lang not in ('zh', 'ja') else '', m.group(2))).strip()
runs = json.load(open('runs_en.json'))
files = sorted(glob.glob(f'out_{lang}/b*_p*.json')); data = {f: json.load(open(f)) for f in files}
where = {x['key']: (f, i) for f, arr in data.items() for i, x in enumerate(arr)}
n = 0
for part, rs in runs.items():
    for i, r in enumerate(rs):
        m = re.fullmatch(r'<b>PART (\d+)</b>(.+)', r)
        k = f'{part}#{i}'
        if m and k in where and int(m.group(1)) in titles:
            f, j = where[k]
            old = data[f][j][lang]
            mm = re.match(r'(<b>[^<]*</b>)', old)
            new = (mm.group(1) if mm else f'<b>{PW} {m.group(1)}</b>') + html.escape(titles[int(m.group(1))], quote=False)
            if new != old:
                data[f][j][lang] = new; n += 1
for f, arr in data.items(): json.dump(arr, open(f, 'w'), ensure_ascii=False, indent=0)
print(lang, 'titles', len(titles), 'crumbs changed', n)
