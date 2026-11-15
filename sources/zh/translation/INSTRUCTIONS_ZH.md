# Translation English → Simplified Chinese (简体中文, mainland usage): textbook 《视频制作实务教程》

Source: the published English edition of a Korean university textbook on video production ("Video Production: A Practical Textbook", author Jia Ahn). You translate it into Simplified Chinese for a printed book. The text will be printed as it is, so it must be **free of typos and grammar errors**. Quality over speed. Write as a native professional translator of film/video textbooks would: natural, idiomatic Simplified Chinese, not word-for-word.

## Input / output
- Input: a JSON array of objects `{"key": "...", "en": "<html fragment>"}`.
- Output: the same items in the same order as `{"key": "...", "zh": "<html fragment>"}`.
- Write the output as consecutive chunk files with the Write tool: `out_zh/bNN_p01.json`, `out_zh/bNN_p02.json`, … (NN = your batch number, two digits), each a valid JSON array covering the next ~150 input items, in input order, no gaps, no overlaps. Concatenating the chunks in file-name order must reproduce the full input length and key order exactly. Output only valid JSON (no markdown fences; escape `"` inside strings as `\"`). Do not write any other files.
- Before writing each chunk, re-read it once for typos (错别字), wrong characters, missing or doubled characters, punctuation and terminology.

## Hard rules (the build breaks if violated)
1. Every inline HTML tag in "en" must appear in "zh" **unchanged and in the same order** (`<b>`, `</b>`, `<br>`, `<em>`, `<small>`, `<span class="…" style="…">`, `<tspan …>`, `<i>` …). Translate only the text between/around tags. Never add, drop, reorder or edit tags or attributes. If the target word order differs, move the words, not the tags' order.
2. Keep HTML entities as they are (`&amp;`, `&lt;`, `&nbsp;`). Keep `[[MK:…]]` tokens untouched.
3. Translate **all** English prose, headings, labels, table cells, captions and uppercase kickers. Nothing English may remain except: established acronyms and codes (ISO, LUT, PPM, OTS, ELS, LS, FS, KS, MS, BS, CU, ECU, DP, AD, LED, XR, AR, VR, MR, RGB, CMYK, HDR, SDR, 4K, HD, UHD, fps, ND8, SNS, CTA, KPI, OTT), product/brand/software names (Premiere Pro, After Effects, DaVinci Resolve, YouTube Shorts, Instagram Reels, TikTok, Higgsfield, Kling …), titles of works, file names, and the storyboard template labels SIZE, MOVE, N, SE, CUT, REF, SYNC, M, CAP, MUSIC, MUTE.
4. A run that is only a letter, number or acronym (e.g. "A", "CU", "4K") stays unchanged.
5. Length: Chinese is shorter than English; never pad. Labels, table cells and headings must be terse (ideally not more than half the character count of the English).
6. Keep "PART 01" (uppercase PART + space + two-digit number) exactly as in the source wherever it occurs — do not write 第1部分. Write figure references as "图 12" / "图 3-2" with one normal space after 图.

## Typography
- Script: Simplified Chinese only (no Traditional characters, no Japanese kanji forms).
- Punctuation: full-width Chinese punctuation in Chinese text — ，。：；？！、（） — and no space before or after it. Quotation marks “…” (inner ‘…’). Titles of books, films and works in 《…》.
- Dash: the Chinese dash —— (two em dashes, no spaces) in running prose. In headings, labels, captions and table cells keep the source separator exactly as it is (" — ", " · ", "→", "+", "/").
- Ellipsis ……; enumeration comma 、 between parallel items.
- Numbers: Arabic numerals, decimal point (1.5 m, 2.39:1, f/2.8, 23.976 fps). Ranges with an en dash and no spaces: 1–2, 50–85 mm. Thousands without separator or with a comma as in the source (12,000). Percent without space: 50%.
- Units: a normal space between number and Latin unit (50 mm, 3 m, 5600 K, 24 fps); Chinese units directly after the number (15秒, 2分钟, 3小时, 30米 only if the source spells the unit out; if the source uses s/m/mm keep the symbol).
- No space between Chinese characters and Latin letters or digits (写成“使用LUT调色”, “拍摄3个镜头”), except inside Latin phrases and the unit rule above.
- Address the reader with 你 (not 您). Instructions and checklist items in plain imperative or verb-first form (“检查布光”). Concise, written style (书面语), no 儿化, no internet slang.

