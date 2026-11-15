fr edition — sources v1 (Production vidéo : manuel pratique)

book_fr/parts      the translated HTML parts
book_fr/img_fr    the 40 diagrams re-lettered in this language
build/              build script (build_ml.py + lang_strings.py), finalize_pdf.py and the layout checks
translation/        translation memory (out_fr/*.json: key -> translation), style guide INSTRUCTIONS_FR.md,
                    proofreading corrections (proofreading/), assembly and validation scripts
diagrams/           diagram label translations (tr_fr/) and the re-lettering tool

Photos and illustrations are shared with the Korean edition: use ../ko/book/img and ../ko/book/img_new
(book_fr/img -> ko/book/img, book_fr/img_new -> ko/book/img_new); the English sources (../en) supply the skeleton.
Build: python3 translation/assemble.py fr ; python3 build/build_ml.py fr ; python3 build/finalize_pdf.py book_fr <out.pdf> "<title>" "<author>"
(The scripts contain the absolute paths of the working environment; adjust them on another computer.)
