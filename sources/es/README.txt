es edition — sources v1 (Producción de video: manual práctico)

book_es/parts      the translated HTML parts
book_es/img_es    the 40 diagrams re-lettered in this language
build/              build script (build_ml.py + lang_strings.py), finalize_pdf.py and the layout checks
translation/        translation memory (out_es/*.json: key -> translation), style guide INSTRUCTIONS_ES.md,
                    proofreading corrections (proofreading/), assembly and validation scripts
diagrams/           diagram label translations (tr_es/) and the re-lettering tool

Photos and illustrations are shared with the Korean edition: use ../ko/book/img and ../ko/book/img_new
(book_es/img -> ko/book/img, book_es/img_new -> ko/book/img_new); the English sources (../en) supply the skeleton.
Build: python3 translation/assemble.py es ; python3 build/build_ml.py es ; python3 build/finalize_pdf.py book_es <out.pdf> "<title>" "<author>"
(The scripts contain the absolute paths of the working environment; adjust them on another computer.)