## Fixed terms (use exactly; keep consistent across the whole book)
Figure N → 图 N · Figures N–M → 图 N–M · Plate X → 图版 X · Reference photos X → 参考照片 X · Table N → 表 N
PART 01 → PART 01 (unchanged) · chapter → 章 · section → 节 · Feature → 专题 · Background N → 背景 N · Introduction → 导言
Exercise → 练习 · Task → 任务 · Tip → 提示 · Assessment / Assessment points → 评价 / 评价要点 · Model answer → 参考答案 · Materials → 准备材料 · Check point → 检查点
Questions to consider → 思考题 · One-page summary → 一页总结 · Self-check → 自我检查 · Field tips → 现场提示 · Exercises and review → 练习与复习 · Using this chapter in class → 本章课堂用法 · Wrap-up → 小结
Term → 术语 · Note → 注意 · Key point → 要点 · Case → 案例 · Memo / NOTES → 笔记 · Spotlight → 聚焦
Contents → 目录 · Colophon → 版权页 · Preface → 前言 · Author's note → 作者的话 · How to read this book → 阅读说明 · How to use this book → 本书使用方法 · Learning roadmap → 学习路线图 · Afterword → 后记 · Appendix → 附录 · List of figures → 图片目录 · Front matter → 卷首 · Prologue → 序章
Author → 作者 · Jia Ahn → Jia Ahn (keep in Latin letters) · Video Production: A Practical Textbook → 《视频制作实务教程》 · Kyungbok University → 庆福大学 (Kyungbok University) on first mention in an item, otherwise 庆福大学
video (the medium) → 视频; moving image in general → 影像 · shot (unit of filming/editing) → 镜头 · cut (edit point) → 剪辑点; a cut as a piece → 镜头 · scene → 场景 (场) · sequence → 段落 · take → 条 (第3条) · storyboard → 分镜 (分镜头脚本) · panel → 分镜格 · action note → 动作说明 · dialogue → 台词
the line / 180° rule → 轴线 / 180度规则 · over-the-shoulder (OTS) → 过肩镜头 (OTS) · two-shot → 双人镜头 · shot sizes: extreme long shot → 大远景 (ELS), long shot → 远景 (LS), full shot → 全景 (FS), knee shot → 中全景 (KS), medium shot → 中景 (MS), bust shot → 近景 (BS), close-up → 特写 (CU), extreme close-up → 大特写 (ECU)
eye level / high angle / low angle / bird's-eye / worm's-eye → 平视 / 俯拍 / 仰拍 / 鸟瞰 / 虫视 · headroom / noseroom / lead room → 头顶空间 / 视线空间 / 运动空间 · rule of thirds → 三分法 · golden ratio → 黄金比例 · leading lines → 引导线
pre-production / production / post-production → 前期筹备 / 拍摄 / 后期制作 · delivery → 交付 · set / on location → 片场 / 外景地 · director → 导演 · DP → 摄影指导 (DP) · AD → 副导演 (AD) · client → 客户 · call sheet → 通告单 · PPM (pre-production meeting) → PPM (拍摄前会议) · proposal / treatment → 策划案 · script → 脚本
depth of field → 景深 · exposure triangle → 曝光三角 · aperture → 光圈 · shutter speed → 快门速度 · shutter angle → 快门角度 · ISO → ISO · focal length → 焦距 · sensor / crop factor → 传感器 / 裁切系数 · color temperature → 色温 · white balance → 白平衡 · codec → 编码格式 · log recording → Log拍摄 · color grading → 调色 · color correction → 校色 · frame rate → 帧率 · aspect ratio → 画幅比 · safe zone / title safe / action safe → 安全区 / 字幕安全区 / 动作安全区
key / fill / back (rim) light → 主光 / 辅光 / 轮廓光 (逆光) · bounce → 反光板 · softbox → 柔光箱 · chroma key / green screen → 色键抠像 / 绿幕 · LED wall → LED墙 · media facade → 媒体立面 · anamorphic illusion → 裸眼3D错视 · media art → 媒体艺术 · immersive content → 沉浸式内容 · expanded cinema → 扩延电影
short-form (video) → 短视频 · showreel → 作品集锦 (Showreel) · portfolio → 作品集 · thumbnail → 封面图 · hook → 开场钩子 · retention → 观看留存 · reach → 触达 · engagement → 互动 · click rate → 点击率 · generative AI → 生成式AI · prompt → 提示词 · AI → AI
Korean personal names and place names: keep the romanization of the source (Seoul → 首尔 and other well-known place names in their standard Chinese form).

## Voice
A seasoned practitioner teaching undergraduates: direct, plain, occasionally aphoristic. Short sentences. No filler. Keep sentence-final punctuation as in the source (no full stop where the English has none).
