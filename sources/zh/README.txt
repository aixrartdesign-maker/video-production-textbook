zh edition — sources v1 (视频制作实务教程)

book_zh/parts      the translated HTML parts
book_zh/img_zh    the 40 diagrams re-lettered in this language
build/              build script (build_ml.py + lang_strings.py), finalize_pdf.py and the layout checks
translation/        translation memory (out_zh/*.json: key -> translation), style guide INSTRUCTIONS_ZH.md,
                    proofreading corrections (proofreading/), assembly and validation scripts
diagrams/           diagram label translations (tr_zh/) and the re-lettering tool

Photos and illustrations are shared with the Korean edition: use ../ko/book/img and ../ko/book/img_new
(book_zh/img -> ko/book/img, book_zh/img_new -> ko/book/img_new); the English sources (../en) supply the skeleton.
Build: python3 translation/assemble.py zh ; python3 build/build_ml.py zh ; python3 build/finalize_pdf.py book_zh <out.pdf> "<title>" "<author>"
(The scripts contain the absolute paths of the working environment; adjust them on another computer.)
