# Translation English → Japanese (日本語): textbook 『映像制作 実践テキスト』

Source: the published English edition of a Korean university textbook on video production ("Video Production: A Practical Textbook", author Jia Ahn). You translate it into Japanese for a printed book. The text will be printed as it is, so it must be **free of typos and grammar errors**. Quality over speed. Write as a native professional translator of film/video textbooks would: natural, idiomatic Japanese, not word-for-word.

## Input / output
- Input: a JSON array of objects `{"key": "...", "en": "<html fragment>"}`.
- Output: the same items in the same order as `{"key": "...", "ja": "<html fragment>"}`.
- Write the output as consecutive chunk files with the Write tool: `out_ja/bNN_p01.json`, `out_ja/bNN_p02.json`, … (NN = your batch number, two digits), each a valid JSON array covering the next ~150 input items, in input order, no gaps, no overlaps. Concatenating the chunks in file-name order must reproduce the full input length and key order exactly. Output only valid JSON (no markdown fences; escape `"` inside strings as `\"`). Do not write any other files.
- Before writing each chunk, re-read it once for 誤字・脱字、漢字の誤変換、送り仮名、助詞の誤り、表記ゆれ、用語.

## Hard rules (the build breaks if violated)
1. Every inline HTML tag in "en" must appear in "ja" **unchanged and in the same order** (`<b>`, `</b>`, `<br>`, `<em>`, `<small>`, `<span class="…" style="…">`, `<tspan …>`, `<i>` …). Translate only the text between/around tags. Never add, drop, reorder or edit tags or attributes. If the target word order differs, move the words, not the tags' order.
2. Keep HTML entities as they are (`&amp;`, `&lt;`, `&nbsp;`). Keep `[[MK:…]]` tokens untouched.
3. Translate **all** English prose, headings, labels, table cells, captions and uppercase kickers. Nothing English may remain except: established acronyms and codes (ISO, LUT, PPM, OTS, ELS, LS, FS, KS, MS, BS, CU, ECU, DP, AD, LED, XR, AR, VR, MR, RGB, CMYK, HDR, SDR, 4K, HD, UHD, fps, ND8, SNS, CTA, KPI, OTT), product/brand/software names (Premiere Pro, After Effects, DaVinci Resolve, YouTube Shorts, Instagram Reels, TikTok, Higgsfield, Kling …), titles of works, file names, and the storyboard template labels SIZE, MOVE, N, SE, CUT, REF, SYNC, M, CAP, MUSIC, MUTE.
4. A run that is only a letter, number or acronym (e.g. "A", "CU", "4K") stays unchanged.
5. Length: Japanese is usually shorter than English; do not pad. Labels, table cells and headings must be terse (体言止め, ideally no longer than the English in visual width — one kana/kanji is about as wide as two Latin letters).
6. Keep "PART 01" (uppercase PART + space + two-digit number) exactly as in the source wherever it occurs — do not write 第1部. Write figure references as "図 12" / "図 3-2" with one normal space after 図.

## Typography
- Style: 常体(だ・である体)で統一。簡潔な書き言葉。演習や手順の指示は「〜する」「〜を確認する」の形(チェックリストは体言止めまたは動詞終止形で統一)。読者への呼びかけに「あなた」は極力使わない。です・ます体は使わない。
- Punctuation: 、。 full-width; brackets 「…」 (inner 『…』), titles of works 『…』; full-width （ ） around Japanese text; ？！ full-width. No space before or after Japanese punctuation.
- Dash: in running prose use the Japanese dash ―― (two U+2015) or rephrase with a colon/comma; in headings, labels, captions and table cells keep the source separator exactly as it is (" — ", " · ", "→", "+", "/").
- Katakana loanwords: standard industry spelling with long-vowel mark (カメラ, ストーリーボード, ライティング, カラーグレーディング, ポートフォリオ, サムネイル). Compound katakana words: no middle dot unless standard (カラーグレーディング, but ショート・フォーム is ショートフォーム). Personal names with a middle dot (アン・ジア).
- Numbers: half-width Arabic numerals, decimal point (1.5 m, 2.39:1, f/2.8, 23.976 fps). Ranges with an en dash 1–2 or 〜 only if natural (50〜85 mm is fine in prose; in labels keep the source "–"). Thousands as in the source (12,000). Percent without space: 50%.
- Units: Latin unit symbols with a normal space after the number (50 mm, 3 m, 5600 K, 24 fps); Japanese units directly after the number (15秒, 2分, 3時間).
- No space between Japanese characters and Latin letters or digits (「LUTを使う」「3つのショット」), except inside Latin phrases and the unit rule above.
- Kanji/kana usage: 常用漢字, standard okurigana; 形式名詞・補助動詞はひらがな(こと、もの、とき、〜していく、〜できる)。表記を全体で統一する(「撮る/撮影する」「見る/観る」は文脈で、同じ文脈では同じ表記)。

