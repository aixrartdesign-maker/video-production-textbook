# Translation English → Italian (italiano): textbook «Produzione video: manuale pratico»

Source: the published English edition of a Korean university textbook on video production ("Video Production: A Practical Textbook", author Jia Ahn). You translate it into Italian for a printed book. The text will be printed as it is, so it must be **free of typos and grammar errors**. Quality over speed. Write as a native professional translator of film/video textbooks would: natural, idiomatic Italian, not word-for-word.

## Input / output
- Input: a JSON array of objects `{"key": "...", "en": "<html fragment>"}`.
- Output: the same items in the same order as `{"key": "...", "it": "<html fragment>"}`.
- Write the output as consecutive chunk files with the Write tool: `out_it/bNN_p01.json`, `out_it/bNN_p02.json`, … (NN = your batch number, two digits), each a valid JSON array covering the next ~150 input items, in input order, no gaps, no overlaps. Concatenating the chunks in file-name order must reproduce the full input length and key order exactly. Output only valid JSON (no markdown fences; escape `"` inside strings as `\"`). Do not write any other files.
- Before writing each chunk, re-read it once for typos, accents (è/é, perché, più), apostrophes and elisions, agreement (genere e numero), verb forms, prepositions and terminology.

## Hard rules (the build breaks if violated)
1. Every inline HTML tag in "en" must appear in "it" **unchanged and in the same order** (`<b>`, `</b>`, `<br>`, `<em>`, `<small>`, `<span class="…" style="…">`, `<tspan …>`, `<i>` …). Translate only the text between/around tags. Never add, drop, reorder or edit tags or attributes. If the target word order differs, move the words, not the tags' order.
2. Keep HTML entities as they are (`&amp;`, `&lt;`, `&nbsp;`). Keep `[[MK:…]]` tokens untouched.
3. Translate **all** English prose, headings, labels, table cells, captions and uppercase kickers. Nothing English may remain except: established acronyms and codes (ISO, LUT, PPM, OTS, ELS, LS, FS, KS, MS, BS, CU, ECU, DP, AD, LED, XR, AR, VR, MR, RGB, CMYK, HDR, SDR, 4K, HD, UHD, fps, ND8, SNS, CTA, KPI, OTT), product/brand/software names (Premiere Pro, After Effects, DaVinci Resolve, YouTube Shorts, Instagram Reels, TikTok, Higgsfield, Kling …), titles of works, file names, and the storyboard template labels SIZE, MOVE, N, SE, CUT, REF, SYNC, M, CAP, MUSIC, MUTE.
4. A run that is only a letter, number or acronym (e.g. "A", "CU", "4K") stays unchanged.
5. Length: Italian runs about 15–20 % longer than English. Keep it tight — this book is typeset to the page. Prose may grow by at most ~15 %. **Labels, table cells, figure labels and headings must stay as short as the English or shorter** (use standard abbreviations: ad es., ca., max, min, min., h, fig., n.).
6. Write part references as "PARTE 07" (uppercase PARTE + space + the two-digit number of the source) wherever the source has "PART 07". Write figure references exactly as "Fig. 12" / "Fig. 3-2" (capital F, full stop, one space).

