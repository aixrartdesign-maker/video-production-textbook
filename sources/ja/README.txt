ja edition — sources v1 (映像制作 実践テキスト)

book_ja/parts      the translated HTML parts
book_ja/img_ja    the 40 diagrams re-lettered in this language
build/              build script (build_ml.py + lang_strings.py), finalize_pdf.py and the layout checks
translation/        translation memory (out_ja/*.json: key -> translation), style guide INSTRUCTIONS_JA.md,
                    proofreading corrections (proofreading/), assembly and validation scripts
diagrams/           diagram label translations (tr_ja/) and the re-lettering tool

Photos and illustrations are shared with the Korean edition: use ../ko/book/img and ../ko/book/img_new
(book_ja/img -> ko/book/img, book_ja/img_new -> ko/book/img_new); the English sources (../en) supply the skeleton.
Build: python3 translation/assemble.py ja ; python3 build/build_ml.py ja ; python3 build/finalize_pdf.py book_ja <out.pdf> "<title>" "<author>"
(The scripts contain the absolute paths of the working environment; adjust them on another computer.)
