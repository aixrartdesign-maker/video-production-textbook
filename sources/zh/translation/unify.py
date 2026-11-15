"""Unify structural recurring labels (running heads, box titles) to the majority translation.
usage: unify.py <lang> [--apply]"""
import json, glob, re, sys, collections
lang = sys.argv[1]; apply = '--apply' in sys.argv
runs = json.load(open('runs_en.json'))
files = sorted(glob.glob(f'out_{lang}/b*_p*.json')); data = {f: json.load(open(f)) for f in files}
where = {}
for f, arr in data.items():
    for i, x in enumerate(arr): where[x['key']] = (f, i)
occ = collections.defaultdict(list)
for part, rs in runs.items():
    for i, r in enumerate(rs):
        k = f'{part}#{i}'
        if k in where: occ[r].append((part, k))
n = 0
for en, lst in occ.items():
    parts = {p for p, _ in lst}
    structural = en.startswith('<b>PART') or len(parts) >= 4 and (en.startswith('<b>') or en.startswith('<small>'))
    if not structural: continue
    c = collections.Counter(data[where[k][0]][where[k][1]][lang] for _, k in lst)
    if len(c) < 2: continue
    best = c.most_common(1)[0][0]
    if c.most_common(2)[1][1] == c.most_common(1)[0][1] and not apply: print('  TIE', end=' ')
    print(repr(en[:70]), '=>', repr(best[:60]), {k[:40]: v for k, v in c.items() if k != best})
    for _, k in lst:
        f, i = where[k]
        if data[f][i][lang] != best:
            data[f][i][lang] = best; n += 1
if apply:
    for f, arr in data.items(): json.dump(arr, open(f, 'w'), ensure_ascii=False, indent=0)
print(lang, 'items changed' if apply else 'items to change', n)
