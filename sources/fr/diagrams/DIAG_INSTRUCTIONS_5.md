# Translating the text inside the book's diagrams

The textbook "Video Production: A Practical Textbook" has 40 explanatory diagrams (PNG images) whose text is English.
Each diagram will be re-lettered: the English text is removed and your translation is typeset in the same place,
same font, weight, colour and size. Your job is the wording. The translation is printed as is, so it must be free of
typos and grammar errors, and it has to fit the space.

## Input
For every diagram there is a task file `tasks/<stem>.json`:
```
{"stem": "...", "image": "/abs/path/EN-<stem>.png",
 "elements": [{"id": "7", "en": "Overcast window light · low contrast", "role": "label",
               "fits": {"chars_per_line_now": 36, "chars_per_line_max": 44, "chars_per_line_if_shrunk": 54,
                        "lines_now": 1, "lines_max": 1}}, ...]}
```
- `en` is the English text as printed in the image (separators like " · " and " — " are part of it).
- `fits` describes the space: the English uses `chars_per_line_now` characters per line on `lines_now` lines.
  A line can hold about `chars_per_line_max` characters at the same type size, and about `chars_per_line_if_shrunk`
  if the renderer shrinks the type to 82 % (allowed, but less nice). More lines than `lines_max` do not fit.
  The numbers are estimates in characters; capital letters and W/M are wider than average.
  **Chinese and Japanese:** one full-width character (hanzi, kanji, kana, full-width punctuation) is as wide as about
  1.9 Latin characters — count each as 2 when you compare with the `chars_per_line_*` numbers.
- Always open the image with the Read tool before translating it: the picture shows what each label refers to
  (an axis end, a column heading, a step in a flow…), which decides the right word and grammatical form.

## Output
Write `/home/claude/work/ml/diag/tr_<lang>/<stem>.json` (lang = zh, ja, es, it or fr) with the Write tool, one file per diagram:
```
{"0": "translation of element 0", "1": "...", ...}
```
- One entry for every element id of the task file, nothing else. Valid JSON, UTF-8, no comments.
- If an element must stay exactly as it is (a pure number, an acronym, a brand), repeat the English string unchanged.
- The renderer wraps text by itself where `lines_max` > 1. Put an explicit line break `\n` only if a particular
  break point matters (e.g. a two-line heading that must break after a specific word); otherwise do not use `\n`.

## Rules
1. Same terminology as the book. Read the "Typography" and "Fixed terms" sections of
   `/home/claude/work/ml/INSTRUCTIONS_<LANG>.md` (ZH, JA, ES, IT or FR) and use exactly those terms (shot sizes, angles,
   roles, stages of production, etc.) and those number, unit, quotation-mark and spacing conventions.
2. Fit first: prefer the shortest natural wording that keeps the meaning. Labels and table cells are terse (noun phrases;
   in lists, items in one grammatical form). Captions and titles can be full sentences but must stay within
   `chars_per_line_max` × `lines_max`. Use standard abbreviations when needed (see the style guide). Never truncate words.
3. Keep the structure of the English string: separators " · ", " — ", "→", "+", "=", numbering, parentheses
   (Italian and French: " — " becomes " – "; Chinese/Japanese: keep " — " and " · " as printed, with their spaces).
4. Numbers and units exactly as the style guide says (es/it/fr: decimal comma, e.g. 2,39 : 1, f/2,8; zh/ja: decimal point).
   Ranges with an en dash and no spaces (50–85). Years, ratios like 16:9, resolutions (4K, FHD+) and acronyms stay.
   Keep the exact spacing of ratios as printed (e.g. "2.39 : 1" → "2,39 : 1" in es/it/fr).
5. Capitalisation: sentence case (es/it/fr); keep ALL CAPS only for acronyms. Keep sentence-final punctuation as in the
   English (usually none in labels).
6. No English may remain except acronyms/brands/codes (ELS, LS, CU, PPM, VFX, LED, XR, 4K, YouTube…).
7. Elements that are parts of one picture must read consistently (the two ends of an axis, list items in the same
   grammatical form, column headings in the same style).

## When done
Check every file you wrote: valid JSON (run `python3 -c "import json,sys; [json.load(open(f)) for f in sys.argv[1:]]" /home/claude/work/ml/diag/tr_<lang>/<your stems>.json`
on your files), every id present, no English left where a translation is needed, no typos.
Reply with one line per diagram: `<stem>: N elements` and, if any, the ids where you could not fit the meaning into the
space (with a short note).