## Fixed terms (use exactly; keep consistent across the whole book)
Figure N → 図 N · Figures N–M → 図 N–M · Plate X → 図版 X · Reference photos X → 参考写真 X · Table N → 表 N
PART 01 → PART 01 (unchanged) · chapter → 章 · section → 節 · Feature → 特集 · Background N → 背景 N · Introduction → はじめに
Exercise → 演習 · Task → 課題 · Tip → ヒント · Assessment / Assessment points → 評価 / 評価のポイント · Model answer → 解答例 · Materials → 準備するもの · Check point → チェックポイント
Questions to consider → 考えてみよう · One-page summary → 1ページまとめ · Self-check → セルフチェック · Field tips → 現場のヒント · Exercises and review → 演習と振り返り · Using this chapter in class → 授業での使い方 · Wrap-up → まとめ
Term → 用語 · Note → 注意 · Key point → ポイント · Case → 事例 · Memo / NOTES → メモ · Spotlight → スポットライト
Contents → 目次 · Colophon → 奥付 · Preface → まえがき · Author's note → 著者より · How to read this book → 本書の読み方 · How to use this book → 本書の使い方 · Learning roadmap → 学習ロードマップ · Afterword → あとがき · Appendix → 付録 · List of figures → 図版一覧 · Front matter → 巻頭 · Prologue → プロローグ
Author → 著者 · Jia Ahn → アン・ジア · Video Production: A Practical Textbook → 『映像制作 実践テキスト』 · Kyungbok University → キョンボク大学校
video (the medium) → 映像; an individual video/clip → 動画 · shot (unit of filming/editing) → ショット · cut (edit point) → カット · scene → シーン · sequence → シークエンス · take → テイク · storyboard → 絵コンテ(ストーリーボード on first mention in a chapter heading is fine; otherwise 絵コンテ) · panel → コマ · action note → ト書き · dialogue → セリフ
the line / 180° rule → イマジナリーライン / 180度ルール · over-the-shoulder (OTS) → 肩越しショット(OTS) · two-shot → ツーショット · shot sizes: extreme long shot → 超ロングショット(ELS), long shot → ロングショット(LS), full shot → フルショット(FS), knee shot → ニーショット(KS), medium shot → ミディアムショット(MS), bust shot → バストショット(BS), close-up → クローズアップ(CU), extreme close-up → 超クローズアップ(ECU)
eye level / high angle / low angle / bird's-eye / worm's-eye → アイレベル / ハイアングル / ローアングル / 俯瞰 / あおり(真下から) · headroom / noseroom / lead room → ヘッドルーム / ノーズルーム / リードルーム · rule of thirds → 三分割法 · golden ratio → 黄金比 · leading lines → リーディングライン
pre-production / production / post-production → プリプロダクション / 撮影(プロダクション) / ポストプロダクション · delivery → 納品 · set / on location → 現場 / ロケ地 · director → 監督(ディレクター for commercials/web) · DP → 撮影監督(DP) · AD → 助監督(AD) · client → クライアント · call sheet → 香盤表 · PPM (pre-production meeting) → PPM(プリプロダクション・ミーティング) · proposal / treatment → 企画書 · script → 脚本(台本)
depth of field → 被写界深度 · exposure triangle → 露出の三角形 · aperture → 絞り · shutter speed → シャッタースピード · shutter angle → シャッターアングル · ISO → ISO感度 (ISO in labels) · focal length → 焦点距離 · sensor / crop factor → センサー / クロップ係数 · color temperature → 色温度 · white balance → ホワイトバランス · codec → コーデック · log recording → Log撮影 · color grading → カラーグレーディング · color correction → カラーコレクション · frame rate → フレームレート · aspect ratio → アスペクト比 · safe zone / title safe / action safe → セーフゾーン / タイトルセーフ / アクションセーフ
key / fill / back (rim) light → キーライト / フィルライト / バックライト(リムライト) · bounce → レフ板(バウンス) · softbox → ソフトボックス · chroma key / green screen → クロマキー / グリーンバック · LED wall → LEDウォール · media facade → メディアファサード · anamorphic illusion → アナモルフィック・イリュージョン(錯視3D) · media art → メディアアート · immersive content → 没入型コンテンツ · expanded cinema → エクスパンデッド・シネマ
short-form (video) → ショート動画 · showreel → ショーリール · portfolio → ポートフォリオ · thumbnail → サムネイル · hook → フック(つかみ) · retention → 視聴維持率 · reach → リーチ · engagement → エンゲージメント · click rate → クリック率 · generative AI → 生成AI · prompt → プロンプト · AI → AI
Korean personal names: katakana (romanization in parentheses only if the source stresses the spelling); well-known place names in standard Japanese form (Seoul → ソウル).

## Voice
A seasoned practitioner teaching undergraduates: direct, plain, occasionally aphoristic. Short sentences. No filler. Keep sentence-final punctuation as in the source (no full stop where the English has none).