## Typography
- Quotation marks: «…» without inner spaces (inner “…”). Replace English “…” / '…' accordingly. Use the typographic apostrophe ’ (l’inquadratura, un’ora).
- Dashes: parenthetical dash = space + en dash + space ( – ), used sparingly; a colon or comma is often better. In headings, labels, captions and table cells keep the source separator structure (" — " becomes " – "; " · ", "→", "+", "/" unchanged). Ranges without spaces: 1–2, 50–85 mm, 2019–2024.
- Decimal comma for numbers in prose, measurements and settings: 1,5 m · 2,39:1 · f/2,8 · 0,04–0,1 s · 23,976 fps · ×1,5. **Exceptions that keep the dot:** section numbers and cross-references (3.2, 12.14A, «vedi 8.13»), exercise numbers (esercizio 8.12), version numbers, time codes (00:01:12:05), file names, URLs.
- Thousands: dot from five digits on (12.000), none for four digits (5600 K, 2024); never 12,000. Percent without space: 50%. Degrees: 180°.
- Units with a space: 50 mm, 3 m, 15 s, 2 min, 10 h. Keep "fps" and "K".
- Accents: è, cioè, caffè (grave) but perché, né, sé, poiché (acute); capital È (never E'). No accent on qui, qua, fa, sta, do.
- Capitalisation: sentence case in headings and labels; no Title Case; days, months and languages in lower case.
- Address the reader with **tu** (imperative: «Pianifica…»; infinitive in lists/checklists: «Controllare le luci»). Be consistent within a list.
- Gender: the author is a woman (l’autrice). For roles use the generic masculine or neutral nouns (regia, fotografia, troupe, studenti); no asterisks or schwa.
- English film-set terms that are standard in Italian stay (set, storyboard, take, showreel, color grading, green screen, softbox, backstage); they are invariable in the plural (gli storyboard).

## Fixed terms (use exactly; keep consistent across the whole book)
Figure N → Fig. N · Figures N–M → Fig. N–M · Plate X → Tavola X · Reference photos X → Foto di riferimento X · Table N → Tab. N
PART 01 → PARTE 01 · chapter → capitolo · section → sezione · Feature → Speciale · Background N → Contesto N · Introduction → Introduzione
Exercise → Esercizio · Task → Compito · Tip → Consiglio · Assessment / Assessment points → Valutazione / Criteri di valutazione · Model answer → Risposta modello · Materials → Materiali · Check point → Punto di controllo
Questions to consider → Domande per riflettere · One-page summary → Riepilogo in una pagina · Self-check → Autoverifica · Field tips → Consigli dal set · Exercises and review → Esercizi e ripasso · Using this chapter in class → Come usare questo capitolo in aula · Wrap-up → Chiusura
Term → Termine · Note → Nota · Key point → Punto chiave · Case → Caso · Memo / NOTES → Note · Spotlight → In primo piano
Contents → Indice · Colophon → Colophon · Preface → Prefazione · Author's note → Nota dell’autrice · How to read this book → Come leggere questo libro · How to use this book → Come usare questo libro · Learning roadmap → Percorso di studio · Afterword → Postfazione · Appendix → Appendice · List of figures → Indice delle figure · Front matter → Pagine iniziali · Prologue → Prologo
Author → Autrice · Jia Ahn → Jia Ahn · Video Production: A Practical Textbook → Produzione video: manuale pratico · Kyungbok University → Università Kyungbok
shot (unit of filming/editing) → inquadratura · cut (edit point) → taglio (stacco) · scene → scena · sequence → sequenza · take → ciak (take) · storyboard → storyboard · panel → riquadro · action note → nota d’azione · dialogue → dialogo
the line / 180° rule → asse dell’azione / regola dei 180° · over-the-shoulder (OTS) → quinta di spalla (OTS) · two-shot → inquadratura a due · shot sizes: extreme long shot → campo lunghissimo (ELS), long shot → campo lungo (LS), full shot → figura intera (FS), knee shot → piano americano (KS), medium shot → piano medio (MS), bust shot → mezzo primo piano (BS), close-up → primo piano (CU), extreme close-up → primissimo piano (ECU)
eye level / high angle / low angle / bird's-eye / worm's-eye → ad altezza occhi / dall’alto (plongée) / dal basso (contre-plongée) / a volo d’uccello / dal basso estremo · headroom / noseroom / lead room → aria in testa / aria di sguardo / aria di movimento · rule of thirds → regola dei terzi · golden ratio → sezione aurea · leading lines → linee guida
pre-production / production / post-production → pre-produzione / riprese (produzione) / post-produzione · delivery → consegna · set / on location → set / in location · director → regista, as a role: regia · DP → direttore della fotografia (DP) · AD → aiuto regista (AD) · client → cliente · call sheet → ordine del giorno · PPM (pre-production meeting) → PPM (riunione di pre-produzione) · proposal / treatment → proposta · script → sceneggiatura
depth of field → profondità di campo · exposure triangle → triangolo dell’esposizione · aperture → diaframma · shutter speed → tempo di posa · shutter angle → angolo dell’otturatore · ISO → ISO · focal length → lunghezza focale · sensor / crop factor → sensore / fattore di crop · color temperature → temperatura colore · white balance → bilanciamento del bianco · codec → codec · log recording → ripresa in Log · color grading → color grading · color correction → correzione colore · frame rate → frame rate · aspect ratio → formato (aspect ratio) on first mention in an item, then formato · safe zone / title safe / action safe → area di sicurezza / area sicura per i titoli / area sicura per l’azione
key / fill / back (rim) light → luce chiave / luce di riempimento / controluce (luce di taglio) · bounce → pannello riflettente (bounce) · softbox → softbox · chroma key / green screen → chroma key / green screen · LED wall → LED wall · media facade → facciata mediale · anamorphic illusion → illusione anamorfica · media art → media art · immersive content → contenuti immersivi · expanded cinema → cinema espanso
short-form (video) → video brevi (short-form) · showreel → showreel · portfolio → portfolio · thumbnail → miniatura · hook → gancio (hook) · retention → retention (tempo di visione) · reach → copertura · engagement → interazioni · click rate → tasso di clic · generative AI → IA generativa · prompt → prompt · AI (in prose) → IA
Keep Korean names and places in the English romanization used by the source (Seoul → Seul).

## Voice
A seasoned practitioner teaching undergraduates: direct, plain, occasionally aphoristic. Short sentences. No filler. Keep sentence-final punctuation as in the source (no full stop where the English has none).
