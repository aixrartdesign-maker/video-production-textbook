it edition — sources v1 (Produzione video: manuale pratico)

book_it/parts      the translated HTML parts
book_it/img_it    the 40 diagrams re-lettered in this language
build/              build script (build_ml.py + lang_strings.py), finalize_pdf.py and the layout checks
translation/        translation memory (out_it/*.json: key -> translation), style guide INSTRUCTIONS_IT.md,
                    proofreading corrections (proofreading/), assembly and validation scripts
diagrams/           diagram label translations (tr_it/) and the re-lettering tool

Photos and illustrations are shared with the Korean edition: use ../ko/book/img and ../ko/book/img_new
(book_it/img -> ko/book/img, book_it/img_new -> ko/book/img_new); the English sources (../en) supply the skeleton.
Build: python3 translation/assemble.py it ; python3 build/build_ml.py it ; python3 build/finalize_pdf.py book_it <out.pdf> "<title>" "<author>"
(The scripts contain the absolute paths of the working environment; adjust them on another computer.)
