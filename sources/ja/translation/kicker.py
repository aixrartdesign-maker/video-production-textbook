"""'<small>Scene</small>Scene' cards: keep the English term as kicker so it does not repeat the translated title."""
import json, glob, re, sys
lang = sys.argv[1]
runs = json.load(open('runs_en.json'))
files = sorted(glob.glob(f'out_{lang}/b*_p*.json')); data = {f: json.load(open(f)) for f in files}
where = {x['key']: (f, i) for f, arr in data.items() for i, x in enumerate(arr)}
n = 0
for part, rs in runs.items():
    for i, r in enumerate(rs):
        m = re.fullmatch(r'<small>([^<]+)</small>([^<]+)', r)
        if m and m.group(1).strip() == m.group(2).strip():
            k = f'{part}#{i}'; f, j = where[k]
            t = data[f][j][lang]; mm = re.fullmatch(r'<small>([^<]+)</small>(.+)', t)
            if mm and mm.group(1).strip().lower() == mm.group(2).strip().lower():
                data[f][j][lang] = f'<small>{m.group(1)}</small>{mm.group(2)}'; n += 1
for f, arr in data.items(): json.dump(arr, open(f, 'w'), ensure_ascii=False, indent=0)
print(lang, 'kickers set to English', n)
